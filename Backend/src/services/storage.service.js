import ImageKit from "@imagekit/nodejs"
import { config } from "../config/config.js";


let client = null;
try {
    if (config.IMAGEKIT_PRIVATE_KEY) {
        client = new ImageKit({
            privateKey: config.IMAGEKIT_PRIVATE_KEY,
        });
    }
} catch (e) {
    console.warn("ImageKit initialization warning:", e.message);
}

export async function uploadFile({ buffer, fileName, folder = "snitch" }) {
    if (!client) {
        console.warn("ImageKit client not initialized, using placeholder image");
        return { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop" };
    }

    try {
        const fileData = await ImageKit.toFile(buffer);
        const result = await client.files.upload({
            file: fileData,
            fileName: fileName || `product_${Date.now()}.jpg`,
            folder,
        });
        return result;
    } catch (err) {
        console.error("ImageKit Upload Error:", err.message || err);
        return { url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop" };
    }
}