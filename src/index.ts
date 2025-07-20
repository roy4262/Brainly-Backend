import express, { Request, Response } from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import "./db"; // Import to establish database connection
import { ContentModel, LinkModel, UserModel } from "./db";
import { userMiddleware, AuthenticatedRequest } from "./middleware";
import { randomString } from "./utils";
import { uploadFile, handleFileUpload, getFile, deleteFile } from "./fileUpload";
import dotenv from "dotenv";
import cors from "cors";

// Load environment variables
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default-secret-key";
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

// ✅ Configure CORS for production and development
const allowedOrigins = [
  process.env.FRONTEND_URL_PROD,    // Production Netlify URL
  process.env.FRONTEND_URL_1,       // Additional frontend URL
  process.env.FRONTEND_URL_2,       // Additional frontend URL
  'https://brainly-second-brain.netlify.app',  // Hardcoded Netlify URL
  'http://localhost:5173',          // Local development
  'http://localhost:5174',          // Local development (alternative port)
  'http://127.0.0.1:5173',         // Local development
  'http://127.0.0.1:5174'          // Local development (alternative port)
].filter(Boolean) as string[];

console.log('🌐 Allowed CORS origins:', allowedOrigins);
console.log('🔧 Environment:', NODE_ENV);

app.use(cors({
  origin: (origin, callback) => {
    console.log('🌐 CORS Request from origin:', origin);
    console.log('🔧 Allowed origins:', allowedOrigins);
    console.log('🔧 Environment:', NODE_ENV);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin allowed:', origin);
      return callback(null, true);
    }
    
    // In development, allow all origins
    if (NODE_ENV === 'development') {
      console.log('🔓 Development mode: allowing origin:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked origin:', origin);
    console.log('❌ Available origins:', allowedOrigins);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200 // For legacy browser support
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
//pk
// ✅ Health check endpoint
app.get("/api/v1/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    supportedContentTypes: ['youtube', 'twitter', 'document', 'link']
  });
});

// ✅ Get supported content types
app.get("/api/v1/content-types", (req: Request, res: Response) => {
  res.json({
    contentTypes: [
      { type: 'youtube', description: 'YouTube videos', requiresLink: true },
      { type: 'twitter', description: 'Twitter/X posts', requiresLink: true },
      { type: 'document', description: 'PDF/DOC files', requiresLink: false },
      { type: 'link', description: 'Website links', requiresLink: true }
    ]
  });
});

// ✅ User Signup
app.post("/api/v1/signup", async (req: Request, res: Response) => {
  const { username, password } = req.body;
  try {
    await UserModel.create({ username, password });
    res.json({ msg: "User Signed Up Sucessfully" });
  } catch (error) {
    res.status(411).json({ msg: "user already exists" });
  }
});

// ✅ User Signin
app.post("/api/v1/signin", async (req: Request, res: Response) => {
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
app.post("/api/v1/content", userMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('=== CREATE CONTENT REQUEST ===');
    console.log('Request body:', req.body);
    console.log('User ID:', req.userId);
    console.log('Headers:', req.headers);
    
    const { type, title } = req.body;
    let { link } = req.body;
    
    if (!title || !type) {
      console.log('Validation failed: Missing title or type');
      return res.status(400).json({ msg: "Title and type are required" });
    }
    
    // Validate that link is provided for non-document types
    if (type !== 'document' && !link) {
      console.log('Validation failed: Missing link for non-document type');
      return res.status(400).json({ msg: "Link is required for YouTube, Twitter, and Link content types" });
    }
    
    // Validate content type
    const validTypes = ['youtube', 'twitter', 'document', 'link'];
    if (!validTypes.includes(type)) {
      console.log('Validation failed: Invalid content type');
      return res.status(400).json({ msg: "Invalid content type. Must be youtube, twitter, document, or link" });
    }
    
    // Additional validation for specific content types
    if (type === 'youtube' && link) {
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!youtubeRegex.test(link)) {
        console.log('Validation failed: Invalid YouTube URL');
        return res.status(400).json({ msg: "Please provide a valid YouTube URL" });
      }
    }
    
    if (type === 'twitter' && link) {
      const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/.+/;
      if (!twitterRegex.test(link)) {
        console.log('Validation failed: Invalid Twitter URL');
        return res.status(400).json({ msg: "Please provide a valid Twitter/X URL" });
      }
    }
    
    // No validation for general links - accept any input
    if (type === 'link' && link) {
      // Ensure the link has a protocol for better compatibility
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'https://' + link;
        console.log('Added https:// prefix to link:', link);
      }
    }
    
    console.log('Creating content with:', { title, link, type, userId: req.userId });
    
    const newContent = await ContentModel.create({
      title,
      link,
      type,
      userId: new mongoose.Types.ObjectId(req.userId),
      tags: []
    });
    
    console.log('Content created successfully:', newContent);
    res.json({ msg: "Content Created Successfully", content: newContent });
  } catch (error: any) {
    console.error('Content creation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ msg: "Content Creation failed", error: error.message });
  }
});

