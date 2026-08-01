import { Router } from "express";
import { authenicateSeller } from "../middleware/auth.middleware.js";
import { createProduct, getAllProducts, getSellerProducts, getProductById, addVariantToProduct, updateVariantStock, updateProduct, deleteProduct, updateVariant, deleteVariant } from "../controller/product.controller.js";
import multer from "multer"
import { validateCreateProduct } from "../validator/product.validator.js";

const upload = multer({
    storage: multer.memoryStorage(),
    limits: 5*1024*1024,
})

const productrouter = Router();

productrouter.post("/", authenicateSeller, upload.array("images", 7), validateCreateProduct, createProduct);


productrouter.get("/seller", authenicateSeller, getSellerProducts);


productrouter.get("/", getAllProducts);
productrouter.get("/:productId", getProductById);
productrouter.put("/:productId", authenicateSeller, upload.array("images", 5), updateProduct);
productrouter.delete("/:productId", authenicateSeller, deleteProduct);
productrouter.post("/:productId/variants", authenicateSeller, upload.array("images", 5), addVariantToProduct);
productrouter.put("/:productId/variants/:variantId", authenicateSeller, upload.array("images", 5), updateVariant);
productrouter.delete("/:productId/variants/:variantId", authenicateSeller, deleteVariant);
productrouter.patch("/:productId/variants/:variantId/stock", authenicateSeller, updateVariantStock);

export default productrouter;