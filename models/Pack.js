const mongoose = require('mongoose');

const packSchema = mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required : true},
    deviceId: { type: String, required: true, unique: true },
    devicePassword: { type: String, required: true }
});

module.exports = mongoose.model('Pack', packSchema);
