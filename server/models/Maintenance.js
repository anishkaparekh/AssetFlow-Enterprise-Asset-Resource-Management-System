const mongoose = require('mongoose');

const MaintenanceSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
    },
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester reference is required'],
    },
    description: {
      type: String,
      required: [true, 'Maintenance description is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'In Progress', 'Resolved'],
      default: 'Pending',
    },
    cost: {
      type: Number,
      default: 0,
    },
    comments: {
      type: String,
      trim: true,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

MaintenanceSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Maintenance', MaintenanceSchema);
