import { createSlice } from "@reduxjs/toolkit";

const INITIAL_DEFAULT_FEEDBACKS = [
    {
        _id: "default_1",
        id: "default_1",
        name: "Emma Watson",
        rating: 5,
        category: "Product Quality",
        comment: "The craftsmanship of the Oversized Linen Shirt is unbelievable. Delivered to London in 3 days!",
        role: "Verified Buyer",
        date: "2 days ago"
    },
    {
        _id: "default_2",
        id: "default_2",
        name: "Marcus Chen",
        rating: 5,
        category: "Delivery & Shipping",
        comment: "Finding authentic streetwear and fast delivery in one place is amazing. 10/10 service!",
        role: "Verified Buyer",
        date: "1 week ago"
    },
    {
        _id: "default_3",
        id: "default_3",
        name: "Sophia Loren",
        rating: 5,
        category: "Sizing & Fit",
        comment: "The oversized fit guidance was spot on. Premium fabric texture and great packaging.",
        role: "Verified Buyer",
        date: "2 weeks ago"
    },
    {
        _id: "default_4",
        id: "default_4",
        name: "Aarav Sharma",
        rating: 5,
        category: "Product Quality",
        comment: "The quality of Snitch denim jackets is top tier. Extremely comfortable fabric for everyday wear.",
        role: "Verified Buyer",
        date: "3 weeks ago"
    },
    {
        _id: "default_5",
        id: "default_5",
        name: "Jessica Taylor",
        rating: 5,
        category: "Customer Support",
        comment: "Had a small issue with sizing exchange, but customer support resolved it in less than an hour!",
        role: "Verified Buyer",
        date: "1 month ago"
    },
    {
        _id: "default_6",
        id: "default_6",
        name: "Vikram Malhotra",
        rating: 5,
        category: "Delivery & Shipping",
        comment: "Lightning fast delivery! The package arrived neatly wrapped with zero hassle.",
        role: "Verified Buyer",
        date: "1 month ago"
    }
];

const loadInitialFeedbacks = () => {
    try {
        const saved = localStorage.getItem("snitch_user_feedbacks");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Failed to parse feedbacks from localStorage:", e);
    }
    return INITIAL_DEFAULT_FEEDBACKS;
};

const feedbackSlice = createSlice({
    name: "feedback",
    initialState: {
        feedbacks: loadInitialFeedbacks(),
        loading: false,
        error: null,
    },
    reducers: {
        setFeedbacks: (state, action) => {
            state.feedbacks = action.payload;
            try {
                localStorage.setItem("snitch_user_feedbacks", JSON.stringify(action.payload));
            } catch (e) {
                console.error("Failed to sync feedbacks to localStorage:", e);
            }
        },
        addFeedback: (state, action) => {
            state.feedbacks = [action.payload, ...state.feedbacks];
            try {
                localStorage.setItem("snitch_user_feedbacks", JSON.stringify(state.feedbacks));
            } catch (e) {
                console.error("Failed to sync feedbacks to localStorage:", e);
            }
        },
        updateFeedbackInState: (state, action) => {
            const updatedItem = action.payload;
            const targetId = updatedItem._id || updatedItem.id;
            state.feedbacks = state.feedbacks.map((fb) =>
                (fb._id || fb.id) === targetId ? { ...fb, ...updatedItem } : fb
            );
            try {
                localStorage.setItem("snitch_user_feedbacks", JSON.stringify(state.feedbacks));
            } catch (e) {
                console.error("Failed to sync feedbacks to localStorage:", e);
            }
        },
        deleteFeedbackFromState: (state, action) => {
            const targetId = action.payload;
            state.feedbacks = state.feedbacks.filter((fb) => (fb._id || fb.id) !== targetId);
            try {
                localStorage.setItem("snitch_user_feedbacks", JSON.stringify(state.feedbacks));
            } catch (e) {
                console.error("Failed to sync feedbacks to localStorage:", e);
            }
        },
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        }
    }
});

export const {
    setFeedbacks,
    addFeedback,
    updateFeedbackInState,
    deleteFeedbackFromState,
    setLoading,
    setError
} = feedbackSlice.actions;

export default feedbackSlice.reducer;
