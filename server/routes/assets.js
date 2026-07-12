const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// @route   POST /api/assets
// @desc    Register a new asset
// @access  Private (Admin, Asset Manager)
router.post(
  '/',
  authMiddleware,
  authorizeRoles('Admin', 'Asset Manager'),
  async (req, res) => {
    try {
      const { assetTag, name, category, departmentId } = req.body;

      if (!assetTag || !name || !category) {
        return res.status(400).json({ message: 'Please provide assetTag, name, and category' });
      }

      const existingAsset = await Asset.findOne({ assetTag });
      if (existingAsset) {
        return res.status(400).json({ message: `Asset tag '${assetTag}' is already registered` });
      }

      const newAsset = new Asset({
        assetTag,
        name,
        category,
        departmentId: departmentId || null,
        status: 'Available',
      });

      const savedAsset = await newAsset.save();
      res.status(201).json({
        message: 'Asset registered successfully',
        asset: savedAsset,
      });
    } catch (error) {
      console.error('Register asset error:', error);
      res.status(500).json({ message: 'Server error registering asset' });
    }
  }
);

// @route   GET /api/assets
// @desc    Get all assets (with optional status and category filtering)
// @access  Private (All authenticated users)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, category } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (category) {
      filter.category = { $regex: new RegExp(`^${category}$`, 'i') };
    }

    const assets = await Asset.find(filter)
      .populate('currentHolderId', 'name email role')
      .sort({ createdAt: -1 });

    res.json(assets);
  } catch (error) {
    console.error('Get assets error:', error);
    res.status(500).json({ message: 'Server error retrieving assets' });
  }
});

// @route   PUT /api/assets/:id/status
// @desc    Manually update asset status
// @access  Private (Admin, Asset Manager)
router.put(
  '/:id/status',
  authMiddleware,
  authorizeRoles('Admin', 'Asset Manager'),
  async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = [
        'Available',
        'Allocated',
        'Reserved',
        'Under Maintenance',
        'Lost',
        'Retired',
        'Disposed',
      ];

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid asset status value' });
      }

      const asset = await Asset.findById(req.params.id);
      if (!asset) {
        return res.status(404).json({ message: 'Asset not found' });
      }

      asset.status = status;
      
      if (['Available', 'Lost', 'Retired', 'Disposed'].includes(status)) {
        asset.currentHolderId = null;
      }

      const updatedAsset = await asset.save();
      await updatedAsset.populate('currentHolderId', 'name email role');

      res.json({
        message: 'Asset status updated successfully',
        asset: updatedAsset,
      });
    } catch (error) {
      console.error('Update asset status error:', error);
      res.status(500).json({ message: 'Server error updating asset status' });
    }
  }
);

module.exports = router;
