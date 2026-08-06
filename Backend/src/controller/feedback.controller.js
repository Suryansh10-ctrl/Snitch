import feedbackModel from "../models/feedback.model.js";

const DEFAULT_FEEDBACKS = [
    {
        _id: "default_1",
        name: "Emma Watson",
        rating: 5,
        category: "Product Quality",
        comment: "The craftsmanship of the Oversized Linen Shirt is unbelievable. Delivered to London in 3 days!",
        role: "Verified Buyer",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        _id: "default_2",
        name: "Marcus Chen",
        rating: 5,
        category: "Delivery & Shipping",
        comment: "Finding authentic streetwear and fast delivery in one place is amazing. 10/10 service!",
        role: "Verified Buyer",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        _id: "default_3",
        name: "Sophia Loren",
        rating: 5,
        category: "Sizing & Fit",
        comment: "The oversized fit guidance was spot on. Premium fabric texture and great packaging.",
        role: "Verified Buyer",
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        _id: "default_4",
        name: "Aarav Sharma",
        rating: 5,
        category: "Product Quality",
        comment: "The quality of Snitch denim jackets is top tier. Extremely comfortable fabric for everyday wear.",
        role: "Verified Buyer",
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        _id: "default_5",
        name: "Jessica Taylor",
        rating: 5,
        category: "Customer Support",
        comment: "Had a small issue with sizing exchange, but customer support resolved it in less than an hour!",
        role: "Verified Buyer",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        _id: "default_6",
        name: "Vikram Malhotra",
        rating: 5,
        category: "Delivery & Shipping",
        comment: "Lightning fast delivery! The package arrived neatly wrapped with zero hassle.",
        role: "Verified Buyer",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
];

export const getAllFeedbacks = async (req, res) => {
    try {
        const dbFeedbacks = await feedbackModel.find().sort({ createdAt: -1 });
        
        // Map db feedbacks to standard shape
        const formattedDbFeedbacks = dbFeedbacks.map((fb) => ({
            _id: fb._id,
            id: fb._id,
            userId: fb.user,
            name: fb.name,
            rating: fb.rating,
            category: fb.category,
            comment: fb.comment,
            role: fb.role || "Verified Buyer",
            date: "Recently",
            createdAt: fb.createdAt
        }));

        // Combine DB feedbacks with default sample reviews
        const combined = [...formattedDbFeedbacks, ...DEFAULT_FEEDBACKS];

        return res.status(200).json({
            success: true,
            feedbacks: combined
        });
    } catch (err) {
        console.error("Get Feedbacks Error:", err);
        return res.status(200).json({
            success: true,
            feedbacks: DEFAULT_FEEDBACKS
        });
    }
};

export const createFeedback = async (req, res) => {
    try {
        const { rating, category, comment, name } = req.body;

        if (!comment || !comment.trim()) {
            return res.status(400).json({ message: "Comment is required" });
        }

        const authorName = name || req.user?.fullname || req.user?.name || req.user?.email?.split("@")[0] || "Valued Customer";

        const newFeedback = await feedbackModel.create({
            user: req.user._id,
            name: authorName,
            rating: Number(rating) || 5,
            category: category || "Product Quality",
            comment: comment.trim(),
            role: "Verified Buyer"
        });

        return res.status(201).json({
            success: true,
            message: "Feedback submitted successfully",
            feedback: {
                _id: newFeedback._id,
                id: newFeedback._id,
                userId: newFeedback.user,
                name: newFeedback.name,
                rating: newFeedback.rating,
                category: newFeedback.category,
                comment: newFeedback.comment,
                role: newFeedback.role,
                date: "Just now",
                createdAt: newFeedback.createdAt
            }
        });
    } catch (err) {
        console.error("Create Feedback Error:", err);
        return res.status(500).json({ message: err.message || "Failed to create feedback" });
    }
};

export const updateFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, category, comment, name } = req.body;

        const feedback = await feedbackModel.findById(id);

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        // Authorization check: ONLY feedback owner can edit
        if (String(feedback.user) !== String(req.user._id)) {
            return res.status(403).json({ message: "Forbidden - You can only edit your own feedback" });
        }

        if (rating) feedback.rating = Number(rating);
        if (category) feedback.category = category;
        if (comment) feedback.comment = comment.trim();
        if (name) feedback.name = name;

        await feedback.save();

        return res.status(200).json({
            success: true,
            message: "Feedback updated successfully",
            feedback: {
                _id: feedback._id,
                id: feedback._id,
                userId: feedback.user,
                name: feedback.name,
                rating: feedback.rating,
                category: feedback.category,
                comment: feedback.comment,
                role: feedback.role,
                date: "Edited just now",
                createdAt: feedback.createdAt
            }
        });
    } catch (err) {
        console.error("Update Feedback Error:", err);
        return res.status(500).json({ message: err.message || "Failed to update feedback" });
    }
};

export const deleteFeedback = async (req, res) => {
    try {
        const { id } = req.params;
        const feedback = await feedbackModel.findById(id);

        if (!feedback) {
            return res.status(404).json({ message: "Feedback not found" });
        }

        // Authorization check: ONLY feedback owner can delete
        if (String(feedback.user) !== String(req.user._id)) {
            return res.status(403).json({ message: "Forbidden - You can only delete your own feedback" });
        }

        await feedbackModel.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Feedback deleted successfully"
        });
    } catch (err) {
        console.error("Delete Feedback Error:", err);
        return res.status(500).json({ message: err.message || "Failed to delete feedback" });
    }
};
