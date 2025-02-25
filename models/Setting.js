const mongoose = require('mongoose');

const settingSchema = mongoose.Schema({
    setting_id: { type: Number, required: true, unique: true },
    label: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true } // `Mixed` allows any type of value
});

module.exports = mongoose.model('Setting', settingSchema);
