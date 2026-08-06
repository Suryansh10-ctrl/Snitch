import { useDispatch, useSelector } from "react-redux";
import { setFeedbacks, addFeedback, updateFeedbackInState, deleteFeedbackFromState, setLoading, setError } from "../state/feedback.slice.js";
import { fetchFeedbacksApi, createFeedbackApi, updateFeedbackApi, deleteFeedbackApi } from "../service/feedback.api.js";
import toast from "react-hot-toast";

export const useFeedback = () => {
    const dispatch = useDispatch();
    const feedbacks = useSelector((state) => state.feedback?.feedbacks || []);
    const user = useSelector((state) => state.auth?.user);

    const isFeedbackOwner = (fb) => {
        if (!user || !fb) return false;
        const currentUserId = user._id || user.id || user.email;
        if (fb.userId && currentUserId) {
            return String(fb.userId) === String(currentUserId);
        }
        const currentName = (user.fullname || user.name || user.email?.split("@")[0] || "").toLowerCase().trim();
        const fbName = (fb.name || "").toLowerCase().trim();
        return currentName !== "" && currentName === fbName;
    };

    const handleGetFeedbacks = async () => {
        try {
            dispatch(setLoading(true));
            const list = await fetchFeedbacksApi();
            if (Array.isArray(list) && list.length > 0) {
                // Merge DB items with existing local items so nothing is lost
                const dbIds = new Set(list.map((item) => String(item._id || item.id)));
                const localOnly = feedbacks.filter((item) => !dbIds.has(String(item._id || item.id)));
                const merged = [...list, ...localOnly];
                dispatch(setFeedbacks(merged));
                return merged;
            }
        } catch (err) {
            console.error("useFeedback: Failed to fetch feedbacks from DB, using current state/localStorage fallback", err);
        } finally {
            dispatch(setLoading(false));
        }
        return feedbacks;
    };

    const handleCreateFeedback = async (payload) => {
        try {
            dispatch(setLoading(true));
            let createdFeedback = null;
            if (user) {
                try {
                    createdFeedback = await createFeedbackApi(payload);
                } catch (err) {
                    console.error("Backend create feedback error:", err);
                }
            }

            if (!createdFeedback) {
                const currentUserId = user?._id || user?.id || user?.email || user?.fullname || user?.name;
                createdFeedback = {
                    id: Date.now(),
                    _id: Date.now(),
                    userId: currentUserId,
                    name: payload.name || user?.fullname || user?.name || user?.email?.split("@")[0] || "Valued Customer",
                    rating: payload.rating || 5,
                    category: payload.category || "Product Quality",
                    comment: payload.comment,
                    role: "Verified Buyer",
                    date: "Just now"
                };
            }

            dispatch(addFeedback(createdFeedback));
            toast.success("Thank you! Your feedback has been submitted successfully. 🌟");
            return createdFeedback;
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to submit feedback";
            dispatch(setError(msg));
            toast.error(msg);
            throw err;
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleUpdateFeedback = async (id, payload, targetFb) => {
        if (targetFb && !isFeedbackOwner(targetFb)) {
            toast.error("You can only edit your own feedback.");
            return;
        }

        try {
            dispatch(setLoading(true));
            let updatedFeedback = null;
            if (typeof id === "string" && !id.startsWith("default_")) {
                try {
                    updatedFeedback = await updateFeedbackApi(id, payload);
                } catch (err) {
                    console.error("Backend update feedback error:", err);
                }
            }

            if (!updatedFeedback) {
                updatedFeedback = {
                    ...(targetFb || {}),
                    id,
                    _id: id,
                    name: payload.name || targetFb?.name,
                    rating: payload.rating || targetFb?.rating || 5,
                    category: payload.category || targetFb?.category || "Product Quality",
                    comment: payload.comment || targetFb?.comment,
                    date: "Edited just now"
                };
            }

            dispatch(updateFeedbackInState(updatedFeedback));
            toast.success("Feedback updated successfully! ✏️");
            return updatedFeedback;
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to update feedback";
            dispatch(setError(msg));
            toast.error(msg);
            throw err;
        } finally {
            dispatch(setLoading(false));
        }
    };

    const handleDeleteFeedback = async (targetFb) => {
        if (!isFeedbackOwner(targetFb)) {
            toast.error("You can only delete your own feedback.");
            return;
        }

        const targetId = targetFb._id || targetFb.id;

        try {
            dispatch(setLoading(true));
            if (typeof targetId === "string" && !targetId.startsWith("default_")) {
                try {
                    await deleteFeedbackApi(targetId);
                } catch (err) {
                    console.error("Backend delete feedback error:", err);
                }
            }

            dispatch(deleteFeedbackFromState(targetId));
            toast.success("Feedback deleted successfully! 🗑️");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to delete feedback";
            dispatch(setError(msg));
            toast.error(msg);
            throw err;
        } finally {
            dispatch(setLoading(false));
        }
    };

    return {
        feedbacks,
        isFeedbackOwner,
        handleGetFeedbacks,
        handleCreateFeedback,
        handleUpdateFeedback,
        handleDeleteFeedback
    };
};
