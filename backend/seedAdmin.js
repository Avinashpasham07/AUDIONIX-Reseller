const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');

        const adminExists = await User.findOne({ email: 'admin@audionix.com' });

        if (adminExists) {
            console.log('Admin user already exists');
            // Ensure permissions are correct just in case (optional)
            adminExists.role = 'admin';
            adminExists.accountStatus = 'approved';
            await adminExists.save();
            console.log('Admin permissions verified');
        } else {
            const adminUser = await User.create({
                name: 'Super Admin',
                email: 'admin@audionix.com',
                password: 'admin123', // Will be hashed by pre-save hook
                role: 'admin',
                accountStatus: 'approved',
                mobileNumber: '8099301082',
                businessDetails: {
                    businessName: 'Audionix HQ',
                    address: 'Head Office',
                    gstNumber: 'ADMIN_GST'
                }
            });
            console.log('Admin user created successfully');
            console.log('Email: admin@audionix.com');
            console.log('Password: admin123');
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
