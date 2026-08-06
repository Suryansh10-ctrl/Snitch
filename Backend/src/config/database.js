import mongoose from "mongoose";
import dns from "dns";
import { config } from "./config.js";

// Configure DNS result order and public DNS servers globally for Node
try {
    dns.setDefaultResultOrder?.("ipv4first");
    dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {}

export const connectDB = async () => {
    try {
        try {
            dns.setDefaultResultOrder?.("ipv4first");
            dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
        } catch (e) {}
        await mongoose.connect(config.MONGO_URI, {
            serverSelectionTimeoutMS: 15000
        });
        console.log("connected to database");
    } catch (err) {
        console.error("Database Connection Error:", err?.message || err);
    }
};