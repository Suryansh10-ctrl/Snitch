import express from 'express';
import { authenticateUser } from '../middleware/auth.middleware.js';
import { validateAddToCart, validateIncrementCartItemQuantity } from '../validator/cart.validator.js';
import {
  addToCart,
  getCart,
  incrementCartItemQuantity,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  checkoutCart,
  createOrderController,
  verifyOrderController,
  getUserOrders,
  getSellerOrders,
  updateOrderStatus,
  getOrderDetails
} from '../controller/cart.controller.js';

const router = express.Router();

// GET /api/cart - Get user's cart
router.get('/', authenticateUser, getCart);

// POST /api/cart/add/:productId/:variantId? - Add item to cart
router.post(["/add/:productId", "/add/:productId/:variantId"], authenticateUser, validateAddToCart, addToCart);

// PATCH /api/cart/quantity/increment/:productId/:variantId? - Increment item quantity
router.patch(["/quantity/increment/:productId", "/quantity/increment/:productId/:variantId"], authenticateUser, validateIncrementCartItemQuantity, incrementCartItemQuantity);

// PATCH /api/cart/quantity/:productId/:variantId? - Update item quantity directly
router.patch(["/quantity/:productId", "/quantity/:productId/:variantId"], authenticateUser, updateCartItemQuantity);

// DELETE /api/cart/item/:productId/:variantId? - Remove item from cart
router.delete(["/item/:productId", "/item/:productId/:variantId"], authenticateUser, removeFromCart);

// DELETE /api/cart/clear - Clear all items from cart
router.delete("/clear", authenticateUser, clearCart);

// POST /api/cart/checkout - Process order & deduct inventory stock
router.post("/checkout", authenticateUser, checkoutCart);

router.post("/payment/create/order", authenticateUser, createOrderController);
router.post("/payment/verify/order", authenticateUser, verifyOrderController);

// Order tracking & management routes
router.get("/my-orders", authenticateUser, getUserOrders);
router.get("/seller-orders", authenticateUser, getSellerOrders);
router.get("/order-details/:orderId", authenticateUser, getOrderDetails);
router.patch("/order-status/:orderId", authenticateUser, updateOrderStatus);

export default router;