const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Asset reference is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
    },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Rejected', 'Cancelled'],
      default: 'Pending',
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
  },
  {
    timestamps: true,
  }
);

BookingSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Booking', BookingSchema);
