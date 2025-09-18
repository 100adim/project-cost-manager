const express = require('express');
const User = require('../models/user.js');
const Cost = require('../models/cost.js');
const router = express.Router();

/**
 * Validate the input for adding a cost
 * Ensures required fields and formats are correct
 */
function validateCostInput(body) {
    const { description, category, sum, date } = body;
    let userid = body.userid;

    // Check required fields
    if (!description || !category || !userid || sum === undefined) {
        return { valid: false, message: 'Missing required fields' };
    }

    // Convert userid number to string if needed
    if (typeof userid === 'number') {
        userid = String(userid);
    }

    // Ensure category is valid
    const validCategories = ['food', 'health', 'housing', 'sports', 'education'];
    if (!validCategories.includes(category)) {
        return { valid: false, message: 'Invalid category' };
    }

    // Validate userid
    if (typeof userid !== 'string' || userid.trim() === '') {
        return { valid: false, message: 'userid should be a non-empty string' };
    }

    // Validate sum is numeric
    if (typeof sum !== 'number' || isNaN(sum)) {
        return { valid: false, message: 'sum must be a number' };
    }

    // Validate date if provided
    if (date) {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) {
            return { valid: false, message: 'Invalid date format' };
        }

        // Prevent adding past dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (parsedDate < today) {
            return { valid: false, message: 'Cannot add cost with a past date' };
        }
    }

    return { valid: true };
}

/**
 * Build a new Cost object from request body
 */
function buildCostObject(body) {
    const { description, category, userid, sum, date } = body;
    const creationDate = date ? new Date(date) : new Date();

    return new Cost({
        description,
        category,
        userid: String(userid),
        sum: Number(sum),
        date: creationDate
    });
}

/**
 * POST /api/add
 * Add a new cost for an existing user
 */
router.post('/add', async (req, res) => {
    try {
        // Validate input fields
        const validation = validateCostInput(req.body);
        if (!validation.valid) {
            return res.status(400).json({ error: validation.message });
        }

        // Ensure user exists before adding cost
        const user = await User.findOne({ id: req.body.userid });
        if (!user) {
            return res.status(404).json({ error: 'User ID does not exist' });
        }

        // Build and save new cost
        const cost = buildCostObject(req.body);
        await cost.save();

        res.status(201).json(cost);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
