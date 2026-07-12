const mongoose = require('mongoose');

const AllocationSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset ID is required'],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Employee ID is required'],
    },
    allocatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Allocating administrator/manager ID is required'],
    },
    allocationDate: {
      type: Date,
      default: Date.now,
    },
    expectedReturnDate: {
      type: Date,
      required: [true, 'Expected return date is required'],
    },
    returnedDate: {
      type: Date,
      default: null,
    },
    allocationStatus: {
      type: String,
      enum: ['Allocated', 'Returned', 'Transfer Requested'],
      default: 'Allocated',
    },
    targetHolderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    transferReason: {
      type: String,
      default: null,
    },
    returnCondition: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

AllocationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Allocation', AllocationSchema);
