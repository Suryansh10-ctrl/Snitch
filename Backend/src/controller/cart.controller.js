import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import { getCartDetails } from "../dao/cart.dao.js";
import mongoose from "mongoose";
import { createOrder } from "../services/paymet.service.js";
import paymentModel from "../models/payment.model.js";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import { config } from "../config/config.js";


async function getCartdetails(userId){
    let cartResult = (await cartModel.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId)
                }
            },
            { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'items.product'
                }
            },
            { $unwind: { path: '$items.product', preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    itemPrice: {
                        price: {
                            $multiply: [
                                { $ifNull: ['$items.quantity', 1] },
                                { $ifNull: ['$items.price.amount', '$items.product.price.amount', 0] }
                            ]
                        },
                        currency: { $ifNull: ['$items.price.currency', '$items.product.price.currency', 'INR'] }
                    }
                }
            },
            {
                $group: {
                    _id: '$_id',
                    totalPrice: { $sum: '$itemPrice.price' },
                    currency: { $first: '$itemPrice.currency' },
                    items: { $push: '$items' }
                }
            }
        ]))[0];
    return cartResult;
}

export const addToCart = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const targetVariantId = variantId || req.body.variantId || null;
        const quantity = Math.max(1, Number(req.body.quantity || 1));

        const product = await productModel.findById(productId);

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false
            });
        }

        let variant = null;
        if (targetVariantId && Array.isArray(product.variants)) {
            variant = product.variants.find((v) => v._id.toString() === targetVariantId.toString());
        }

        const stock = variant?.stock !== undefined ? Number(variant.stock) : (product.stock !== undefined ? Number(product.stock) : 10);

        if (stock <= 0) {
            return res.status(400).json({
                message: "Sorry, this product is currently Out of Stock! ❌",
                success: false
            });
        }

        let cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) {
            cart = await cartModel.create({ user: req.user._id, items: [] });
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId &&
            (targetVariantId ? item.variant?.toString() === targetVariantId.toString() : !item.variant)
        );

        if (itemIndex > -1) {
            const currentQty = cart.items[itemIndex].quantity;
            if (currentQty + quantity > stock) {
                return res.status(400).json({
                    message: `Only ${stock} items available in stock. You already have ${currentQty} in your bag.`,
                    success: false
                });
            }
            cart.items[itemIndex].quantity += quantity;
        } else {
            if (quantity > stock) {
                return res.status(400).json({
                    message: `Only ${stock} items available in stock.`,
                    success: false
                });
            }

            let itemPrice = product.price;
            if (variant) {
                const variantAmount = typeof variant.price === "number" ? variant.price : variant.price?.amount;
                const variantCurrency = variant.currency || variant.price?.currency || product.price?.currency;
                if (variantAmount) {
                    itemPrice = { amount: variantAmount, currency: variantCurrency };
                }
            }

            const itemColor = req.body.color || (variant?.attributes instanceof Map ? variant.attributes.get("color") : variant?.attributes?.color) || product.color;
            const itemSize = req.body.size || (variant?.attributes instanceof Map ? variant.attributes.get("size") : variant?.attributes?.size) || req.body.attributes?.size;
            const itemAttributes = req.body.attributes || { color: itemColor, size: itemSize };

            cart.items.push({
                product: productId,
                variant: targetVariantId,
                attributes: itemAttributes,
                color: itemColor,
                size: itemSize,
                quantity,
                price: itemPrice
            });
        }

        await cart.save();
        const updatedCart = await getCartDetails(req.user._id);

        return res.status(200).json({
            message: "Product added to bag successfully",
            success: true,
            cart: updatedCart
        });
    } catch (err) {
        console.error("Add to cart error:", err);
        return res.status(500).json({
            message: err.message || "Failed to add item to bag",
            success: false
        });
    }
};

export const getCart = async (req, res) => {
    try {
        const user = req.user;

        let cart = await getCartDetails(user._id);

        if (!cart) {
            await cartModel.create({ user: user._id, items: [] });
            cart = await getCartDetails(user._id);
        }

        return res.status(200).json({
            message: "Cart fetched successfully",
            success: true,
            cart
        });
    } catch (err) {
        console.error("Get cart error:", err);
        return res.status(500).json({
            message: err.message || "Failed to fetch cart",
            success: false
        });
    }
};

export const incrementCartItemQuantity = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const targetVariantId = variantId || req.body.variantId || null;

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                success: false
            });
        }

        let cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                message: "Cart not found",
                success: false
            });
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId &&
            (targetVariantId ? item.variant?.toString() === targetVariantId.toString() : !item.variant)
        );

        if (itemIndex === -1) {
            return res.status(404).json({
                message: "Item not found in cart",
                success: false
            });
        }

        let variant = null;
        if (targetVariantId && Array.isArray(product.variants)) {
            variant = product.variants.find((v) => v._id.toString() === targetVariantId.toString());
        }
        const stock = variant?.stock !== undefined ? Number(variant.stock) : (product.stock !== undefined ? Number(product.stock) : 10);

        if (cart.items[itemIndex].quantity + 1 > stock) {
            return res.status(400).json({
                message: `Only ${stock} items available in stock.`,
                success: false
            });
        }

        cart.items[itemIndex].quantity += 1;
        await cart.save();

        const updatedCart = await getCartDetails(req.user._id);

        return res.status(200).json({
            message: "Quantity incremented",
            success: true,
            cart: updatedCart
        });
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Failed to increment item quantity",
            success: false
        });
    }
};

