const Notification = require('../models/Notification');

/**
 * Creates and saves a notification in the database for a specific user
 * @param {string} userId - ID of the recipient user
 * @param {string} title - Title of the notification
 * @param {string} message - Detailed notification message
 * @param {string} type - Enum type matching the Notification model list
 */
const createNotification = async (userId, title, message, type) => {
  try {
    if (!userId) {
      console.warn('Notification skipped: No recipient userId provided.');
      return null;
    }
    
    const notification = new Notification({
      userId,
      title,
      message,
      type,
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Failed to create notification record:', error.message);
    return null;
  }
};

module.exports = { createNotification };
