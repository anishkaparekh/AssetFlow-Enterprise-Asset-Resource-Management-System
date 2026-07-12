const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Allocation = require('../models/Allocation');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/allocations
// @desc    Get all allocations based on role and optional status filters
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;
    const role = req.user.role;
    const userId = req.user.id;

    const filter = {};
    if (status) {
      filter.allocationStatus = status;
    }

    // Role-based authorization filters
    if (role === 'Employee') {
      filter.employeeId = userId;
    } else if (role === 'Department Head') {
      const activeHead = await User.findById(userId);
      const deptFilter = activeHead ? activeHead.departmentId : null;
      if (deptFilter) {
        const deptUsers = await User.find({ departmentId: deptFilter }, '_id');
        const deptUserIds = deptUsers.map(u => u._id);
        filter.employeeId = { $in: deptUserIds };
      } else {
        // If not mapped to a department, department head sees nothing
        return res.json([]);
      }
    }

    const allocations = await Allocation.find(filter)
      .populate('assetId', 'assetTag name category status')
      .populate('employeeId', 'name email role departmentId')
      .populate('allocatedBy', 'name email role')
      .populate('targetHolderId', 'name email role')
      .sort({ createdAt: -1 });

    res.json(allocations);
  } catch (error) {
    console.error('Get allocations error:', error);
    res.status(500).json({ message: 'Server error retrieving allocations' });
  }
});

// @route   GET /api/allocations/:id
// @desc    Get allocation by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const allocation = await Allocation.findById(req.params.id)
      .populate('assetId', 'assetTag name category status')
      .populate('employeeId', 'name email role departmentId')
      .populate('allocatedBy', 'name email role')
      .populate('targetHolderId', 'name email role');

    if (!allocation) {
      return res.status(404).json({ message: 'Allocation record not found' });
    }

    const role = req.user.role;
    const userId = req.user.id;

    // Authorization checks
    if (role === 'Employee' && allocation.employeeId._id.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized to view this allocation' });
    }

    if (role === 'Department Head') {
      const activeHead = await User.findById(userId);
      const headDept = activeHead ? activeHead.departmentId : null;
      const targetUserDept = allocation.employeeId.departmentId;

      if (!headDept || headDept.toString() !== targetUserDept?.toString()) {
        return res.status(403).json({ message: 'Unauthorized to view allocations outside your department' });
      }
    }

    res.json(allocation);
  } catch (error) {
    console.error('Get allocation by ID error:', error);
    res.status(500).json({ message: 'Server error retrieving allocation details' });
  }
});

// @route   POST /api/allocations
// @desc    Create a new asset allocation
// @access  Private (Admin, Asset Manager)
router.post(
  '/',
  authMiddleware,
  authorizeRoles('Admin', 'Asset Manager'),
  async (req, res) => {
    try {
      const { assetId, employeeId, expectedReturnDate } = req.body;

      if (!assetId || !employeeId || !expectedReturnDate) {
        return res.status(400).json({ message: 'assetId, employeeId, and expectedReturnDate are required' });
      }

      const expectedReturn = new Date(expectedReturnDate);
      if (isNaN(expectedReturn.getTime()) || expectedReturn <= new Date()) {
        return res.status(400).json({ message: 'Expected return date must be a valid future date' });
      }

      // 1. Verify employee exists
      const employee = await User.findById(employeeId);
      if (!employee) {
        return res.status(404).json({ message: 'Employee not found' });
      }

      // 2. Find and check asset status
      const asset = await Asset.findById(assetId);
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }

      if (asset.status !== 'Available') {
        return res.status(409).json({ 
          message: `Asset is already occupied. Current status: ${asset.status}` 
        });
      }

      // 3. Create allocation
      const newAllocation = new Allocation({
        assetId,
        employeeId,
        allocatedBy: req.user.id,
        expectedReturnDate: expectedReturn,
        allocationStatus: 'Allocated',
        allocationDate: new Date()
      });

      const savedAllocation = await newAllocation.save();

      // 4. Update asset status
      asset.status = 'Allocated';
      asset.currentHolderId = employeeId;
      await asset.save();

      await savedAllocation.populate('assetId', 'assetTag name category status');
      await savedAllocation.populate('employeeId', 'name email role departmentId');
      await savedAllocation.populate('allocatedBy', 'name email role');

      res.status(201).json({
        message: 'Asset allocated successfully',
        allocation: savedAllocation
      });
    } catch (error) {
      console.error('Create allocation error:', error);
      res.status(500).json({ message: 'Server error creating allocation' });
    }
  }
);

