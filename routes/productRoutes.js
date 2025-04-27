import express from 'express';
import upload from "../middleware/multer.js";
import {getCategoryProduct, getAllProducts, getProduct, searchProduct, createProduct, editProduct, deleteProduct, getSellerProducts, getUserProductCount, updateProduct } from '../controllers/productsController.js';
const router = express.Router();

router.get('/category', getCategoryProduct); 
router.get("/seller", getSellerProducts);
router.get('/seller/count',getUserProductCount)
router.get('/search/:key', searchProduct);
router.get('/:id', getProduct);
router.get('/', getAllProducts);

router.put('/edit', editProduct);
router.patch('/update/:productId', updateProduct);
router.delete('/delete/:productId', deleteProduct);
router.post('/upload', upload.array('images', 4), createProduct);

export default router;
 