const mongoose = require('mongoose');

const deviceSchema = mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    devicePassword: { type: String, required: true },
    deviceType: { type: String }
});

const packSchema = mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required : true},
    name: { type: String, required: true },
    devices: [deviceSchema]
});

module.exports = mongoose.model('Pack', packSchema);
