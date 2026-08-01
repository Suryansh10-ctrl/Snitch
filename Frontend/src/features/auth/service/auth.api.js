import axios from "axios"

const authApiInstance = axios.create({
    baseURL: "/api/auth",
    withCredentials: true,
    timeout: 10000,
})

// Attach Bearer Token if present in localStorage
authApiInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => Promise.reject(error));


export async function register(userData, password, fullname, contact, isSeller = false) {
    const payload = (typeof userData === "object" && userData !== null)
        ? userData
        : { email: userData, password, fullname, contact, isSeller };

    const response = await authApiInstance.post("/register", payload);
    if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
    }
    return response.data;
}

export async function login({email, password}) {
    const payload = { email, password };
    const response = await authApiInstance.post("/login", payload);
    if (response.data?.token) {
        localStorage.setItem("token", response.data.token);
    }
    return response.data;
}

export async function getMe(){
    try {
        const response = await authApiInstance.get('/me');
        return response.data;
    } catch (err) {
        if (err.response?.status === 401) {
            return { user: null };
        }
        throw err;
    }
}

export async function logout(){
    try {
        const response = await authApiInstance.post('/logout');
        return response.data;
    } finally {
        localStorage.removeItem("token");
    }
}