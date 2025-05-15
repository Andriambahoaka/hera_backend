
const Notification = require('../models/Notification');
const admin = require('../config/firebase.js');
const Pack = require('../models/Pack');
const User = require('../models/User');

const getMessageBodyFromMsgType = (msgType, packName) => {
  const messages = {
    RCEmergencyCall: `Votre détecteur vient de se déclencher et de prendre une photo à "${packName}"`,
    armed: `Votre centrale dans "${packName}" vient d'être armée`,
    disarmed: `Votre centrale dans "${packName}" vient d'être désarmée`,
    online: `Votre centrale dans "${packName}" vient d'être allumée`,
    offline: `Votre centrale dans "${packName}" vient d'être éteinte`,
  };

  return messages[msgType] || 'Nouvelle notification reçue';
};

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
    default:
      return 'Hera';
  }
};


exports.postNotification = async (req, res) => {
  try {

    const { deviceId } = req.body;

    const pack = await Pack.findOne(
      { 'devices.deviceId': deviceId }
    ).select('_id name ownerId');


    if (!pack) {
      return res.status(404).json({ error: 'Pack contenant ce deviceId introuvable.' });
    }

    const notification = new Notification({
      ...req.body,
      pack: {
        _id: pack._id,
        name: pack.name,
        ownerId: pack.ownerId,
      },
    });

    await notification.save();

    const ownerId = pack.ownerId;

    const user = await User.findById(ownerId);

    if (!user || !user.devicesToken || user.devicesToken.length === 0) {
      return res.status(404).json({ error: 'Utilisateur ou tokens introuvables.' });
    }

    const title = getMessageTitleFromMsgType(notification.msgType);
    const body = getMessageBodyFromMsgType(notification.msgType,pack.name);
    const tokens = user.devicesToken;

    const message = {
      notification: {
        title,
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
