const express = require('express');
const router = express.Router();
const Maintenance = require('../models/Maintenance');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationHelper');

// @route   GET /api/maintenance
// @desc    Get maintenance requests list (Scoped for users)
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const isManager = ['Admin', 'Asset Manager'].includes(req.user.role);
    
    let query = {};
    if (!isManager) {
      // Employees and Dept Heads view only their own requests
      query.requesterId = req.user.id;
    }

    const requests = await Maintenance.find(query)
      .populate('assetId', 'assetTag name category status')
      .populate('requesterId', 'name email role')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ message: 'Server error retrieving maintenance logs' });
  }
});

// @route   POST /api/maintenance
// @desc    Raise a new maintenance request
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { assetId, description } = req.body;

    if (!assetId || !description) {
      return res.status(400).json({ message: 'Please provide asset reference and description' });
    }

    // Verify asset exists
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const newRequest = new Maintenance({
      assetId,
      requesterId: req.user.id,
      description,
      status: 'Pending',
    });

    const savedRequest = await newRequest.save();
    const populatedRequest = await Maintenance.findById(savedRequest._id)
      .populate('assetId', 'assetTag name category status');

    // Notify Asset Managers / Admins that a new request was raised
    const managers = await User.find({ role: { $in: ['Admin', 'Asset Manager'] } });
    for (const mgr of managers) {
      await createNotification(
        mgr._id,
        'New Maintenance Ticket',
        `Employee ${req.user.name || 'User'} raised a maintenance request for asset ${asset.name} (${asset.assetTag}).`,
        'Booking Confirmed' // using a standard category
      );
    }

    res.status(201).json({
      message: 'Maintenance request filed successfully',
      request: populatedRequest,
    });
  } catch (error) {
    console.error('Error raising maintenance request:', error);
    res.status(500).json({ message: 'Server error filing maintenance ticket' });
  }
});

// @route   PUT /api/maintenance/:id/status
// @desc    Update maintenance request status (Admin/Asset Manager only)
// @access  Private (Admin, Asset Manager)
router.put(
  '/:id/status',
  authMiddleware,
  authorizeRoles('Admin', 'Asset Manager'),
  async (req, res) => {
    try {
      const { status, cost, comments } = req.body;
      const validStatuses = ['Pending', 'Approved', 'Rejected', 'In Progress', 'Resolved'];

      if (!status) {
        return res.status(400).json({ message: 'Status field is required' });
      }

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      const request = await Maintenance.findById(req.params.id);
      if (!request) {
        return res.status(404).json({ message: 'Maintenance record not found' });
      }

      const asset = await Asset.findById(request.assetId);
      if (!asset) {
        return res.status(404).json({ message: 'Associated asset not found' });
      }

      // Update parameters
      request.status = status;
      if (cost !== undefined) request.cost = cost;
      if (comments !== undefined) request.comments = comments;

      // Handle lifecycle triggers
      if (status === 'Approved') {
        // Automatically set asset status to 'Under Maintenance'
        asset.status = 'Under Maintenance';
        await asset.save();
        
        request.startDate = new Date();

        // Notify employee
        await createNotification(
          request.requesterId,
          'Maintenance Approved',
          `Your maintenance request for asset ${asset.name} has been approved. It is now flagged as Under Maintenance.`,
          'Maintenance Approved'
        );
      } 
      
      else if (status === 'In Progress') {
        // Double-check asset is Under Maintenance
        if (asset.status !== 'Under Maintenance') {
          asset.status = 'Under Maintenance';
          await asset.save();
        }
        if (!request.startDate) {
          request.startDate = new Date();
        }
      } 
      
      else if (status === 'Resolved') {
        // Automatically restore asset status to 'Available'
        asset.status = 'Available';
        // Clear current holder (assumed returned post maintenance)
        asset.currentHolderId = null;
        await asset.save();

        request.endDate = new Date();

        // Notify employee
        await createNotification(
          request.requesterId,
          'Maintenance Resolved',
          `Your maintenance ticket for asset ${asset.name} has been resolved. The asset is back in the Available pool.`,
          'Asset Returned'
        );
      } 
      
      else if (status === 'Rejected') {
        // Notify employee
        await createNotification(
          request.requesterId,
          'Maintenance Rejected',
          `Your maintenance ticket for asset ${asset.name} has been rejected. Comment: ${comments || 'No comment provided.'}`,
          'Asset Returned'
        );
      }

      const savedRequest = await request.save();
      const populatedRequest = await Maintenance.findById(savedRequest._id)
        .populate('assetId', 'assetTag name category status')
        .populate('requesterId', 'name email role');

      res.json({
        message: `Maintenance request status updated to ${status}`,
        request: populatedRequest,
      });
    } catch (error) {
      console.error('Error updating maintenance status:', error);
      res.status(500).json({ message: 'Server error updating maintenance ticket' });
    }
  }
);

module.exports = router;