export const updateCartItemQuantity = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const targetVariantId = variantId || req.body.variantId || null;
        const quantity = Number(req.body.quantity);

        let cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found", success: false });
        }

        if (isNaN(quantity) || quantity <= 0) {
            cart.items = cart.items.filter(
                (item) => !(item.product.toString() === productId &&
                (targetVariantId ? item.variant?.toString() === targetVariantId.toString() : !item.variant))
            );
        } else {
            const itemIndex = cart.items.findIndex(
                (item) => item.product.toString() === productId &&
                (targetVariantId ? item.variant?.toString() === targetVariantId.toString() : !item.variant)
            );
            if (itemIndex > -1) {
                cart.items[itemIndex].quantity = quantity;
            }
        }

        await cart.save();
        const updatedCart = await getCartDetails(req.user._id);

        return res.status(200).json({
            message: "Cart updated successfully",
            success: true,
            cart: updatedCart
        });
    } catch (err) {
        return res.status(500).json({ message: err.message || "Failed to update quantity", success: false });
    }
};

export const removeFromCart = async (req, res) => {
    try {
        const { productId, variantId } = req.params;
        const targetVariantId = variantId || req.body.variantId || null;

        let cart = await cartModel.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found", success: false });
        }

        cart.items = cart.items.filter(
            (item) => !(item.product.toString() === productId &&
            (targetVariantId ? item.variant?.toString() === targetVariantId.toString() : !item.variant))
        );

        await cart.save();
        const updatedCart = await getCartDetails(req.user._id);

        return res.status(200).json({
            message: "Item removed from cart",
            success: true,
            cart: updatedCart
        });
    } catch (err) {
        return res.status(500).json({ message: err.message || "Failed to remove item", success: false });
    }
};

