import { setError, setLoading, setUser } from "../state/authSlice.js";
import { register, login, getMe, logout } from "../service/auth.api.js";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

export const useAuth = () => {
    const dispatch = useDispatch();

    async function handleRegister({ email, password, fullname, contact, isSeller = false }) {
        try {
            dispatch(setLoading(true));
            dispatch(setError(null));
            const data = await register({ email, password, fullname, contact, isSeller });
            dispatch(setUser(data.user));
            toast.success(`Welcome to SNITCH, ${data.user?.fullname || "Member"}! 🎉`);
            return data.user;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Registration failed";
            dispatch(setError(errorMessage));
            toast.error(errorMessage);
            throw err;
        } finally {
            dispatch(setLoading(false));
        }
    }

    async function handleLogin({email,password}){
        try{
            dispatch(setLoading(true));
            dispatch(setError(null));
            const data = await login({email,password});
            dispatch(setUser(data.user));
            toast.success(`Logged in successfully! Welcome back 👋`);
            return data.user;
        }catch(err){
            const errorMessage = err.response?.data?.message || err.message || "Login failed";
            dispatch(setError(errorMessage));
            toast.error(errorMessage);
            throw err;
        }finally{
            dispatch(setLoading(false));
        }
    }

    async function handleGetMe(){
        try{
            dispatch(setLoading(true));
            const data = await getMe();
            if (data?.user) {
                dispatch(setUser(data.user));
            } else {
                dispatch(setUser(null));
            }
        }catch(err){
            dispatch(setUser(null));
        }finally{
            dispatch(setLoading(false));
        }   
    }

    async function handleLogout(){
        try{
            dispatch(setLoading(true));
            await logout();
            dispatch(setUser(null));
            toast.success("Logged out successfully.");
        }catch(err){
            console.error("Logout Error:", err);
            dispatch(setUser(null));
            toast.success("Logged out.");
        }finally{
            dispatch(setLoading(false));
        }
    }

    return { handleRegister, handleLogin, handleGetMe, handleLogout };
}