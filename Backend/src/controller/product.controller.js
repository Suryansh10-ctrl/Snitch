import productModel from "../models/product.model.js";
import { uploadFile } from "../services/storage.service.js";




export async function createProduct(req, res) {
    try {
        const { title, description, category, priceAmount, priceCurrency, price, currency, color } = req.body;
        const seller = req.user;

        const amount = Number(priceAmount || price);
        if (isNaN(amount) || amount <= 0) {
            return res.status(400).json({ message: "Valid product price amount is required" });
        }

        let uploadedImages = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            uploadedImages = await Promise.all(
                req.files.map(async (file) => {
                    const result = await uploadFile({
                        buffer: file.buffer,
                        fileName: file.originalname,
                    });
                    const imageUrl = typeof result === "string" ? result : (result?.url || result?.secure_url || "");
                    return { url: imageUrl };
                })
            );
        }

        const baseColor = color ? color.trim() : "Default";
        const baseCategory = category ? category.trim() : "Clothing";
        const baseBrand = req.body.brand ? req.body.brand.trim() : "Snitch";
        const baseCurrency = priceCurrency || currency || "INR";

        const baseSize = req.body.size ? req.body.size.trim() : "M";

        const defaultVariants = [
            {
                stock: 10,
                price: amount,
                currency: baseCurrency,
                sku: `${(title || "PROD").slice(0, 4).toUpperCase()}-${baseSize.toUpperCase()}-${Date.now().toString().slice(-4)}`,
                attributes: new Map([
                    ["size", baseSize],
                    ["color", baseColor]
                ]),
            }
        ];

        const product = await productModel.create({
            title: title ? title.trim() : "",
            description: description ? description.trim() : "",
            category: baseCategory,
            brand: baseBrand,
            color: baseColor,
            price: {
                amount,
                currency: baseCurrency,
            },
            images: uploadedImages,
            seller: seller._id,
            variants: defaultVariants,
        });

        return res.status(201).json({
            message: "Product created successfully",
            success: true,
            product,
        });

    } catch (err) {
        console.error("Create Product Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to create product",
            success: false,
        });
    }
}


export async function getSellerProducts(req, res) {
    try {
        const seller = req.user;

        const products = await productModel.find({
            seller: seller._id,
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            products,
            product: products,
        });
    } catch (err) {
        console.error("Get Seller Products Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to fetch seller products",
            success: false,
        });
    }
}

export async function getAllProducts(req,res) {
    try {
        const products = await productModel.find().sort({ createdAt: -1 });
        
        return res.status(200).json({
            message: "Products fetched successfully",
            success: true,
            products,
            product: products,
        });
    } catch (err) {
        console.error("Get All Products Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to fetch products",
            success: false,
        });
    }
}

export async function getProductById(req, res) {
    try {
        const { productId } = req.params;
        const product = await productModel.findById(productId).populate("seller", "fullname email contact");

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false,
            });
        }

        return res.status(200).json({
            message: "Product details fetched successfully",
            success: true,
            product,
        });
    } catch (err) {
        console.error("Get Product By ID Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to fetch product details",
            success: false,
        });
    }
}

export async function addVariantToProduct(req, res) {
    try {
        const { productId } = req.params;
        const seller = req.user;
        const { price, currency, stock, attributes } = req.body;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found", success: false });
        }

        if (product.seller.toString() !== seller._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to edit this product", success: false });
        }

        let variantImages = [];
        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            variantImages = await Promise.all(
                req.files.map(async (file) => {
                    const result = await uploadFile({
                        buffer: file.buffer,
                        fileName: file.originalname,
                    });
                    const imageUrl = typeof result === "string" ? result : (result?.url || result?.secure_url || "");
                    return { url: imageUrl };
                })
            );
        }

        let parsedAttributes = {};
        if (typeof attributes === "string") {
            try {
                parsedAttributes = JSON.parse(attributes);
            } catch (e) {
                parsedAttributes = { style: attributes };
            }
        } else if (typeof attributes === "object" && attributes !== null) {
            parsedAttributes = attributes;
        }

        const newVariant = {
            price: Number(price || product.price.amount),
            currency: currency || product.price.currency || "INR",
            stock: Number(stock || 0),
            attributes: parsedAttributes,
            images: variantImages,
        };

        product.variants.push(newVariant);
        await product.save();

        return res.status(200).json({
            message: "Variant added successfully",
            success: true,
            product,
        });
    } catch (err) {
        console.error("Add Variant Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to add variant",
            success: false,
        });
    }
}

export async function updateVariantStock(req, res) {
    try {
        const { productId, variantId } = req.params;
        const { stock } = req.body;
        const seller = req.user;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found", success: false });
        }

        if (product.seller.toString() !== seller._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to edit this product", success: false });
        }

        const variant = product.variants.id(variantId);
        if (!variant) {
            return res.status(404).json({ message: "Variant not found", success: false });
        }

        variant.stock = Math.max(0, Number(stock || 0));
        await product.save();

        return res.status(200).json({
            message: "Variant stock updated successfully",
            success: true,
            product,
        });
    } catch (err) {
        console.error("Update Variant Stock Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to update variant stock",
            success: false,
        });
    }
}