// ✅ Get Content
app.get("/api/v1/content", userMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('=== GET CONTENT REQUEST ===');
    console.log('User ID:', req.userId);
    
    const userId = req.userId;
    const content = await ContentModel.find({ userId }).populate("userId", "username").sort({ createdAt: -1 });
    
    console.log(`Found ${content.length} content items for user ${userId}`);
    res.json({ content });
  } catch (error: any) {
    console.error('Get content error:', error);
    res.status(500).json({ msg: "Failed to fetch content", error: error.message });
  }
});

// ✅ Delete Content
app.delete("/api/v1/content", userMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('Delete request body:', req.body);
    console.log('User ID:', req.userId);
    
    const contentId = req.body.contentId;
    
    if (!contentId) {
      return res.status(400).json({ msg: "Content ID is required" });
    }
    
    // Find the content first to check ownership and get filename for file deletion
    const content = await ContentModel.findOne({ 
      _id: contentId, 
      userId: req.userId 
    });
    
    if (!content) {
      return res.status(404).json({ msg: "Content not found or unauthorized" });
    }
    
    // If it's a document type, delete the file from GridFS
    if (content.type === 'document' && content.filename) {
      try {
        const filename = content.filename as string;
        console.log(`Attempting to delete file: ${filename}`);
        await deleteFile(filename);
        console.log(`File ${filename} deleted from GridFS successfully`);
      } catch (fileError: any) {
        console.error('Error deleting file from GridFS:', fileError);
        console.error('File deletion error details:', fileError.message);
        // Continue with content deletion even if file deletion fails
        // This ensures the content record is removed even if the file is already gone
      }
    }
    
    // Delete the content from database
    await ContentModel.deleteOne({ 
      _id: contentId, 
      userId: req.userId 
    });
    
    console.log('Content deleted successfully:', contentId);
    res.json({ msg: "content deleted successfully" });
    
  } catch (error: any) {
    console.error('Delete content error:', error);
    res.status(500).json({ msg: "Failed to delete content", error: error.message });
  }
});

// ✅ File Upload
app.post("/api/v1/upload", userMiddleware, uploadFile, handleFileUpload);

// ✅ File Download
app.get("/api/v1/file/:filename", getFile);

// ✅ Brain Share
app.post("/api/v1/brain/share", userMiddleware, async (req: AuthenticatedRequest, res: Response) => {
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
app.get("/api/v1/brain/:shareLink", async (req: Request, res: Response) => {
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
// ✅ Share Brain - Generate shareable link
app.post("/api/v1/brain/share", userMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('=== SHARE BRAIN REQUEST ===');
    console.log('User ID:', req.userId);
    
    const { share } = req.body;
    
    if (share) {
      // Generate a unique hash for this user's brain
      const hash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      
      // Update user with the share hash
      await UserModel.findByIdAndUpdate(req.userId, { shareHash: hash });
      
      console.log('Brain shared successfully with hash:', hash);
      res.json({ hash });
    } else {
      // Remove sharing
      await UserModel.findByIdAndUpdate(req.userId, { shareHash: null });
      res.json({ msg: "Brain sharing disabled" });
    }
  } catch (error: any) {
    console.error('Share brain error:', error);
    res.status(500).json({ msg: "Failed to share brain", error: error.message });
  }
});

// ✅ View Shared Brain - Public endpoint
app.get("/api/v1/brain/:shareHash", async (req: Request, res: Response) => {
  try {
    console.log('=== VIEW SHARED BRAIN REQUEST ===');
    console.log('Share hash:', req.params.shareHash);
    
    const { shareHash } = req.params;
    
    // Find user by share hash
    const user = await UserModel.findOne({ shareHash });
    if (!user) {
      return res.status(404).json({ msg: "Shared brain not found" });
    }
    
    // Get user's content
    const content = await ContentModel.find({ userId: user._id }).sort({ createdAt: -1 });
    
    console.log(`Found ${content.length} content items for shared brain`);
    res.json({ 
      content,
      owner: user.username,
      sharedAt: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('View shared brain error:', error);
    res.status(500).json({ msg: "Failed to load shared brain", error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`CORS Origins:`, allowedOrigins);
}).on('error', (err: any) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
