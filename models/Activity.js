const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: {
    type: String,
    required: true
  }
}, { timestamps: true }); // active createdAt et updatedAt automatiquement

// Méthode statique mise à jour pour utiliser createdAt
activitySchema.statics.findByDateAndOwner = async function (dateStr, ownerId) {
  const date = new Date(dateStr);
  const nextDay = new Date(dateStr);
  nextDay.setDate(nextDay.getDate() + 1);

  return this.find({
    ownerId,
    createdAt: {
      $gte: date,
      $lt: nextDay
    }
  }).sort({ createdAt: -1 });
};


module.exports = mongoose.model('Activity', activitySchema);
