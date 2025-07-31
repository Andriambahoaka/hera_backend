
const Notification = require('../models/Notification');
const admin = require('../config/firebase.js');
const Pack = require('../models/Pack');
const User = require('../models/User');


const getMessageTitleFromMsgType = (msgType) => {
  switch (msgType) {
    case 'RCEmergencyCall':
      return 'Intrusion détectée !';
    case 'armed':
      return 'Activation de l\'alarme';
    case 'disarmed':
      return 'Désactivation de l\'alarme';
    case 'online':
      return 'Allumage de l\'alarme';
    case 'offline':
      'Extinction de l\'alarme';
    case 'SensorAbnormal':
      'Autoprotection déclenchée';
    default:
      return 'Hera';
  }
};


const getMessageBodyFromMsgType = (msgType, packName, userName) => {
  const messages = {
    RCEmergencyCall: `Votre détecteur vient de se déclencher et de prendre une photo à "${packName}"`,
    armed: `Votre centrale dans "${packName}" vient d'être armée par "${userName}"`,
    disarmed: `Votre centrale dans "${packName}" vient d'être désarmée par "${userName}"`,
    online: `Votre centrale dans "${packName}" vient d'être allumée`,
    offline: `Votre centrale dans "${packName}" vient d'être éteinte`,
    SensorAbnormal: `Une tentative d'altération d'un accessoire a été détectée à "${packName}"`,
  };

  return messages[msgType] || 'Nouvelle notification reçue';
};


exports.postNotification = async (req, res) => {
  try {
    const { deviceId, userName, id, ...notificationData } = req.body; // Destructure 'id' to exclude it

    // Find the pack by deviceId
    const pack = await Pack.findOne({ deviceId }).select('_id deviceName ownerId');
    if (!pack) {
      return res.status(404).json({ error: 'Pack contenant ce deviceId introuvable.' });
    }

    // Create new notification
    const notification = new Notification({
      ...notificationData, // All other fields except 'id'
      pack: {
        _id: pack._id,
        deviceName: pack.deviceName,       // Fix: use `name` as per schema
        ownerId: pack.ownerId,
      },
    });

    await notification.save();

    const user = await User.findById(pack.ownerId);
    if (!user || !user.devicesToken || user.devicesToken.length === 0) {
      return res.status(404).json({ error: 'Utilisateur ou tokens introuvables.' });
    }

    // Prepare notification content
    const title = getMessageTitleFromMsgType(notification.msgType);
    const body = getMessageBodyFromMsgType(notification.msgType, pack.deviceName, userName);

    const message = {
      notification: { title, body },
      data: {
        deviceId: String(notification.deviceId),
        alarmType: String(notification.alarmType || ''),
      },
      tokens: user.devicesToken,
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
    res.status(500).json({
      error: 'Échec lors de la création ou de l’envoi de la notification',
      details: error.message,
    });
  }
};


exports.findAllByOwner = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const notifications = await Notification.find({ 'pack.ownerId': ownerId });

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications :', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
