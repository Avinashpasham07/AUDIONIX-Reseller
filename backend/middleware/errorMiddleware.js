const errorHandler = (err, req, res, next) => {
    // Log the error stack for debugging (only in development ideally, or use a logger)
    console.error(err.stack);

    const statusCode = res.statusCode ? res.statusCode : 500;

    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };
