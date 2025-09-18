const express = require('express');
const Cost = require('../models/cost');
const User = require('../models/user');
const Report = require('../models/report'); // model for saving computed reports

const router = express.Router();

/*
  Endpoint: /api/report
  ----------------------
  Generate a monthly report for a specific user.
  Implements the Computed Pattern:
  - For past months → check if report exists in DB, if yes return it.
  - If not saved yet → compute, save to DB, and return.
  - For current/future months → compute only (not saved).
*/
router.get('/report', async (req, res) => {
  try {
    const { id, year, month } = req.query;

    // Validate query parameters
    if (!id || !year || !month) {
      return res.status(400).json({ error: 'Missing required query parameters: id, year, month' });
    }

    const yearNum = Number(year);
    const monthNum = Number(month);
    const userId = Number(id);

    // Ensure values are valid
    if (isNaN(yearNum) || isNaN(monthNum) || isNaN(userId) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ error: 'Invalid query parameters' });
    }

    // Ensure the user exists
    const user = await User.findOne({ id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User ID does not exist' });
    }

    // Get today's year/month for comparison
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // If the requested month is in the past → try to fetch from DB
    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      const existingReport = await Report.findOne({ userid: userId, year: yearNum, month: monthNum });
      if (existingReport) {
        return res.json(existingReport); // return cached report
      }
    }

    // Compute new report (date range + grouping)
    const start = getMonthStartDate(yearNum, monthNum);
    const end = getMonthEndDate(yearNum, monthNum);
    const costs = await Cost.getUserCostsInDateRange(userId, start, end);

    const grouped = groupCostsByCategory(costs);
    const costsArray = formatGroupedCosts(grouped);

    const reportData = {
      userid: userId,
      year: yearNum,
      month: monthNum,
      costs: costsArray
    };

    // Save report in DB only if the month is in the past
    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      await Report.create(reportData);
    }

    return res.json(reportData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

/*
  Helper functions for date calculations
  --------------------------------------
  These make it easy to define the start and end of a month.
*/
function getMonthStartDate(year, month) {
  // First day of the given month
  return new Date(year, month - 1, 1);
}

function getMonthEndDate(year, month) {
  // First day of the following month
  return new Date(year, month, 1);
}

/*
  Group costs into predefined categories
  --------------------------------------
  Each cost is placed in its category with sum, description, and day.
*/
function groupCostsByCategory(costs) {
  const grouped = {
    food: [],
    health: [],
    housing: [],
    sports: [],
    education: []
  };

  costs.forEach(cost => {
    const day = cost.date.getDate();
    if (grouped[cost.category]) {
      grouped[cost.category].push({
        // Handle Decimal128 or normal Number
        sum: cost.sum && cost.sum._bsontype === 'Decimal128'
          ? parseFloat(cost.sum.toString())
          : Number(cost.sum),
        description: cost.description,
        day
      });
    }
  });

  return grouped;
}

/*
  Convert grouped object into array format
  ----------------------------------------
  This ensures the output JSON matches the required format
*/
function formatGroupedCosts(grouped) {
  return Object.keys(grouped).map(category => ({
    [category]: grouped[category]
  }));
}
