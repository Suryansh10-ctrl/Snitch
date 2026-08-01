import mongoose from "mongoose";
import bcrypt from "bcryptjs";



const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: function(){
            return !this.googleId;
        }
    },
    contact: {
        type: Number,
        required: false,
    },
    role: {
        type: String,
        enum: ["buyer", "seller"],
        default: "buyer",
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    googleId: {
        type: String,
        required: false,
    }

})

userSchema.pre("save", async function(){
    if(!this.isModified("password") || !this.password) return

    const hash = await bcrypt.hash(this.password, 10)
    this.password = hash
})

userSchema.methods.comparePassword = async function(password){
    return await bcrypt.compare(password, this.password)
}


const userModel = mongoose.model("user", userSchema)

export default userModel;