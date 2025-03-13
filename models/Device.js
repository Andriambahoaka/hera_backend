const mongoose = require('mongoose');


const deviceSchema = mongoose.Schema({
    device_id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    type: {
        name: { type: String, required: true },
        type_id: { type: Number, required: true }
    }
});

module.exports = mongoose.model('Device', deviceSchema); 
