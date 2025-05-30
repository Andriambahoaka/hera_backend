const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: {
        type: String,
        required: true
    },
    timeStamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

activitySchema.statics.findByDateAndOwner = async function (dateStr, ownerId) {
  const date = new Date(dateStr);
  const nextDay = new Date(dateStr);
  nextDay.setDate(nextDay.getDate() + 1);

  return this.find({
    ownerId,
    timeStamp: {
      $gte: date,
      $lt: nextDay
    }
  }).sort({ timeStamp: -1 });
};



module.exports = mongoose.model('Activity', activitySchema);
