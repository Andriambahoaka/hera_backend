const mongoose = require('mongoose');

const packSchema = mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required : true},
    deviceId: { type: String, required: true, unique: true },
    deviceName: { type: String, default: ""},
    devicePassword: { type: String, required: true }, 
    urgencyNumber: { type: String, default: "17"}
});

module.exports = mongoose.model('Pack', packSchema);
