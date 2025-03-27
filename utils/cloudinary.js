import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Load environment variables from .env file
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

// Set up Cloudinary storage for products (you can adjust params if needed)
const productStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "products", // Folder name for products
      allowed_formats: ["jpg", "jpeg", "png"], // Allowed file formats
      quality: 'auto', // Automatically set the quality of images
      fetch_format: 'auto', // Automatically select the best format for the image
      width: 800, // Max width for mobile
      crop: 'limit', // Crop the image if it's larger than the specified width
      format: 'webp', // Convert images to WebP format
    },
});

// Set up Cloudinary storage for sellers
const sellerStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: "sellers", // Folder name for sellers
      allowed_formats: ["jpg", "jpeg", "png"], // Allowed file formats
      quality: 'auto', // Automatically set the quality of images
      fetch_format: 'auto', // Automatically select the best format for the image
      width: 800, // Max width for mobile
      crop: 'limit', // Crop the image if it's larger than the specified width
      format: 'webp', // Convert images to WebP format
    },
});

export { cloudinary, productStorage, sellerStorage };
 