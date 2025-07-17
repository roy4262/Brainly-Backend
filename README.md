<<<<<<< HEAD
# Brainly-Backend
=======
# Second Brain Backend API

A Node.js/Express backend API for the Second Brain application - a content management system with user authentication and brain sharing capabilities.

## Features

- User authentication (signup/signin) with JWT
- Content management (create, read, delete)
- Brain sharing with shareable links
- MongoDB database with Mongoose ODM
- CORS configuration for frontend integration

## Setup

1. Install dependencies:
```bash
npm install
```

2. Environment Configuration:
   - Copy `.env.example` to `.env`
   - Update the environment variables with your configuration

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-jwt-key` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` or `production` |
| `FRONTEND_URL_1` | Frontend URL for CORS | `http://localhost:5173` |
| `FRONTEND_URL_2` | Alternative frontend URL | `http://127.0.0.1:5173` |

## API Endpoints

### Authentication
- `POST /api/v1/signup` - User registration
- `POST /api/v1/signin` - User login

### Content Management
- `POST /api/v1/content` - Create new content
- `GET /api/v1/content` - Get user's content
- `DELETE /api/v1/content` - Delete content

### Brain Sharing
- `POST /api/v1/brain/share` - Create/remove shareable link
- `GET /api/v1/brain/:shareLink` - Access shared brain

## Database Models

### User
- `username`: String (unique)
- `password`: String

### Content
- `title`: String
- `link`: String
- `tags`: Array of Tag references
- `type`: String
- `userId`: User reference

### Link
- `hash`: String
- `userId`: User reference (unique)

## Security Recommendations

1. **Password Hashing**: Currently passwords are stored in plain text. Consider implementing bcrypt for password hashing.
2. **JWT Secret**: Use a strong, random JWT secret in production.
3. **Environment Variables**: Never commit `.env` files to version control.
4. **HTTPS**: Use HTTPS in production.
5. **Rate Limiting**: Implement rate limiting for API endpoints.

## Project Structure

```
src/
├── db.ts          # Database models and connection
├── index.ts       # Main server file with routes
├── middleware.ts  # Authentication middleware
└── utils.ts       # Utility functions
```
>>>>>>> c1a6ded (pushing backend code)