// @route   PUT /api/allocations/:id/return
// @desc    Process return of an asset
// @access  Private (Admin, Asset Manager)
router.put(
  '/:id/return',
  authMiddleware,
  authorizeRoles('Admin', 'Asset Manager'),
  async (req, res) => {
    try {
      const { returnCondition } = req.body;
      const allocationId = req.params.id;

      // 1. Find the allocation
      const allocation = await Allocation.findById(allocationId);
      if (!allocation) {
        return res.status(404).json({ message: 'Allocation record not found' });
      }

      if (allocation.allocationStatus === 'Returned') {
        return res.status(400).json({ message: 'This allocation has already been marked as returned' });
      }

      // 2. Find the asset
      const asset = await Asset.findById(allocation.assetId);
      if (!asset) {
        return res.status(404).json({ message: 'Asset associated with this allocation not found' });
      }

      // 3. Update allocation details
      allocation.allocationStatus = 'Returned';
      allocation.returnedDate = new Date();
      allocation.returnCondition = returnCondition || 'Returned in normal condition';
      await allocation.save();

      // 4. Update asset status
      asset.status = 'Available';
      asset.currentHolderId = null;
      await asset.save();

      res.json({
        message: 'Asset returned successfully',
        allocation,
        asset
      });
    } catch (error) {
      console.error('Return asset error:', error);
      res.status(500).json({ message: 'Server error processing return' });
    }
  }
);

// @route   PUT /api/allocations/:id/request-transfer
// @desc    Request direct transfer of an active allocation to another employee
// @access  Private
router.put('/:id/request-transfer', authMiddleware, async (req, res) => {
  try {
    const { targetHolderId, transferReason } = req.body;
    const allocationId = req.params.id;

    if (!targetHolderId) {
      return res.status(400).json({ message: 'targetHolderId is required' });
    }

    const allocation = await Allocation.findById(allocationId);
    if (!allocation) {
      return res.status(404).json({ message: 'Allocation record not found' });
    }

    if (allocation.allocationStatus !== 'Allocated') {
      return res.status(400).json({ 
        message: `Only currently allocated assets can be transferred. Status: ${allocation.allocationStatus}` 
      });
    }

    // Verify target user exists
    const targetUser = await User.findById(targetHolderId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // Save transfer details in allocation
    allocation.allocationStatus = 'Transfer Requested';
    allocation.targetHolderId = targetHolderId;
    allocation.transferReason = transferReason || 'Direct team transfer';
    await allocation.save();

    await allocation.populate('assetId', 'assetTag name category status');
    await allocation.populate('employeeId', 'name email role departmentId');
    await allocation.populate('targetHolderId', 'name email role');

    res.json({
      message: 'Transfer request submitted successfully',
      allocation
    });
  } catch (error) {
    console.error('Request transfer error:', error);
    res.status(500).json({ message: 'Server error requesting transfer' });
  }
});

// @route   PUT /api/allocations/:id/approve-transfer
// @desc    Approve transfer request and reassign asset ownership
// @access  Private (Admin, Asset Manager, Department Head)
router.put(
  '/:id/approve-transfer',
  authMiddleware,
  authorizeRoles('Admin', 'Asset Manager', 'Department Head'),
  async (req, res) => {
    try {
      const allocationId = req.params.id;

      // 1. Find allocation
      const allocation = await Allocation.findById(allocationId);
      if (!allocation) {
        return res.status(404).json({ message: 'Allocation record not found' });
      }

      if (allocation.allocationStatus !== 'Transfer Requested') {
        return res.status(400).json({ message: 'No pending transfer request found for this allocation' });
      }

      const targetHolderId = allocation.targetHolderId;
      if (!targetHolderId) {
        return res.status(400).json({ message: 'Target transfer recipient is missing from request record' });
      }

      // 2. Find asset
      const asset = await Asset.findById(allocation.assetId);
      if (!asset) {
        return res.status(404).json({ message: 'Asset associated with this allocation not found' });
      }

      // 3. Update allocation details - set employeeId to target, status back to Allocated, and clear request details
      allocation.employeeId = targetHolderId;
      allocation.allocationStatus = 'Allocated';
      allocation.targetHolderId = null;
      allocation.transferReason = null;
      await allocation.save();

      // 4. Update asset holder
      asset.currentHolderId = targetHolderId;
      await asset.save();

      res.json({
        message: 'Transfer approved and ownership successfully reassigned',
        allocation,
        asset
      });
    } catch (error) {
      console.error('Approve transfer error:', error);
      res.status(500).json({ message: 'Server error approving transfer' });
    }
  }
);

module.exports = router;
