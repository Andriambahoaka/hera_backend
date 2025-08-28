const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  pack: {
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },
    deviceName: { type: String, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  accessKey: {
    type: String
  },
  productId: {
    type: String
  },
  category: {
    type: String
  },
  msgType: {
    type: String
  },
  deviceId: {
    type: String
  },
  channelId: {
    type: Number
  },
  utcTime: {
    type: Number
  },
  localTime: {
    type: Number
  },
  filePath:{
    type: String
  },
  alarmType: {
    type: String
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

module.exports = mongoose.model('Notification', notificationSchema);
