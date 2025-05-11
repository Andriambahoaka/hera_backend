const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  accessKey: {
    type: String,
    required: true,
  },
  productId: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  msgType: {
    type: String,
    required: true,
  },
  deviceId: {
    type: String,
    required: true,
  },
  channelId: {
    type: Number,
    required: true,
  },
  utcTime: {
    type: Number,
    required: true,
  },
  localTime: {
    type: Number,
    required: true,
  },
  id: {
    type: mongoose.Schema.Types.Decimal128,
    required: true
  },
  alarmType: {
    type: String,
    required: true,
  },
}, {
  timestamps: true, // adds createdAt and updatedAt
});

module.exports = mongoose.model('Notification', notificationSchema);
