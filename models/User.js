const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');


//check valid email
const userSchema = mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phoneNumber: { type: String },
    userType: { type: Number, required: true },
    ownerId: { type: String,default: null},
    firstLogin: { type: Boolean, default: true }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);
