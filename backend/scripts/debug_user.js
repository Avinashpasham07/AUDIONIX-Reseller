const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    // Add possible root-level fields to schema to detect them if strict is false or via Accessing Raw
}, { strict: false }); // Strict false allows seeing stuff not in schema if we use this model

const User = mongoose.model('User', userSchema);

const debugUser = async () => {
    await connectDB();
    try {
        // Find by name pattern
        const user = await User.findOne({ name: { $regex: /Pasham Avinash/i } }).lean();

        if (user) {
            console.log("--- FOUND USER ---");
            console.log(JSON.stringify(user, null, 2));
            console.log("------------------");

            if (user.businessName && !user.businessDetails?.businessName) {
                console.log("DETECTED: businessName is at ROOT level!");
            }
        } else {
            console.log("User not found");
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

debugUser();
