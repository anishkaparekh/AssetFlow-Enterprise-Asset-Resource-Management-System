const express = require('express');
const router = express.Router();
const TransferRequest = require('../models/TransferRequest');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// @route   GET /api/transfers
// @desc    Get all transfer requests
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const transfers = await TransferRequest.find()
      .populate('assetId', 'assetTag name category status')
      .populate('currentHolderId', 'name email role')
      .populate('targetHolderId', 'name email role')
      .populate('approvedBy', 'name email role')
      .sort({ createdAt: -1 });

    res.json(transfers);
  } catch (error) {
    console.error('Get transfers error:', error);
    res.status(500).json({ message: 'Server error retrieving transfer requests' });
  }
});

// @route   POST /api/transfers
// @desc    Create a transfer request for an allocated asset
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { assetId, targetHolderId, requestReason } = req.body;

    if (!assetId || !targetHolderId || !requestReason) {
      return res.status(400).json({ message: 'assetId, targetHolderId, and requestReason are required' });
    }

    // 1. Check target user exists
    const targetUser = await User.findById(targetHolderId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target employee not found' });
    }

    // 2. Check asset exists and is currently allocated
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.status !== 'Allocated' || !asset.currentHolderId) {
      return res.status(400).json({ message: 'Asset must be currently Allocated to be transferred' });
    }

    if (asset.currentHolderId.toString() === targetHolderId.toString()) {
      return res.status(400).json({ message: 'Asset is already allocated to the target employee' });
    }

    // 3. Create transfer request
    const newTransfer = new TransferRequest({
      assetId,
      currentHolderId: asset.currentHolderId,
      targetHolderId,
      requestReason,
      status: 'Requested'
    });

    const savedTransfer = await newTransfer.save();

    await savedTransfer.populate('assetId', 'assetTag name category status');
    await savedTransfer.populate('currentHolderId', 'name email role');
    await savedTransfer.populate('targetHolderId', 'name email role');

    res.status(201).json({
      message: 'Transfer request created successfully',
      transferRequest: savedTransfer
    });
  } catch (error) {
    console.error('Create transfer error:', error);
    res.status(500).json({ message: 'Server error creating transfer request' });
  }
});

// @route   PUT /api/transfers/:id/action
// @desc    Approve or reject a transfer request
// @access  Private (Admin, Asset Manager, Department Head)
router.put(
  '/:id/action',
  authMiddleware,
  authorizeRoles('admin', 'asset_manager', 'department_head'),
  async (req, res) => {
    try {
      const { action } = req.body; // 'Approve' or 'Reject'
      const transferId = req.params.id;

      if (!action || !['Approve', 'Reject'].includes(action)) {
        return res.status(400).json({ message: 'Action must be Approve or Reject' });
      }

      // 1. Find transfer request
      const transfer = await TransferRequest.findById(transferId);
      if (!transfer) {
        return res.status(404).json({ message: 'Transfer request not found' });
      }

      if (transfer.status !== 'Requested') {
        return res.status(400).json({ message: `Transfer request is already ${transfer.status}` });
      }

      // 2. Action request
      if (action === 'Approve') {
        // Find asset
        const asset = await Asset.findById(transfer.assetId);
        if (!asset) {
          return res.status(404).json({ message: 'Asset not found' });
        }

        // Reassign the asset to the target holder
        asset.currentHolderId = transfer.targetHolderId;
        await asset.save();

        transfer.status = 'Approved';
      } else {
        transfer.status = 'Rejected';
      }

      transfer.approvedBy = req.user.id;
      transfer.actionedAt = new Date();
      await transfer.save();

      // Populate response
      await transfer.populate('assetId', 'assetTag name category status');
      await transfer.populate('currentHolderId', 'name email role');
      await transfer.populate('targetHolderId', 'name email role');
      await transfer.populate('approvedBy', 'name email role');

      res.json({
        message: `Transfer request ${action.toLowerCase()}d successfully`,
        transferRequest: transfer
      });
    } catch (error) {
      console.error('Action transfer error:', error);
      res.status(500).json({ message: 'Server error actioning transfer request' });
    }
  }
);

module.exports = router;
