import Express from "express";
import jwt from "jsonwebtoken";
import { ContentModel, LinkModel, UserModel } from "./db";
import { userMiddleware } from "./middleware";
import { randomString } from "./utils";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const cors = require('cors');
const app = Express();

// ✅ Only allow your deployed frontend
const allowedOrigins = [
  process.env.FRONTEND_URL_1,
];

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle preflight requests
app.options('*', cors());

app.use(Express.json());

// ✅ Health check endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV
  });
});

// ✅ User Signup
app.post("/api/v1/signup", async (req, res) => {
  const { username, password } = req.body;
  try {
    await UserModel.create({ username, password });
    res.json({ msg: "User Signed Up Sucessfully" });
  } catch (error) {
    res.status(411).json({ msg: "user already exists" });
  }
});

// ✅ User Signin
app.post("/api/v1/signin", async (req, res) => {
  try {
    const { username, password } = req.body;
    const existingUser = await UserModel.findOne({ username, password });

    if (existingUser) {
      const token = jwt.sign({ id: existingUser._id }, JWT_SECRET);
      res.json({ token });
    } else {
      res.status(403).json({ msg: "Invalid credentials" });
    }
  } catch (error) {
    res.status(403).json({ msg: "signin failed" });
  }
});

// ✅ Create Content
app.post("/api/v1/content", userMiddleware, async (req, res) => {
  try {
    const { type, link } = req.body;
    const newContent = await ContentModel.create({
      title: req.body.title,
      link,
      type,
   
      userId: req.userId,
      tags: []
    });
    res.json({ msg: "Content Created Successfully", content: newContent });
  } catch (error) {
    res.status(500).json({ msg: "Content Creation failed" });
  }
});

// ✅ Get Content
app.get("/api/v1/content", userMiddleware, async (req, res) => {
  try {
  
    const userId = req.userId;
    const content = await ContentModel.find({ userId }).populate("userId", "username");
    res.json({ content });
  } catch (error) {
    res.status(500).json({ msg: "Failed to fetch content" });
  }
});

// ✅ Delete Content
app.delete("/api/v1/content", userMiddleware, async (req, res) => {
  const contentId = req.body.contentId;
  await ContentModel.deleteMany({
    _id: contentId,
    
    userId: req.userId
  });
  res.json({ msg: "content deleted successfully" });
});

// ✅ Brain Share
app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
  const share = req.body.share;
  if (share) {
    const existLink = await LinkModel.findOne({
 
      userId: req.userId
    });

    if (existLink) {
      return res.json({ hash: existLink.hash });
    }

    const hash = randomString(10);
    await LinkModel.create({

      userId: req.userId,
      hash
    });

    return res.json({ hash });
  } else {
    await LinkModel.deleteOne({
   
      userId: req.userId
    });
    res.json({ msg: "Removed link" });
  }
});

// ✅ Access Shared Brain Link
app.get("/api/v1/brain/:shareLink", async (req, res) => {
  const hash = req.params.shareLink;
  const link = await LinkModel.findOne({ hash });
  if (!link) {
    return res.status(411).json({ msg: "Link not found" });
  }

  const content = await ContentModel.find({ userId: link.userId });
  const user = await UserModel.findOne({ _id: link.userId });

  if (!user) {
    return res.status(411).json({ msg: "user not found" });
  }

  res.json({
    username: user?.username,
    content
  });
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
});
