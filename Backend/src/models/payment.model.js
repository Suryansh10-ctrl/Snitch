import mongoose from "mongoose";
import priceSchema from "../models/price.schema.js";

const paymentSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ["pending", "success", "failed"],
        default: "pending",
    },
    deliveryStatus: {
        type: String,
        enum: ["Order Placed", "Processing", "Shipped", "Delivered"],
        default: "Order Placed",
    },
    price: {
        type: priceSchema,
        required: true,
    },
    razorpay: {
        orderId: String,
        paymentId: String,
        signature: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    orderItems: [
        {
            title: String,
            productId: mongoose.Schema.Types.ObjectId,
            variantId: mongoose.Schema.Types.ObjectId,
            quantity: Number,
            images: [{url: String}],
            description: String,
            price: priceSchema,
        }
    ],
    shippingAddress: {
        fullName: String,
        contact: String,
        streetAddress: String,
        city: String,
        state: String,
        pincode: String,
        landmark: String,
        addressType: String
    }
}, { timestamps: true })


const paymentModel = mongoose.model("payment", paymentSchema)
export default paymentModel;