const mongoose = require('mongoose');

// Schema definition for Cost collection
// Each cost belongs to a user and has a category, description, sum and date.
const costSchema = new mongoose.Schema(
    {
        description: {
            type: String,
            required: true
        },
        category: {
            type: String,
            enum: ['food', 'health', 'housing', 'sports', 'education'], // Allowed categories
            required: true
        },
        userid: {
            type: Number,
            required: true,
            index: true // improves queries by userid
        },
        sum: {
            type: Number, // Double (MongoDB Number = double precision float)
            required: true
        },
        date: {
            type: Date,
            default: Date.now
        }
    },
    {
        versionKey: false // Disables the __v field
    }
);

// Static method: calculate total costs for a specific user
costSchema.statics.getTotalForUser = async function(userid) {
    const costs = await this.find({ userid });
    return costs.reduce((acc, cost) => acc + cost.sum, 0);
};

// Static method: return all costs for a user in a given date range
costSchema.statics.getUserCostsInDateRange = async function(userid, startDate, endDate) {
    return await this.find({
        userid,
        date: { $gte: startDate, $lt: endDate }
    });
};

module.exports = mongoose.models.cost || mongoose.model('cost', costSchema);
