import multer from 'multer';
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { ContentModel } from './db';
import { AuthenticatedRequest } from './middleware';
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Initialize GridFS Bucket
let bucket: mongoose.mongo.GridFSBucket;
const conn = mongoose.connection;

const initializeGridFS = () => {
  if (conn.db) {
    bucket = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    console.log('GridFS initialized');
    return true;
  } else {
    console.error('Database connection not available');
    return false;
  }
};

conn.once('open', () => {
  initializeGridFS();
});

// Helper function to ensure GridFS is initialized
const ensureGridFSInitialized = () => {
  if (!bucket && conn.readyState === 1) {
    return initializeGridFS();
  }
  return !!bucket;
};

// Use memory storage for multer
const storage = multer.memoryStorage();

const upload = multer({ 
  storage,
  fileFilter: (req: any, file: any, cb: any) => {
    // Accept only PDF and DOC files
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC files are allowed!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Upload middleware
export const uploadFile = upload.single('file');

// Handle file upload
export const handleFileUpload = async (req: AuthenticatedRequest, res: Response) => {
  try {
    console.log('=== FILE UPLOAD REQUEST ===');
    console.log('User ID:', req.userId);
    console.log('Request body:', req.body);
    console.log('File info:', req.file ? {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    } : 'No file');
    
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ msg: 'No file uploaded' });
    }

    if (!ensureGridFSInitialized()) {
      console.log('GridFS not initialized');
      return res.status(500).json({ msg: 'GridFS not initialized - database connection issue' });
    }

    const { title } = req.body;
    const filename = `${Date.now()}-${req.file.originalname}`;
    
    console.log('File upload details:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filename: filename,
      title: title,
      userId: req.userId
    });

    // Create upload stream to GridFS
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        originalName: req.file.originalname,
        uploadedBy: req.userId,
        uploadDate: new Date()
      }
    });

    // Handle upload completion
    uploadStream.on('finish', async () => {
      try {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const fileUrl = `${baseUrl}/api/v1/file/${filename}`;

        // Save file metadata to content collection
        const newContent = await ContentModel.create({
          title: title || req.file!.originalname,
          link: fileUrl,
          type: 'document',
          filename: filename,
          userId: req.userId,
          tags: []
        });

        res.status(201).json({
          msg: 'File uploaded successfully',
          content: newContent,
          filename: filename
        });
      } catch (error: any) {
        console.error('Error saving content metadata:', error);
        res.status(500).json({ msg: 'Error saving file metadata: ' + error.message });
      }
    });

    uploadStream.on('error', (error: any) => {
      console.error('GridFS upload error:', error);
      res.status(500).json({ msg: 'Error uploading file: ' + error.message });
    });

    // Write file buffer to GridFS
    uploadStream.end(req.file.buffer);

  } catch (error: any) {
    console.error('Upload error:', error);
    res.status(500).json({ msg: 'Server error during upload: ' + error.message });
  }
};

// File retrieval endpoint
export const getFile = async (req: Request, res: Response) => {
  try {
    console.log('File request received for:', req.params.filename);
    
    if (!ensureGridFSInitialized()) {
      console.log('GridFS not initialized');
      return res.status(500).json({ msg: 'GridFS not initialized - database connection issue' });
    }

    const filename = req.params.filename;
    console.log('Looking for file:', filename);

    // Find file in GridFS
    const files = await bucket.find({ filename }).toArray();
    console.log('Files found:', files.length);
    
    if (!files || files.length === 0) {
      console.log('File not found in GridFS');
      return res.status(404).json({ msg: 'File not found' });
    }

    const file = files[0];
    
    // Determine content type based on file extension
    const originalName = file.metadata?.originalName || file.filename;
    let contentType = 'application/octet-stream'; // default
    
    if (originalName.toLowerCase().endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (originalName.toLowerCase().endsWith('.doc')) {
      contentType = 'application/msword';
    } else if (originalName.toLowerCase().endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }

    // Set appropriate headers for download
    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${originalName}"`,
      'Cache-Control': 'public, max-age=31536000'
    });

    // Create download stream
    const downloadStream = bucket.openDownloadStreamByName(filename);
    
    downloadStream.on('error', (error: any) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ msg: 'Error streaming file' });
      }
    });
    
    downloadStream.pipe(res);
  } catch (error: any) {
    console.error('File retrieval error:', error);
    if (!res.headersSent) {
      res.status(500).json({ msg: 'Error retrieving file: ' + error.message });
    }
  }
};

// Delete file from GridFS
export const deleteFile = async (filename: string) => {
  try {
    if (!ensureGridFSInitialized()) {
      throw new Error('GridFS not initialized - database connection issue');
    }
    
    // Find the file first to get its _id
    const files = await bucket.find({ filename }).toArray();
    if (files.length > 0) {
      await bucket.delete(files[0]._id);
      console.log(`File ${filename} deleted from GridFS`);
    } else {
      console.log(`File ${filename} not found in GridFS`);
    }
  } catch (error) {
    console.error('Error deleting file from GridFS:', error);
    throw error;
  }
};