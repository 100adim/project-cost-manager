// routes/users.js
const express = require('express');
const User = require('../models/user');
const Cost = require('../models/cost');

const router = express.Router();

/**
 * Helper: Parse and validate a user ID parameter
 * Returns { valid: true, id } or { valid: false, message }
 */
function parseUserId(idParam) {
  const id = String(idParam).trim();
  if (!id) {
    return { valid: false, message: 'Invalid user ID' };
  }
  return { valid: true, id };
}

/**
 * Helper: Find user by ID
 */
async function getUserById(id) {
  return await User.findOne({ id });
}

// ------------------------------------------------------------
// POST /api/users
// Create a new user if it does not already exist
// ------------------------------------------------------------
router.post('/users', async (req, res) => {
  try {
    let { id, first_name, last_name, birthday, marital_status } = req.body;

    // Validate required fields: id, first_name, last_name must exist
    if (!id || !first_name || !last_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Convert birthday string → Date if provided
    if (birthday) {
      birthday = new Date(birthday);
      if (isNaN(birthday)) {
        return res.status(400).json({ error: 'Invalid birthday format' });
      }
    }

    // Check for existing user in DB
    let user = await User.findOne({ id });
    if (user) {
      // If user already exists → return status 200 with the user
      return res.status(200).json(user);
    }

    // Create new user object
    user = new User({
      id,
      first_name,
      last_name,
      birthday,
      marital_status
    });

    // Save to database and return 201
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user', details: err.message });
  }
});

// ------------------------------------------------------------
// GET /api/users/:id
// Return user details with computed total costs
// ------------------------------------------------------------
router.get('/users/:id', async (req, res) => {
  try {
    const { valid, id, message } = parseUserId(req.params.id);
    if (!valid) {
      return res.status(400).json({ error: message });
    }

    // Retrieve user by ID
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use Computed Pattern to calculate total costs for the user
    const total = await Cost.getTotalForUser(id);

    // Reply with user data + total costs
    res.json({
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      birthday: user.birthday ? user.birthday.toISOString().slice(0, 10) : null,
      marital_status: user.marital_status,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ------------------------------------------------------------
// GET /api/users
// Return a list of all users
// ------------------------------------------------------------
router.get('/users', async (_req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
