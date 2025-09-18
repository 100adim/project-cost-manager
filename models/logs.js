const mongoose = require('mongoose');

const logSchema = new mongoose.Schema(
  {
    method: String,
    url: String,
    timestamp: { type: Date, default: Date.now }
  },
  { versionKey: false }
);

module.exports = mongoose.models.Log || mongoose.model('Log', logSchema);
