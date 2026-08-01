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
    passport.authenticate('google', { session: false,
        failureRedirect: config.node_env == "development" ? "http://localhost:5713/login" : "/login",
     }, (err, user, info) => {
        if (err || !user) {
            return res.redirect('http://localhost:5173/login?error=GoogleAuthFailed');
        }
        const token = jwt.sign(
            { id: user.id, displayName: user.displayName, email: user.emails?.[0]?.value },
            config.JWT_SECRET,
            { expiresIn: '7d' }
        );
        res.cookie('token', token);
        return res.redirect(`http://localhost:5173/?token=${token}`);
    })(req, res, next);
});

authrouter.get('/me', authenticateUser, getMe)

export default authrouter;