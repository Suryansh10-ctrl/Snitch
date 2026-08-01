import cartModel from "../models/cart.model.js";
import mongoose from "mongoose";

export async function getCartDetails(userId) {
    const cart = await cartModel.findOne({ user: userId }).populate("items.product");
    if (!cart) return null;

    let totalPrice = 0;
    let currency = "INR";

    const formattedItems = cart.items.map((item) => {
        const prod = item.product;
        let itemPriceAmount = item.price?.amount || prod?.price?.amount || 0;
        let itemCurrency = item.price?.currency || prod?.price?.currency || "INR";
        currency = itemCurrency;

        let selectedVariant = null;
        if (prod && item.variant && Array.isArray(prod.variants)) {
            selectedVariant = prod.variants.find(
                (v) => v._id && item.variant && v._id.toString() === item.variant.toString()
            );
            if (selectedVariant) {
                if (typeof selectedVariant.price === "number") {
                    itemPriceAmount = selectedVariant.price;
                } else if (selectedVariant.price?.amount) {
                    itemPriceAmount = selectedVariant.price.amount;
                }
                if (selectedVariant.currency) itemCurrency = selectedVariant.currency;
                if (selectedVariant.price?.currency) itemCurrency = selectedVariant.price.currency;
            }
        }

        totalPrice += itemPriceAmount * item.quantity;

        return {
            _id: item._id,
            product: prod,
            variant: item.variant,
            selectedVariant,
            attributes: item.attributes,
            color: item.color,
            size: item.size,
            quantity: item.quantity,
            price: { amount: itemPriceAmount, currency: itemCurrency }
        };
    });

    return {
        _id: cart._id,
        user: cart.user,
        items: formattedItems,
        totalPrice,
        currency
    };
}