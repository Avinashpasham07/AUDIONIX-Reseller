const cron = require('node-cron');
const User = require('../models/User');

const startAutoRevokeJob = () => {
    // Run every day at midnight (00:00)
    cron.schedule('0 0 * * *', async () => {
        console.log('Running Auto-Revoke Cron Job...');
        try {
            const fortyFiveDaysAgo = new Date();
            fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

            // Find resellers active but old last activity
            const query = {
                role: 'reseller',
                accountStatus: { $ne: 'inactive' },
                $and: [
                    {
                        $or: [
                            { lastLogin: { $lt: fortyFiveDaysAgo } },
                            { lastLogin: { $exists: false } }
                        ]
                    },
                    {
                        $or: [
                            { lastOrderDate: { $lt: fortyFiveDaysAgo } },
                            { lastOrderDate: { $exists: false } }
                        ]
                    },
                    { createdAt: { $lt: fortyFiveDaysAgo } }
                ]
            };

            const result = await User.updateMany(query, { $set: { accountStatus: 'inactive' } });

            if (result.modifiedCount > 0) {
                console.log(`Auto-Revoked active status for ${result.modifiedCount} users.`);
            } else {
                console.log('No users found for auto-revocation.');
            }

        } catch (error) {
            console.error('Error in Auto-Revoke Cron Job:', error);
        }
    });

    console.log('Auto-Revoke Cron Job Scheduled (Daily at 00:00).');
};

module.exports = startAutoRevokeJob;
