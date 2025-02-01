import express from 'express';
import upload from "../middleware/multer.js";
import {getCategoryProduct, getAllProducts, getProduct, searchProduct, createProduct, editProduct, deleteProduct, getSellerProducts, getAllProductsForAdmin } from '../controllers/productsController.js';
const router = express.Router();

router.get('/category', getCategoryProduct);
router.get("/seller", getSellerProducts);
router.get('/search/:key', searchProduct);
router.get('/sameja', getAllProductsForAdmin);
router.get('/:id', getProduct);

router.get('/', getAllProducts);

router.put('/edit', editProduct);
router.delete('/delete/:productId', deleteProduct);
router.post('/upload', upload.single('image'), createProduct);

export default router;
 