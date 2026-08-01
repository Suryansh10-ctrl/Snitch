import express from "express"
import morgan from "morgan"
import cookieParser from "cookie-parser"
import cors from "cors"
import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import { config } from "./config/config.js"

import userModel from "./models/user.model.js"
import authRouter from "./routes/auth.routes.js"
import productRouter from "./routes/product.routes.js"
import cartRouter from "./routes/cart.routes.js"
import addressRouter from "./routes/address.routes.js"

const app = express()


app.use(morgan("dev"))
app.use(express.json())

const allowedOrigins = [
    "https://snitch-b1zz.onrender.com",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.some(o => origin.endsWith('.onrender.com'))) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}))

passport.use(new GoogleStrategy({
    clientID: config.CLIENT_ID,
    clientSecret: config.CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "https://snitch-b1zz.onrender.com/api/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        const fullname = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim() || "Google User";
        const googleId = profile.id;

        if (!email) {
            return done(new Error("No email associated with Google account"), null);
        }

        // Check if user already exists by googleId or email
        let user = await userModel.findOne({
            $or: [
                { googleId: googleId },
                { email: email }
            ]
        });

        if (user) {
            // Link googleId if missing
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
            return done(null, user);
        }

        // Create new user in MongoDB
        user = await userModel.create({
            fullname,
            email,
            googleId,
            role: "buyer"
        });

        return done(null, user);
    } catch (err) {
        console.error("Google Auth Strategy Error:", err);
        return done(err, null);
    }
}));

app.use(passport.initialize());

app.use(cookieParser())

app.get("/", async (req,res) => {
    res.send("Hello World")
})

app.use("/api/auth", authRouter)
app.use("/api/products", productRouter)
app.use("/api/cart", cartRouter)
app.use("/api/address", addressRouter)



export default app