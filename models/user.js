const mongoose = require('mongoose');

// User schema definition
const userSchema = new mongoose.Schema(
    {
    
        id: {
            type: Number,
            required: true,
            unique: true
        },
        first_name: String,
        last_name: String,
        birthday: Date,
        marital_status: String
    },
    {
        versionKey: false // Disables __v field
    }
);

module.exports = mongoose.models.users || mongoose.model('user', userSchema);