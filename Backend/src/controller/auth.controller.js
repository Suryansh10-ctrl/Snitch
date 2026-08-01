import express from "express";
import userModel from "../models/user.model.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { config } from "../config/config.js";



async function sendTokenResponse (user,res,message){
    const token = jwt.sign({
        id: user._id,
    },config.JWT_SECRET, {
        expiresIn: "7d"
    })

    res.cookie("token", token)

    res.status(200).json({
        message,
        token,
        user: {
            id: user._id,
            fullname: user.fullname,
            email: user.email,
            contact: user.contact,
            role: user.role,
        }
    })
}

export const registerUser = async (req,res) => {
    const {email,contact, password, fullname,isSeller} = req.body;

    try{
        const existingUser = await userModel.findOne({
            $or: [
                {email},
                {contact}
            ]
        })

        if(existingUser){
            return res.status(400).json({
                message: "user with email or contact already exists"
            })
        }

        const user = await userModel.create({
            email,
            contact,
            password,
            fullname,
            role: isSeller ? "seller" : "buyer"
        })

        await sendTokenResponse(user,res,"user registered successfully")

    } catch (err) {
        console.error("Register Error:", err);
        return res.status(500).json({
            message: err.message || "Internal server error during registration"
        });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        const isMatched = await user.comparePassword(password);

        if (!isMatched) {
            return res.status(400).json({
                message: "Invalid email or password"
            });
        }

        await sendTokenResponse(user, res, "User logged in successfully");

    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({
            message: err.message || "Internal server error during login"
        });
    }
};

export const googleCallback = async (req, res) => {
    try {
        const { id, displayName, emails } = req.user || {};
        const email = emails?.[0]?.value;

        if (!email) {
            return res.redirect("http://localhost:5173/login?error=NoEmailFromGoogle");
        }

        let user = await userModel.findOne({ email });

        if (!user) {
            user = await userModel.create({
                email,
                googleId: id,
                fullname: displayName || "Google User",
                role: "buyer"
            });
        } else if (!user.googleId) {
            user.googleId = id;
            await user.save();
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, role: user.role },
            config.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return res.redirect("http://localhost:5173/?token=" + token);
    } catch (err) {
        console.error("Google Callback Controller Error:", err);
        return res.redirect("http://localhost:5173/login?error=GoogleCallbackError");
    }
};

export const getMe = async (req,res) => {
    const user = req.user;

    res.status(200).json({
        message: "User Fetched successfully",
        success: true,
        user: {
            id: user._id,
            email: user.email,
            contact: user.contact,
            role: user.role,
            fullname: user.fullname,
        }
    })
}

export const logoutUser = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({
        message: "Logged out successfully",
        success: true
    });
};