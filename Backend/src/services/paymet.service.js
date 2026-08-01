import Razorpay from "razorpay";
import { validatePaymentVerification } from "razorpay/dist/utils/razorpay-utils.js";
import { config } from "../config/config.js";

const razorpay = new Razorpay({
    key_id: config.RAZORPAY_KEY_ID,
    key_secret: config.RAZORPAY_KEY_SECRET
});

export const createOrder = async ({ amount, currency = "INR" }) => {
    const options = {
        amount: Math.round(Number(amount) * 100),
        currency: currency,
    };

    const order = await razorpay.orders.create(options);
    return order;
};

export { validatePaymentVerification };