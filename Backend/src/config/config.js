import dotenv from "dotenv"
dotenv.config()

if(!process.env.MONGO_URI){
    throw new Error("MONGO_URI must be defined")
}

if(!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET must be defined")
}

if(!process.env.CLIENT_ID){
    throw new Error("CLIENT_ID must be defined")
}

if(!process.env.CLIENT_SECRET){
    throw new Error("CLIENT_SECRET must be defined")
}

if(!process.env.IMAGEKIT_PRIVATE_KEY){
    throw new Error("IMAGEKIT_PRIVATE_KEY must be defined")

}

if(!process.env.RAZORPAY_KEY_ID){
    throw new Error("RAZORPAY_KEY_ID must be defined")
}

if(!process.env.RAZORPAY_KEY_SECRET){
    throw new Error("RAZORPAY_KEY_SECRET must be defined")
}

export const config = {
    MONGO_URI: process.env.MONGO_URI,
    JWT_SECRET: process.env.JWT_SECRET,
    CLIENT_ID: process.env.CLIENT_ID,
    CLIENT_SECRET: process.env.CLIENT_SECRET,
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
    node_env: process.env.NODE_ENV,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,

}