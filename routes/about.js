const express = require('express');

// Creating a new router instance

const router = express.Router();

//Hard coded names of the developers
router.get('/about', (req, res) => {
    res.json([
        { first_name: 'Roni', last_name: 'Lubashevski' },
        { first_name: 'Adi', last_name: 'Matok' }
    ]);
});

module.exports = router;