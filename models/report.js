const mongoose = require('mongoose');

/*
  Schema for storing computed monthly reports 
  so past reports can be reused without recalculation.
*/

const reportSchema = new mongoose.Schema(
  {
    userid: { type: Number, required: true },
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    costs: { type: Array, required: true }
  },
  { versionKey: false }
);

module.exports = mongoose.models.report || mongoose.model('report', reportSchema);
