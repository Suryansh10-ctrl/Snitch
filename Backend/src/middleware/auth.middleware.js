import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import { config } from "../config/config.js";

export const authenticateSeller = async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized - Token missing"
        });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized - User not found"
            });
        }

        if (user.role !== "seller") {
            return res.status(403).json({
                message: "Forbidden - Seller role required"
            });
        }

        req.user = user;
        next();

    } catch (err) {
        console.error("Auth Middleware Error:", err);
        return res.status(401).json({
            message: "Unauthorized - Invalid or expired token"
        });
    }
};

export const authenicateSeller = authenticateSeller;

export const authenticateUser = async (req, res, next) => {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized - Token missing"
        });
    }

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized - User not found"
            });
        }

        req.user = user;
        next();

    } catch (err) {
        console.error("Auth Middleware Error:", err);
        return res.status(401).json({
            message: "Unauthorized - Invalid or expired token"
        });
    }
};

export const isLoggedIn = authenticateUser;
