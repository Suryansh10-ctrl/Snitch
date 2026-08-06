import axios from "axios";
import { API_BASE_URL } from "../../../config/api.config";

const feedbackApiInstance = axios.create({
    baseURL: `${API_BASE_URL}/api/feedback`,
    withCredentials: true,
    timeout: 10000,
});

// Attach Authorization header if token exists
feedbackApiInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export async function fetchFeedbacksApi() {
    const response = await feedbackApiInstance.get("");
    return response.data?.feedbacks || [];
}

export async function createFeedbackApi(feedbackData) {
    const response = await feedbackApiInstance.post("", feedbackData);
    return response.data?.feedback;
}

export async function updateFeedbackApi(id, feedbackData) {
    const response = await feedbackApiInstance.put(`/${id}`, feedbackData);
    return response.data?.feedback;
}

export async function deleteFeedbackApi(id) {
    const response = await feedbackApiInstance.delete(`/${id}`);
    return response.data;
}
