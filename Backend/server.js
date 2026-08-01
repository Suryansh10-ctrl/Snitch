import dotenv from "dotenv"
dotenv.config()

import dns from "dns"
dns.setServers(["8.8.8.8"]);

import app from "./src/app.js";
import { connectDB } from "./src/config/database.js";


connectDB();

app.listen(3000, ()=>{
    console.log("server is running at port 3000")
})