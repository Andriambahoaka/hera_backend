const mongoose = require('mongoose');

// Define the Access schema 
const accessSchema = mongoose.Schema({
    id: { type: Number, required: true },
    label: { type: String, required: true },
    isSelected: { type: Boolean, required: true }
});

const packAccessSchema = mongoose.Schema({
    userId : {type : mongoose.Schema.Types.ObjectId, ref : 'User'},
    packId :  {type : mongoose.Schema.Types.ObjectId, ref : 'Pack'},
    hasAccess: { type: Boolean, required: true },
    access : [accessSchema]
});

module.exports = mongoose.model('PackAccess',packAccessSchema);



