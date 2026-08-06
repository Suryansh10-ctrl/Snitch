import { Router } from "express";
import passport from "passport";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { validateRegisterUser, validateLoginUser } from "../validator/auth.validator.js";
import { registerUser, loginUser, getMe, logoutUser } from "../controller/auth.controller.js";
import { authenticateUser } from "../middleware/auth.middleware.js";

const authrouter = Router();

authrouter.post('/register', validateRegisterUser, registerUser);
authrouter.post('/login', validateLoginUser, loginUser);
authrouter.post('/logout', logoutUser);

authrouter.get('/google', (req, res, next) => {
    if (!config.CLIENT_ID || config.CLIENT_ID === "dummy_client_id") {
        return res.status(400).json({
            message: "Google OAuth credentials (CLIENT_ID / CLIENT_SECRET) are not configured in Backend .env file."
        });
    }
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// Callback route that Google will redirect to after authentication
authrouter.get('/google/callback', (req, res, next) => {
    if (!config.CLIENT_ID || config.CLIENT_ID === "dummy_client_id") {
        return res.status(400).json({
            message: "Google OAuth credentials (CLIENT_ID / CLIENT_SECRET) are not configured in Backend .env file."
        });
    }
    const host = req.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    const clientUrl = process.env.CLIENT_URL || (isLocal ? "http://localhost:5173" : "https://snitch-b1zz.onrender.com");
    passport.authenticate('google', { session: false }, (err, user, info) => {
        if (err || !user) {
            console.error("Google Authentication Callback Error:", err || info);
            return res.redirect(`${clientUrl}/login?error=GoogleAuthFailed`);
        }
        const userId = user._id || user.id;
        const token = jwt.sign(
            { id: userId },
            config.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.cookie('token', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        return res.redirect(`${clientUrl}/?token=${token}`);
    })(req, res, next);
});

authrouter.get('/me', authenticateUser, getMe)

export default authrouter;