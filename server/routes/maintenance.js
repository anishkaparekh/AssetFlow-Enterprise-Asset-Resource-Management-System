const express = require('express');
const router = express.Router();
const MaintenanceRequest = require('../models/MaintenanceRequest');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// @route   GET /api/maintenance
// @desc    Get all maintenance requests (scoped to own requests for employees, all for admins/managers)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const isManager = ['admin', 'asset_manager'].includes(req.user.role);
    
    let query = {};
    if (!isManager) {
      query.employeeId = req.user.id;
    }

    const requests = await MaintenanceRequest.find(query)
      .populate('assetId', 'assetTag name category status')
      .populate('employeeId', 'name email role')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ message: 'Server error retrieving maintenance logs' });
  }
});

// @route   GET /api/maintenance/:id
// @desc    Get details of a specific maintenance request
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id)
      .populate('assetId', 'assetTag name category status')
      .populate('employeeId', 'name email role');

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    const isManager = ['admin', 'asset_manager'].includes(req.user.role);
    if (!isManager && request.employeeId._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied to this record' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching maintenance request details:', error);
    res.status(500).json({ message: 'Server error retrieving request details' });
  }
});

// @route   POST /api/maintenance
// @desc    Create a new maintenance request
// @access  Private (Authenticated users)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { assetId, issueTitle, issueDescription, priority } = req.body;

    if (!assetId || !issueTitle || !issueDescription) {
      return res.status(400).json({ 
        message: 'Please provide assetId, issueTitle, and issueDescription' 
      });
    }

    // Verify target asset exists
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Business Rules validation: Only allocated assets can receive maintenance requests
    if (asset.status !== 'Allocated') {
      return res.status(400).json({ 
        message: `Maintenance can only be requested for Allocated assets. Current asset status: ${asset.status}` 
      });
    }

    // Ensure the employee is only requesting for an asset they hold (if not Admin/Manager)
    const isManager = ['admin', 'asset_manager'].includes(req.user.role);
    if (!isManager && asset.currentHolderId && asset.currentHolderId.toString() !== req.user.id) {
      return res.status(403).json({ 
        message: 'Access denied: You can only request maintenance for assets allocated to you.' 
      });
    }

    // Create the request. Status is forced to 'Pending'
    const newRequest = new MaintenanceRequest({
      assetId,
      employeeId: req.user.id,
      issueTitle,
      issueDescription,
      priority: priority || 'Medium',
      status: 'Pending',
    });

    const savedRequest = await newRequest.save();
    const populatedRequest = await MaintenanceRequest.findById(savedRequest._id)
      .populate('assetId', 'assetTag name category status')
      .populate('employeeId', 'name email role');

    // Send notifications to managers
    try {
      const managers = await User.find({ role: { $in: ['admin', 'asset_manager'] } });
      for (const mgr of managers) {
        await createNotification(
          mgr._id,
          'New Maintenance Ticket',
          `Employee ${req.user.name || 'User'} requested maintenance for: ${issueTitle}`,
          'Maintenance Approved'
        );
      }
    } catch (notifErr) {
      console.warn('Notification delivery skipped:', notifErr.message);
    }

    res.status(201).json(populatedRequest);
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    res.status(500).json({ message: 'Server error creating request' });
  }
});

// @route   PUT /api/maintenance/:id
// @desc    Update a maintenance request (Status changes restricted to Asset Managers/Admins)
// @access  Private (Asset Manager/Admin for status, requester for details if still pending)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { status, priority, issueTitle, issueDescription } = req.body;
    const request = await MaintenanceRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    const isManager = ['admin', 'asset_manager'].includes(req.user.role);

    // If changing status, verify caller is Manager/Admin
    if (status && status !== request.status) {
      if (!isManager) {
        return res.status(403).json({ 
          message: 'Access denied: Only Asset Managers/Admins can modify request status' 
        });
      }

      const validStatuses = ['Pending', 'Approved', 'In Progress', 'Completed', 'Rejected'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status transition' });
      }

      // Load associated asset
      const asset = await Asset.findById(request.assetId);
      if (asset) {
        // Automatically sync asset state on approval / completion
        if (status === 'Approved' || status === 'In Progress') {
          asset.status = 'Under Maintenance';
          await asset.save();
        } else if (status === 'Completed') {
          asset.status = 'Available';
          asset.currentHolderId = null;
          await asset.save();
        }
      }

      request.status = status;

      // Send status change notification to employee
      try {
        await createNotification(
          request.employeeId,
          'Maintenance Request Status Updated',
          `Your maintenance request status has been updated to "${status}"`,
          'Maintenance Approved'
        );
      } catch (notifErr) {}
    }

    // Requester can update details only if ticket is still pending
    if (priority || issueTitle || issueDescription) {
      const isOwner = request.employeeId.toString() === req.user.id;
      if (!isOwner && !isManager) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (!isManager && request.status !== 'Pending') {
        return res.status(400).json({ 
          message: 'Cannot edit request details once it has been processed' 
        });
      }

      if (priority) {
        const validPriorities = ['Low', 'Medium', 'High'];
        if (!validPriorities.includes(priority)) {
          return res.status(400).json({ message: 'Invalid priority assignment' });
        }
        request.priority = priority;
      }
      if (issueTitle) request.issueTitle = issueTitle;
      if (issueDescription) request.issueDescription = issueDescription;
    }

    await request.save();
    const populatedRequest = await MaintenanceRequest.findById(request._id)
      .populate('assetId', 'assetTag name category status')
      .populate('employeeId', 'name email role');

    res.json(populatedRequest);
  } catch (error) {
    console.error('Error updating maintenance request:', error);
    res.status(500).json({ message: 'Server error updating request' });
  }
});

// @route   DELETE /api/maintenance/:id
// @desc    Delete a maintenance request (Admin/Asset Manager only)
// @access  Private (Admin/Asset Manager)
router.delete('/:id', authMiddleware, authorizeRoles('admin', 'asset_manager'), async (req, res) => {
  try {
    const request = await MaintenanceRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Maintenance request not found' });
    }

    await MaintenanceRequest.deleteOne({ _id: req.params.id });
    res.json({ message: 'Maintenance request deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    res.status(500).json({ message: 'Server error deleting request' });
  }
});

module.exports = router;