export const clearCart = async (req, res) => {
    try {
        let cart = await cartModel.findOne({ user: req.user._id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }

        return res.status(200).json({
            message: "Cart cleared successfully",
            success: true,
            cart: { items: [], totalPrice: 0 }
        });
    } catch (err) {
        return res.status(500).json({ message: err.message || "Failed to clear cart", success: false });
    }
};

export const checkoutCart = async (req, res) => {
    try {
        const { items } = req.body;
        let cart = await cartModel.findOne({ user: req.user._id });

        let checkoutItems = [];
        if (Array.isArray(items) && items.length > 0) {
            checkoutItems = items;
        } else if (cart && Array.isArray(cart.items) && cart.items.length > 0) {
            checkoutItems = cart.items;
        }

        if (checkoutItems.length === 0) {
            return res.status(400).json({ message: "No items to checkout", success: false });
        }

        // Deduct inventory stock for each purchased product/variant
        for (const item of checkoutItems) {
            const rawProdId = String(item.product?._id || item.product || item.productId || "").split("_")[0];
            const rawVariantId = item.variant?._id || item.variant || item.variantId || null;
            const purchasedQty = Math.max(1, Number(item.quantity || 1));

            if (!rawProdId || rawProdId.length !== 24) continue;

            const product = await productModel.findById(rawProdId);
            if (!product) continue;

            // Deduct variant stock if variant exists
            if (rawVariantId && Array.isArray(product.variants)) {
                const targetVId = String(rawVariantId).split("_")[0];
                const variant = product.variants.find((v) => v._id.toString() === targetVId);
                if (variant) {
                    const currentVStock = Number(variant.stock || 0);
                    variant.stock = Math.max(0, currentVStock - purchasedQty);
                }
            }

            // Deduct base product stock
            const currentPStock = Number(product.stock !== undefined ? product.stock : 10);
            product.stock = Math.max(0, currentPStock - purchasedQty);

            await product.save();
        }

        // Clear user's cart in DB if full cart checkout
        if (cart && (!items || items.length === 0)) {
            cart.items = [];
            await cart.save();
        }

        return res.status(200).json({
            message: "Order placed successfully! Inventory stock updated.",
            success: true,
            cart: { items: [], totalPrice: 0 }
        });
    } catch (err) {
        console.error("Checkout Error:", err);
        return res.status(500).json({ message: err.message || "Checkout failed", success: false });
    }
};
export const createOrderController = async (req, res) => {
    try {
        const cartDetails = await getCartDetails(req.user._id);

        if(!cartDetails || !cartDetails.items?.length){
            return res.status(400).json({
                message: "Cart is empty",
                success: false
            });
        }
        
        const subtotal = cartDetails?.totalPrice || 0;
        const shippingCost = subtotal >= 2000 ? 0 : 150;
        const totalRupees = req.body?.amount || (subtotal + shippingCost);
        const currency = cartDetails?.currency || "INR";

        const order = await createOrder({
            amount: totalRupees,
            currency
        });

        const orderItems = (cartDetails.items || []).map((item) => {
            const prod = item.product || {};
            const itemPriceAmt = item.price?.amount || prod.price?.amount || 0;
            const itemCurrency = item.price?.currency || prod.price?.currency || currency;

            return {
                title: prod.title || "Untitled Product",
                productId: prod._id || null,
                variantId: item.variant?._id || item.variant || null,
                quantity: item.quantity || 1,
                images: Array.isArray(prod.images) ? prod.images : [],
                description: prod.description || "",
                price: {
                    amount: itemPriceAmt,
                    currency: itemCurrency
                }
            };
        });

        const { shippingAddress } = req.body;

        const payment = await paymentModel.create({
            user: req.user._id,
            status: "pending",
            razorpay: {
                orderId: order.id
            },
            price: {
                amount: totalRupees,
                currency
            },
            orderItems,
            shippingAddress: shippingAddress || null
        });

        return res.status(200).json({
            message: "Order created successfully",
            success: true,
            order,
            paymentId: payment._id
        });

    } catch (err) {
        console.error("Create Razorpay Order Error:", err);
        return res.status(500).json({
            message: err.message || "Failed to create order",
            success: false
        });
    }
};


export const verifyOrderController = async (req, res) => {
    try {
        const {
            razorpay_payment_id,
            razorpay_order_id,
            razorpay_signature
        } = req.body;

        const payment = await paymentModel.findOne({
            "razorpay.orderId": razorpay_order_id,
            status: "pending"
        });

        if (!payment) {
            return res.status(404).json({
                message: "Payment record not found",
                success: false
            });
        }

        const isValid = validatePaymentVerification(
            {
                order_id: razorpay_order_id,
                payment_id: razorpay_payment_id
            },
            razorpay_signature,
            config.RAZORPAY_KEY_SECRET
        );

        if (!isValid) {
            payment.status = "failed";
            await payment.save();
            return res.status(400).json({
                message: "Payment verification failed",
                success: false
            });
        }

        payment.status = "success";
        payment.razorpay.paymentId = razorpay_payment_id;
        payment.razorpay.signature = razorpay_signature;
        await payment.save();

        // Clear user cart on successful order completion
        await cartModel.findOneAndUpdate({ user: payment.user }, { items: [] });

        return res.status(200).json({
            message: "Payment verification successful",
            success: true
        });
    } catch (err) {
        console.error("Verify order error:", err);
        return res.status(500).json({
            message: err.message || "Payment verification failed",
            success: false
        });
    }
};

export const getUserOrders = async (req, res) => {
    try {
        const orders = await paymentModel.find({ user: req.user._id, status: "success" }).sort({ createdAt: -1 });
        return res.status(200).json({
            message: "User orders fetched successfully",
            success: true,
            orders
        });
    } catch (err) {
        console.error("Get User Orders Error:", err);
        return res.status(500).json({ message: err.message || "Failed to fetch orders", success: false });
    }
};

export const getSellerOrders = async (req, res) => {
    try {
        const sellerProducts = await productModel.find({ seller: req.user._id }).select("_id");
        const sellerProductIds = sellerProducts.map((p) => p._id.toString());

        const allPaidOrders = await paymentModel.find({ status: "success" }).sort({ createdAt: -1 });
        
        const filteredOrders = allPaidOrders.filter((order) => {
            return order.orderItems?.some((item) => item.productId && sellerProductIds.includes(item.productId.toString()));
        });

        return res.status(200).json({
            message: "Seller orders fetched successfully",
            success: true,
            orders: filteredOrders
        });
    } catch (err) {
        console.error("Get Seller Orders Error:", err);
        return res.status(500).json({ message: err.message || "Failed to fetch seller orders", success: false });
    }
};

export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { deliveryStatus } = req.body;

        const validStatuses = ["Order Placed", "Processing", "Shipped", "Delivered"];
        if (!validStatuses.includes(deliveryStatus)) {
            return res.status(400).json({ message: "Invalid delivery status", success: false });
        }

        const order = await paymentModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: "Order not found", success: false });
        }

        order.deliveryStatus = deliveryStatus;
        await order.save();

        return res.status(200).json({
            message: `Order status updated to "${deliveryStatus}"`,
            success: true,
            order
        });
    } catch (err) {
        console.error("Update Order Status Error:", err);
        return res.status(500).json({ message: err.message || "Failed to update order status", success: false });
    }
};

export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const isHex = mongoose.Types.ObjectId.isValid(orderId);
        const order = await paymentModel.findOne({
            $or: [
                ...(isHex ? [{ _id: orderId }] : []),
                { "razorpay.orderId": orderId }
            ]
        });

        if (!order) {
            return res.status(404).json({ message: "Order details not found", success: false });
        }

        return res.status(200).json({
            message: "Order details fetched successfully",
            success: true,
            order
        });
    } catch (err) {
        console.error("Get Order Details Error:", err);
        return res.status(500).json({ message: err.message || "Failed to fetch order details", success: false });
    }
};