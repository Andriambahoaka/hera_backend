const mongoose = require('mongoose');

const deviceSchema = mongoose.Schema({
    serialNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    type: {
        name: { type: String, required: true },
        type_id: { type: Number, required: true }
    }
});

const packSchema = mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required : true},
    name: { type: String, required: true },
    devices: [deviceSchema]
});

module.exports = mongoose.model('Pack', packSchema);
