const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'Asset Assigned',
        'Asset Returned',
        'Maintenance Approved',
        'Booking Confirmed',
        'Transfer Approved',
        'Overdue Return',
      ],
      required: [true, 'Notification type is required'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

NotificationSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Notification', NotificationSchema);
