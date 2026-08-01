import axios from "axios";
import { API_BASE_URL } from "../../../config/api.config";

const cartApiInstance = axios.create({
    baseURL: `${API_BASE_URL}/api/cart`,
    withCredentials: true
});

export const addItem = async ({ productId, variantId, quantity = 1, attributes, color, size }) => {
    const cleanProductId = String(productId).split("_")[0];
    const isMongoHex = variantId && /^[0-9a-fA-F]{24}$/.test(String(variantId));
    const url = isMongoHex ? `/add/${cleanProductId}/${variantId}` : `/add/${cleanProductId}`;
    const response = await cartApiInstance.post(url, { quantity, variantId, attributes, color, size });
    return response.data;
};

export const getCart = async () => {
    const response = await cartApiInstance.get("/");
    return response.data;
};

export const incrementCartItemApi = async ({ productId, variantId }) => {
    const cleanProductId = String(productId).split("_")[0];
    const isMongoHex = variantId && /^[0-9a-fA-F]{24}$/.test(String(variantId));
    const url = isMongoHex ? `/quantity/increment/${cleanProductId}/${variantId}` : `/quantity/increment/${cleanProductId}`;
    const response = await cartApiInstance.patch(url, { variantId });
    return response.data;
};

export const updateQuantityApi = async ({ productId, variantId, quantity }) => {
    const cleanProductId = String(productId).split("_")[0];
    const isMongoHex = variantId && /^[0-9a-fA-F]{24}$/.test(String(variantId));
    const url = isMongoHex ? `/quantity/${cleanProductId}/${variantId}` : `/quantity/${cleanProductId}`;
    const response = await cartApiInstance.patch(url, { quantity, variantId });
    return response.data;
};

export const removeFromCartApi = async ({ productId, variantId }) => {
    const cleanProductId = String(productId).split("_")[0];
    const isMongoHex = variantId && /^[0-9a-fA-F]{24}$/.test(String(variantId));
    const url = isMongoHex ? `/item/${cleanProductId}/${variantId}` : `/item/${cleanProductId}`;
    const response = await cartApiInstance.delete(url, { data: { variantId } });
    return response.data;
};

export const clearCartApi = async () => {
    const response = await cartApiInstance.delete("/clear");
    return response.data;
};

export const checkoutApi = async (items = null) => {
    const response = await cartApiInstance.post("/checkout", { items });
    return response.data;
};

export const createCartOrder = async (amount = null, shippingAddress = null) => {
    const response = await cartApiInstance.post("/payment/create/order", { amount, shippingAddress });
    return response.data;
};

export const verifyCartOrder = async ({razorpay_order_id,razorpay_payment_id,razorpay_signature}) => {
    const response = await cartApiInstance.post("/payment/verify/order", {razorpay_order_id,razorpay_payment_id,razorpay_signature
    });
    
    return response.data;
};

export const getUserOrdersApi = async () => {
    const response = await cartApiInstance.get("/my-orders");
    return response.data;
};

export const getSellerOrdersApi = async () => {
    const response = await cartApiInstance.get("/seller-orders");
    return response.data;
};

export const getOrderDetailsApi = async (orderId) => {
    const response = await cartApiInstance.get(`/order-details/${orderId}`);
    return response.data;
};

export const updateOrderStatusApi = async (orderId, deliveryStatus) => {
    const response = await cartApiInstance.patch(`/order-status/${orderId}`, { deliveryStatus });
    return response.data;
};