const mongoose = require('mongoose');

const TransferRequestSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset ID is required'],
    },
    currentHolderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Current holder ID is required'],
    },
    targetHolderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target holder ID is required'],
    },
    status: {
      type: String,
      enum: ['Requested', 'Approved', 'Rejected'],
      default: 'Requested',
    },
    requestReason: {
      type: String,
      required: [true, 'Reason for transfer is required'],
      trim: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actionedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

TransferRequestSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('TransferRequest', TransferRequestSchema);
