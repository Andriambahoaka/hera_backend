
const Notification = require('../models/Notification');
const admin = require('../config/firebase.js');
const Pack = require('../models/Pack');
const User = require('../models/User');


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
  
      const { deviceId } = req.body;
  
      // Étape 1 : Trouver le pack qui contient ce deviceId
      const pack = await Pack.findOne({ 'devices.deviceId': deviceId });
  
      if (!pack) {
        return res.status(404).json({ error: 'Pack contenant ce deviceId introuvable.' });
      }
  
      const ownerId = pack.ownerId;
  
      // Étape 2 : Trouver l'utilisateur propriétaire
      const user = await User.findById(ownerId);
  
      if (!user || !user.devicesToken || user.devicesToken.length === 0) {
        return res.status(404).json({ error: 'Utilisateur ou tokens introuvables.' });
      }
  
      const body = getMessageBodyFromMsgType(notification.msgType);
      const tokens = user.devicesToken;
  
      // Étape 3 : Envoyer à tous les tokens FCM
      const message = {
        notification: {
          title: `Alerte - ${notification.msgType}`,
          body,
        },
        data: {
          deviceId: notification.deviceId,
          alarmType: notification.alarmType || '',
        },
        tokens, // multiple tokens
      };
  
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`Notifications envoyées: ${response.successCount} succès, ${response.failureCount} échecs`);
  
      res.status(201).json({
        message: 'Notification créée et envoyée',
        notification,
        fcmResponse: response,
      });
  
    } catch (error) {
      console.error('Erreur:', error);
      res.status(500).json({ error: 'Échec lors de la création ou de l’envoi de la notification', details: error.message });
    }
  };