export async function updateProduct(req, res) {
    try {
        const { productId } = req.params;
        const seller = req.user;
        const { title, description, priceAmount, price, currency, color } = req.body;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found", success: false });
        }

        if (product.seller.toString() !== seller._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to edit this product", success: false });
        }

        if (title) product.title = title.trim();
        if (description) product.description = description.trim();
        if (color !== undefined) product.color = color.trim();
        const amt = Number(priceAmount || price);
        if (!isNaN(amt) && amt > 0) {
            product.price = {
                amount: amt,
                currency: currency || product.price?.currency || "INR",
            };
        }

        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const uploadedImages = await Promise.all(
                req.files.map(async (file) => {
                    const result = await uploadFile({
                        buffer: file.buffer,
                        fileName: file.originalname,
                    });
                    const imageUrl = typeof result === "string" ? result : (result?.url || result?.secure_url || "");
                    return { url: imageUrl };
                })
            );
            product.images = [...product.images, ...uploadedImages];
        }

        await product.save();
        return res.status(200).json({
            message: "Product updated successfully",
            success: true,
            product,
        });
    } catch (err) {
        console.error("Update Product Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to update product",
            success: false,
        });
    }
}

export async function deleteProduct(req, res) {
    try {
        const { productId } = req.params;
        const seller = req.user;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found", success: false });
        }

        if (product.seller.toString() !== seller._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to delete this product", success: false });
        }

        await productModel.findByIdAndDelete(productId);
        return res.status(200).json({
            message: "Product deleted successfully",
            success: true,
        });
    } catch (err) {
        console.error("Delete Product Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to delete product",
            success: false,
        });
    }
}

export async function updateVariant(req, res) {
    try {
        const { productId, variantId } = req.params;
        const seller = req.user;
        const { price, stock, sku, attributes, existingImages } = req.body;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found", success: false });
        }

        if (product.seller.toString() !== seller._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to edit this product", success: false });
        }

        const variant = product.variants.id(variantId);
        if (!variant) {
            return res.status(404).json({ message: "Variant not found", success: false });
        }

        if (price !== undefined && !isNaN(Number(price))) {
            variant.price = Number(price);
        }

        if (stock !== undefined && !isNaN(Number(stock))) {
            variant.stock = Math.max(0, Number(stock));
        }

        if (sku) {
            variant.sku = String(sku).trim();
        }

        if (attributes) {
            let parsedAttrs = attributes;
            if (typeof attributes === "string") {
                try {
                    parsedAttrs = JSON.parse(attributes);
                } catch (e) {}
            }
            if (typeof parsedAttrs === "object") {
                Object.entries(parsedAttrs).forEach(([k, v]) => {
                    if (variant.attributes) {
                        variant.attributes.set(k, String(v));
                    }
                });
            }
        }

        // Process existing images array after potential user deletions
        let updatedImagesList = [];
        if (existingImages !== undefined) {
            let parsedExisting = existingImages;
            if (typeof existingImages === "string") {
                try {
                    parsedExisting = JSON.parse(existingImages);
                } catch (e) {
                    parsedExisting = [existingImages];
                }
            }
            if (Array.isArray(parsedExisting)) {
                updatedImagesList = parsedExisting.map((img) => typeof img === "string" ? { url: img } : img);
            }
        } else {
            updatedImagesList = variant.images || [];
        }

        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            const uploadedImages = await Promise.all(
                req.files.map(async (file) => {
                    const result = await uploadFile({
                        buffer: file.buffer,
                        fileName: file.originalname,
                    });
                    const imageUrl = typeof result === "string" ? result : (result?.url || result?.secure_url || "");
                    return { url: imageUrl };
                })
            );
            updatedImagesList = [...updatedImagesList, ...uploadedImages];
        }

        variant.images = updatedImagesList;

        await product.save();
        return res.status(200).json({
            message: "Variant updated successfully",
            success: true,
            product,
        });
    } catch (err) {
        console.error("Update Variant Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to update variant",
            success: false,
        });
    }
}

export async function deleteVariant(req, res) {
    try {
        const { productId, variantId } = req.params;
        const seller = req.user;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found", success: false });
        }

        if (product.seller.toString() !== seller._id.toString()) {
            return res.status(403).json({ message: "Unauthorized to edit this product", success: false });
        }

        const variant = product.variants.id(variantId);
        if (!variant) {
            return res.status(404).json({ message: "Variant not found", success: false });
        }

        product.variants.pull({ _id: variantId });
        await product.save();

        return res.status(200).json({
            message: "Variant deleted successfully",
            success: true,
            product,
        });
    } catch (err) {
        console.error("Delete Variant Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to delete variant",
            success: false,
        });
    }
}