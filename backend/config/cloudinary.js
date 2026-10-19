const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 1. Conectar con nuestra cuenta de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// 2. Configurar dónde y cómo se guardarán las imágenes
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'nutranuts_catalogo', // Crea esta carpeta en tu Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
    }
});

const upload = multer({ storage: storage });

module.exports = upload;