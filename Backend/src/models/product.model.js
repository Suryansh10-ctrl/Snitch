import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        default: "Clothing"
    },
    brand: {
        type: String,
        default: "Snitch"
    },
    color: {
        type: String,
        default: ""
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    price: {
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            enum: ["USD", "EUR", "GBP", "JPY", "INR"],
            default: "INR",
        }
    },
    images: [{
        url: {
            type: String,
            required: true
        }
    }],
    variants: [
        {
            images: [
                {
                    url: {
                        type: String,
                        required: true
                    }
                }
            ],
            stock: {
                type: Number,
                required: true,
                default: 0
            },
            attributes: {
                type: Map,
                of: String
            },
            price: {
                type: Number,
                required: true
            },
            currency: {
                type: String,
                enum: ["USD","EUR","GBP","JPY","INR"],
                default: "INR"
            }
        }
    ]
}, { timestamps: true });



const productModel = mongoose.model("product", productSchema)

export default productModel;