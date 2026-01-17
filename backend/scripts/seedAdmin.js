const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createAdmin = async () => {
    try {
        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
            console.error('❌ Error: ADMIN_EMAIL and ADMIN_PASSWORD must be defined in .env file');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });

        if (adminExists) {
            console.log('Admin user already exists');
            process.exit();
        }

        const user = new User({
            name: 'Super Admin',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD, // Will be hashed by pre-save hook
            role: 'admin',
            accountStatus: 'approved'
        });

        await user.save();
        console.log(`✅ Admin user created: ${process.env.ADMIN_EMAIL}`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

createAdmin();
