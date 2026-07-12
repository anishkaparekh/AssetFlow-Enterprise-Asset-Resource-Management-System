const express = require('express');
const router = express.Router();
const Allocation = require('../models/Allocation');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/allocations
// @desc    Get all allocations (with optional status filtering)
// @access  Private (Admin, Asset Manager)
router.get(
  '/',
  authMiddleware,
  authorizeRoles('admin', 'asset_manager'),
  async (req, res) => {
    try {
      const { status } = req.query;
      const filter = {};
      if (status) filter.status = status;

      const allocations = await Allocation.find(filter)
        .populate('assetId', 'assetTag name category status')
        .populate('employeeId', 'name email role')
        .sort({ createdAt: -1 });

      res.json(allocations);
    } catch (error) {
      console.error('Get allocations error:', error);
      res.status(500).json({ message: 'Server error retrieving allocations' });
    }
  }
);

// @route   POST /api/allocations
// @desc    Allocate an available asset to an employee (Admin or Asset Manager only)
// @access  Private (Admin, Asset Manager)
router.post(
  '/',
  authMiddleware,
  authorizeRoles('admin', 'asset_manager'),
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
          message: `Asset is not available for allocation. Current status: ${asset.status}` 
        });
      }

      // 3. Create allocation
      const newAllocation = new Allocation({
        assetId,
        employeeId,
        expectedReturnDate: expectedReturn,
        status: 'Active',
        allocatedAt: new Date()
      });

      const savedAllocation = await newAllocation.save();

      // 4. Update asset state
      asset.status = 'Allocated';
      asset.currentHolderId = employeeId;
      await asset.save();

      // Populate response
      await savedAllocation.populate('assetId', 'assetTag name category status');
      await savedAllocation.populate('employeeId', 'name email role');

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
// @desc    Process returning an allocated asset (Admin or Asset Manager only)
// @access  Private (Admin, Asset Manager)
router.put(
  '/:id/return',
  authMiddleware,
  authorizeRoles('admin', 'asset_manager'),
  async (req, res) => {
    try {
      const { returnCondition } = req.body;
      const allocationId = req.params.id;

      // 1. Find the allocation
      const allocation = await Allocation.findById(allocationId);
      if (!allocation) {
        return res.status(404).json({ message: 'Allocation record not found' });
      }

      if (allocation.status === 'Returned') {
        return res.status(400).json({ message: 'This allocation has already been marked as returned' });
      }

      // 2. Find the asset
      const asset = await Asset.findById(allocation.assetId);
      if (!asset) {
        return res.status(404).json({ message: 'Asset associated with this allocation not found' });
      }

      // 3. Update allocation history
      allocation.status = 'Returned';
      allocation.returnedAt = new Date();
      allocation.returnCondition = returnCondition || 'Returned in normal condition';
      await allocation.save();

      // 4. Revert asset status and remove holder
      asset.status = 'Available';
      asset.currentHolderId = null;
      await asset.save();

      res.json({
        message: 'Asset returned and inventory updated successfully',
        allocation,
        asset
      });
    } catch (error) {
      console.error('Return asset error:', error);
      res.status(500).json({ message: 'Server error processing return' });
    }
  }
);

module.exports = router;
