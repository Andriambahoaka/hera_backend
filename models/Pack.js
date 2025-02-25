const mongoose = require('mongoose');

const packSchema = mongoose.Schema({
    pack_id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    deviceList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Device' }],
    accessList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Access' }]
});

module.exports = mongoose.model('Pack', packSchema);
