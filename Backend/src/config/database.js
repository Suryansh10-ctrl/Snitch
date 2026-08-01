import mongoose from "mongoose";
import { config } from "./config.js";


export const connectDB = async () => {
    try{
        const conn = await mongoose.connect(config.MONGO_URI)
    .then(() => {
        console.log("connected to database");
    })
    }catch(err){
        console.log(err)
    }
}