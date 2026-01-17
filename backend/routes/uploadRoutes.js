const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cloudinary Config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage Config
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const isImage = file.mimetype.startsWith('image/');
        const extension = file.originalname.split('.').pop();
        const fileNameWithoutExt = file.originalname.split('.').slice(0, -1).join('.').replace(/ /g, '_');

        return {
            folder: 'audionix_uploads',
            resource_type: isImage ? 'image' : 'raw',
            public_id: isImage
                ? `${fileNameWithoutExt}_${Date.now()}`
                : `${fileNameWithoutExt}_${Date.now()}.${extension}`,
        };
    },
});

const upload = multer({ storage: storage });

// @desc    Upload file to Cloudinary
// @route   POST /api/upload
router.post('/', (req, res) => {
    console.log("DEBUG: Starting Upload...");
    console.log("Cloud Config Check:", process.env.CLOUDINARY_CLOUD_NAME ? "OK" : "MISSING");

    const uploadSingle = upload.single('file');

    uploadSingle(req, res, function (err) {
        if (err) {
            console.error("MULTER ERROR:", err);
            return res.status(500).json({ message: 'Upload failed', error: err.message });
        }

        console.log("MULTER SUCCESS. File:", req.file);

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }
        res.json({
            filePath: req.file.path,
            fullUrl: req.file.path
        });
    });
});

module.exports = router;
