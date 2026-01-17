const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../src/models/Product');

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/viva_db')
    .then(async () => {
        console.log('MongoDB Connected');

        try {
            const result = await Product.updateMany({}, { $set: { stock: 100 } });
            console.log(`Updated stock for ${result.modifiedCount} products to 100.`);
        } catch (error) {
            console.error('Error updating stock:', error);
        } finally {
            mongoose.connection.close();
        }
    })
    .catch(err => console.log(err));
