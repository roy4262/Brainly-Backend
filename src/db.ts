
import mongoose, { model, Schema, Types } from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/second-brain";

mongoose.connect(MONGODB_URI).then(() => {
    console.log("Connected to MongoDB successfully");
}).catch((error) => {
    console.error("MongoDB connection error:", error);
    process.exit(1);
});

const UserSchema=new Schema({
    username:{type:String,unique:true},
    password:String,
})

const ContentSchema=new Schema({
    title:String,
    link:String,
    tags:[{type:mongoose.Types.ObjectId,ref:'Tag'}],
    type:String,
    userId:{type:mongoose.Types.ObjectId,ref:'User',required:true},
    // authorId:{type:mongoose.Types.ObjectId,ref:'User',required:true}
})

const LinkSchema=new Schema({
    hash:String,
    userId:{type:mongoose.Types.ObjectId,ref:'User',required:true,unique:true}
})

export const LinkModel=model("Link",LinkSchema);

export const UserModel=model("User",UserSchema);

export const ContentModel=model("Content",ContentSchema);

