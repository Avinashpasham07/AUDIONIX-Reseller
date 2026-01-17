const Joi = require('joi');

const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errors = error.details.map(detail => detail.message);
            return res.status(400).json({ message: 'Validation Error', errors });
        }
        next();
    };
};

const schemas = {
    // Auth Schemas
    register: Joi.object({
        name: Joi.string().min(3).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        role: Joi.string().valid('reseller', 'customer', 'admin').default('customer'),
        businessName: Joi.string().optional().allow(''),
        mobileNumber: Joi.string().pattern(/^[0-9]{10,15}$/).optional().messages({ 'string.pattern.base': 'Mobile number must be 10-15 digits' }),
        address: Joi.string().optional().allow(''),
        gstNumber: Joi.string().optional().allow('')
    }),
    login: Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    }),

    // Order Schemas (Basic)
    createOrder: Joi.object({
        items: Joi.array().items(
            Joi.object({
                product: Joi.string().required(), // ObjectId check could be stricter
                quantity: Joi.number().min(1).required()
            })
        ).min(1).required(),
        shippingAddress: Joi.object({
            name: Joi.string().required(),
            email: Joi.string().email().optional().allow(''),
            address: Joi.string().required(),
            city: Joi.string().required(),
            state: Joi.string().required(),
            pincode: Joi.string().required(),
            phone: Joi.string().required()
        }).required(),
        paymentMethod: Joi.string().valid('cod', 'online').required()
    }).unknown(true) // Allow other fields for now
};

module.exports = { validateRequest, schemas };
