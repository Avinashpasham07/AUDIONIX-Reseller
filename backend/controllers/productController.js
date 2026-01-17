const Product = require('../models/Product');

const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 }); // Cache for 60 seconds

// @desc    Get all products with search, filter, and sort
// @route   GET /api/products
// @access  Private (Reseller)
exports.getProducts = async (req, res) => {
    try {
        const cacheKey = `products_${JSON.stringify(req.query)}`;
        const cachedData = cache.get(cacheKey);

        if (cachedData) {
            // console.log("Serving from cache: " + cacheKey); // Debug
            return res.json(cachedData);
        }

        const { search, category, sort, page = 1, limit = 10 } = req.query;

        // Build Query
        let query = {};

        // Search Strategy: Hybrid (Text Score)
        if (search) {
            query.$text = { $search: search };
        }

        // Filter by Category
        if (category) {
            query.category = category;
        }

        // Retrieve products with Pagination
        // OPTIMIZATION: Select only necessary fields for list view to reduce bandwidth
        let productsQuery = Product.find(query)
            .select('title price originalPrice cutoffPrice resellerPrice resellerPricePaid images category rating numReviews stock');

        // Sorting
        if (sort) {
            if (sort === 'price_asc') {
                productsQuery = productsQuery.sort({ price: 1 });
            } else if (sort === 'price_desc') {
                productsQuery = productsQuery.sort({ price: -1 });
            } else if (sort === 'newest') {
                productsQuery = productsQuery.sort({ createdAt: -1 });
            }
        } else if (search) {
            // If searching, sort by relevance score
            productsQuery = productsQuery.select({ score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } });
        } else {
            productsQuery = productsQuery.sort({ createdAt: -1 }); // Default to newest
        }

        // Pagination Logic
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        productsQuery = productsQuery.skip(skip).limit(limitNum);

        const products = await productsQuery;
        const total = await Product.countDocuments(query);

        const responseData = {
            products,
            page: pageNum,
            pages: Math.ceil(total / limitNum),
            total
        };

        // Save to cache
        cache.set(cacheKey, responseData);

        res.json(responseData);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Private
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Admin)
exports.createProduct = async (req, res) => {
    try {
        const { title, description, category, price, originalPrice, cutoffPrice, resellerPrice, resellerPricePaid, stock, images, pickupAddress, shippingFee, hsnCode } = req.body;

        const product = await Product.create({
            title,
            description,
            category,
            price,
            originalPrice,
            cutoffPrice,
            resellerPrice,
            resellerPricePaid,
            stock,
            images,
            pickupAddress,
            shippingFee: shippingFee || 0,
            hsnCode,
            supplierId: req.user._id // Assuming admin is creating it
        });

        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Admin)
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            product.title = req.body.title || product.title;
            product.description = req.body.description || product.description;
            product.category = req.body.category || product.category;
            product.price = req.body.price || product.price;
            product.originalPrice = req.body.originalPrice || product.originalPrice;
            product.cutoffPrice = req.body.cutoffPrice || product.cutoffPrice;
            product.resellerPrice = req.body.resellerPrice || product.resellerPrice;
            product.resellerPricePaid = req.body.resellerPricePaid || product.resellerPricePaid;
            product.stock = req.body.stock || product.stock;
            product.images = req.body.images || product.images;
            product.pickupAddress = req.body.pickupAddress || product.pickupAddress;
            if (req.body.shippingFee !== undefined) product.shippingFee = req.body.shippingFee;
            if (req.body.hsnCode !== undefined) product.hsnCode = req.body.hsnCode;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Admin)
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            await product.deleteOne(); // or product.remove() depending on mongoose version
            res.json({ message: 'Product removed' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private
exports.createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (product) {
            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'Product already reviewed' });
            }

            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id,
            };

            product.reviews.push(review);

            product.numReviews = product.reviews.length;

            product.rating =
                product.reviews.reduce((acc, item) => item.rating + acc, 0) /
                product.reviews.length;

            await product.save();
            res.status(201).json({ message: 'Review added' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        res.json(categories.filter(c => c));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
