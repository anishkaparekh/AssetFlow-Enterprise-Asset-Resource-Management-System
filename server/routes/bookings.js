const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Asset = require('../models/Asset');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/bookings
// @desc    Get all bookings
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('assetId', 'assetTag name category status')
      .populate('employeeId', 'name email role')
      .sort({ startTime: 1 });

    res.json(bookings);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ message: 'Server error retrieving bookings' });
  }
});

// @route   POST /api/bookings
// @desc    Book a resource (asset) for a specific time range
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { assetId, employeeId, startTime, endTime } = req.body;

    if (!assetId || !employeeId || !startTime || !endTime) {
      return res.status(400).json({ message: 'assetId, employeeId, startTime, and endTime are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start or end date format' });
    }

    if (start >= end) {
      return res.status(400).json({ message: 'Start time must be strictly before end time' });
    }

    // Verify employee exists
    const employeeExists = await User.findById(employeeId);
    if (!employeeExists) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Verify asset exists
    const assetExists = await Asset.findById(assetId);
    if (!assetExists) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Query for overlapping active bookings (Exclude status 'Cancelled')
    const overlappingBooking = await Booking.findOne({
      assetId,
      status: { $ne: 'Cancelled' },
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (overlappingBooking) {
      return res.status(409).json({
        message: 'Resource booking conflict: The requested time slot overlaps with an existing booking.',
        conflict: {
          bookingId: overlappingBooking._id,
          startTime: overlappingBooking.startTime,
          endTime: overlappingBooking.endTime
        }
      });
    }

    const newBooking = new Booking({
      assetId,
      employeeId,
      startTime: start,
      endTime: end,
      status: 'Upcoming' // Default status
    });

    const savedBooking = await newBooking.save();

    await savedBooking.populate('assetId', 'assetTag name category status');
    await savedBooking.populate('employeeId', 'name email role');

    res.status(201).json({
      message: 'Resource booked successfully',
      booking: savedBooking
    });
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ message: 'Server error creating booking' });
  }
});

// @route   PUT /api/bookings/:id/cancel
// @desc    Cancel a resource booking
// @access  Private
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status === 'Completed' || booking.status === 'Cancelled') {
      return res.status(400).json({ message: `Booking cannot be cancelled because it is already ${booking.status}` });
    }

    booking.status = 'Cancelled';
    await booking.save();

    await booking.populate('assetId', 'assetTag name category status');
    await booking.populate('employeeId', 'name email role');

    res.json({
      message: 'Booking cancelled successfully',
      booking
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ message: 'Server error cancelling booking' });
  }
});

module.exports = router;
