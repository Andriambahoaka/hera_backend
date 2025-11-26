const mongoose = require('mongoose');

const ApiKeySchema = new mongoose.Schema({
  key: { type: String, required: true },
  refreshKey: { type: String, required: true },
  expiresAt: { type: Date }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ApiKey', ApiKeySchema);
