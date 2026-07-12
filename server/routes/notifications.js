const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authMiddleware } = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get all notifications for logged-in user
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error retrieving notifications' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications for logged-in user as read
// @access  Private
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error updating notifications' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a specific notification as read
// @access  Private
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    const updatedNotification = await notification.save();
    
    res.json(updatedNotification);
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ message: 'Server error updating notification status' });
  }
});

module.exports = router;
