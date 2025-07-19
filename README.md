# Second Brain Backend API

A powerful backend service for managing and organizing digital content, built with Node.js, Express, TypeScript, and MongoDB. This API serves as the foundation for a "second brain" application that helps users collect, organize, and share their digital knowledge.

## 🎯 Project Overview

The Second Brain Backend is designed to help users create their personal knowledge management system. It allows users to:

- **Collect Content**: Save links, documents, and various types of digital content
- **Organize Knowledge**: Categorize and tag content for easy retrieval
- **Share Insights**: Create shareable links to share curated content collections
- **Secure Access**: User authentication and authorization for personal data protection

## 🏗️ Architecture

### Core Components

1. **User Management**: Secure user registration, authentication, and session management
2. **Content Management**: CRUD operations for various content types (links, documents, etc.)
3. **Brain Sharing**: Generate and manage shareable links for content collections
4. **Database Layer**: MongoDB integration with Mongoose ODM for data persistence

### Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: CORS configuration, input validation
- **Environment**: dotenv for configuration management

## 📊 Database Schema

### User Model
```typescript
{
  username: String (unique),
  password: String
}
```

### Content Model
```typescript
{
  title: String,
  link: String,
  tags: [ObjectId] (references to Tag model),
  type: String,
  userId: ObjectId (reference to User)
}
```

### Link Model (for sharing)
```typescript
{
  hash: String (unique identifier),
  userId: ObjectId (reference to User, unique)
}
```

## 🚀 API Endpoints

### Health Check
- `GET /api/v1/health` - Service health status

### Authentication
- `POST /api/v1/signup` - User registration
- `POST /api/v1/signin` - User login (returns JWT token)

### Content Management
- `POST /api/v1/content` - Create new content (authenticated)
- `GET /api/v1/content` - Retrieve user's content (authenticated)
- `DELETE /api/v1/content` - Delete specific content (authenticated)

### Brain Sharing
- `POST /api/v1/brain/share` - Create/remove shareable link (authenticated)
- `GET /api/v1/brain/:shareLink` - Access shared content via public link

## 🔧 Setup and Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB instance
- npm or yarn package manager

### Environment Variables
Create a `.env` file in the root directory:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Origins (for frontend integration)
FRONTEND_URL_1=your_frontend_url_1
FRONTEND_URL_2=your_frontend_url_2
FRONTEND_URL_PROD=your_production_frontend_url
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd second-brain-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **For production**
   ```bash
   npm run build
   npm start
   ```

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication system
- Protected routes with middleware validation
- User-specific content access control

### CORS Configuration
- Configurable allowed origins for frontend integration
- Support for credentials and preflight requests
- Development and production environment support

### Data Validation
- Input validation for all endpoints
- Error handling with appropriate HTTP status codes
- Secure password handling (consider adding hashing)

## 🌐 CORS and Frontend Integration

The API is configured to work with multiple frontend deployments:
- Local development servers (localhost:5173, 127.0.0.1:5173)
- Multiple production frontend URLs
- Configurable through environment variables

## 📝 Usage Examples

### User Registration
```bash
curl -X POST http://localhost:3000/api/v1/signup \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "secure_password"}'
```

### User Login
```bash
curl -X POST http://localhost:3000/api/v1/signin \
  -H "Content-Type: application/json" \
  -d '{"username": "john_doe", "password": "secure_password"}'
```

### Create Content (with authentication)
```bash
curl -X POST http://localhost:3000/api/v1/content \
  -H "Content-Type: application/json" \
  -H "Authorization: your_jwt_token" \
  -d '{"title": "Interesting Article", "link": "https://example.com", "type": "article"}'
```

### Share Brain
```bash
curl -X POST http://localhost:3000/api/v1/brain/share \
  -H "Content-Type: application/json" \
  -H "Authorization: your_jwt_token" \
  -d '{"share": true}'
```

## 🔄 Development Workflow

### Code Structure
```
src/
├── index.ts          # Main application entry point
├── db.ts            # Database models and connection
├── middleware.ts    # Authentication middleware
└── utils.ts         # Utility functions
```

### Key Features Implementation

1. **Random String Generation**: Secure hash generation for shareable links
2. **Middleware Authentication**: JWT token validation for protected routes
3. **Database Abstraction**: Mongoose models for clean data operations
4. **Error Handling**: Comprehensive error responses with appropriate status codes

## 🚦 API Response Format

### Success Response
```json
{
  "msg": "Operation successful",
  "data": { /* relevant data */ }
}
```

### Error Response
```json
{
  "msg": "Error description"
}
```

## 🔮 Future Enhancements

- **Password Hashing**: Implement bcrypt for secure password storage
- **Rate Limiting**: Add request rate limiting for API protection
- **Content Search**: Full-text search capabilities for content
- **Tags System**: Complete implementation of content tagging
- **File Upload**: Support for file attachments
- **Analytics**: Usage analytics and insights
- **Backup System**: Automated data backup and recovery

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation
- Review the code examples above

---

**Note**: This is a backend API service. Make sure to implement proper security measures, including password hashing and input validation, before deploying to production.