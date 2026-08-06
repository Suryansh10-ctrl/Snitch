import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    rating: {
        type: Number,
        required: true,
        default: 5,
        min: 1,
        max: 5,
    },
    category: {
        type: String,
        required: true,
        default: "Product Quality",
    },
    comment: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: "Verified Buyer",
    }
}, {
    timestamps: true
});

const feedbackModel = mongoose.model("feedback", feedbackSchema);
export default feedbackModel;
