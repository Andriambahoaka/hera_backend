
const Notification = require('../models/Notification');
const admin = require('../config/firebase.js');


const getMessageBodyFromMsgType = (msgType) => {
    switch (msgType) {
      case 'RCEmergencyCall':
        return 'Une intrusion a été détectée';
      case 'offline':
        return 'Vous êtes offline';
      case 'online':
        return 'Vous êtes online';
      default:
        return 'Nouvelle notification reçue';
    }
  };




exports.postNotification = async (req, res) => {
    try {
      const notification = new Notification(req.body);
      await notification.save();

      const body = getMessageBodyFromMsgType(notification.msgType);

      const message = {
        token: "f1AjY6geScq4eqydeZG0p3:APA91bG31b1p6xjkE6HltXGgwTsV2IUGH9Dshdn8htqK68Y1p2TTopZNPR9OgpHJY0kGtZT8F8B-ZlF2oXrIBJR08zdO0K9qYJL5IY5a5_DsbwDKMu3RPdc",
        notification: {
          title: `Alerte - ${notification.msgType}`,
          body: body,
        },
        data: {
          deviceId: notification.deviceId,
          alarmType: notification.alarmType || '',
        },
      };

      await admin.messaging().send(message);
      res.status(201).json({ message: 'Notification created', data: notification });
    } catch (error) {
      console.error('Error creating notification:', error);
      res.status(400).json({ error: 'Failed to create notification', details: error.message });
    }
  };