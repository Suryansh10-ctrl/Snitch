import dotenv from "dotenv"
dotenv.config()

import dns from "dns"
dns.setServers(["8.8.8.8"]);

import app from "./src/app.js";
import { connectDB } from "./src/config/database.js";


connectDB();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});