const mongoose = require('mongoose');

// Define the Access schema 
const accessSchema = mongoose.Schema({
    access_id: { type: Number, required: true },
    name: { type: String, required: true },
    isSelected: { type: Boolean, required: true }
});

const packAccessSchema = mongoose.Schema({
    userId : {type : mongoose.Schema.Types.ObjectId, ref : 'User'},
    packId :  {type : mongoose.Schema.Types.ObjectId, ref : 'Pack'},
    access : [accessSchema]
});

module.exports = mongoose.model('PackAccess',packAccessSchema);



