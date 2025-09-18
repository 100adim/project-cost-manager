const express = require('express');
const router = express.Router();
const Log = require('../models/logs');

/**
 * GET /api/logs
 * Return all request logs stored in MongoDB
 */
router.get('/', async (req, res) => {
  try {
    // Retrieve logs collection
    const logs = await Log.find();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

module.exports = router;
