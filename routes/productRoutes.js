import express from 'express';
import upload from "../middleware/multer.js";
import {
    getCategoryProduct, 
    getAllProducts, 
    getProduct, 
    searchProduct, 
    editProduct, 
    deleteProduct, 
    getSellerProducts, 
    updateProduct, 
    createLogClickedProducts,
    getLimitedDiscountedProducts,
    getDiscountedProducts,
    getUserProductCount,
    createProduct, 
 } from '../controllers/productsController.js';
import { getPopularProducts } from '../controllers/ProductLog.js';
const router = express.Router();


// Get limited discounted products for home screen
router.get('/limited', getLimitedDiscountedProducts);

// Get all discounted products with pagination and sorting
router.get('/all', getDiscountedProducts);

router.get('/category', getCategoryProduct); 
router.get('/analytics/popular', getPopularProducts);
router.get("/seller", getSellerProducts);
router.get('/seller/count',getUserProductCount)
router.get('/search/:key', searchProduct);
router.get('/:id', getProduct);
router.get('/', getAllProducts);



router.put('/edit', editProduct);
router.patch('/update/:productId', updateProduct);
router.delete('/delete/:productId', deleteProduct);
router.post('/upload', upload.array('images', 4), createProduct);
router.post('/log-click', createLogClickedProducts);
router.post('/analytics/click', createLogClickedProducts)
export default router;
 