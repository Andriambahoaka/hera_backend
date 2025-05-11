
const Notification = require('../models/Notification');

exports.postNotification = async (req, res) => {
    try {
      const notification = new Notification(req.body);
      await notification.save();
      res.status(201).json({ message: 'Notification created', data: notification });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(400).json({ error: 'Failed to create notification', details: error.message });
    }
  };