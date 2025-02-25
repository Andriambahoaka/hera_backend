const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    memberList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // List of other users
    packList: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pack' }], // Reference to Pack model
    userType: { type: mongoose.Schema.Types.ObjectId, ref: 'UserType', required: true } // Reference to UserType model
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
