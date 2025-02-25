const mongoose = require('mongoose');

const userTypeSchema = mongoose.Schema({
    type_id: { type: Number, required: true, unique: true },
    name: { type: String, required: true }
});

module.exports = mongoose.model('UserType', userTypeSchema);
