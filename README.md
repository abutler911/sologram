# SoloGram

SoloGram is a personal Instagram-like platform where only you can post content (images, videos, text) while allowing others to view your posts. It's built with modern web technologies and has a focus on visual appeal and mobile responsiveness.

## Features

- **User Authentication**: Only you can log in and create/edit posts
- **Media Uploads**: Support for image and video uploads
- **Responsive Design**: Looks great on all devices
- **Rich Content**: Create posts with media, captions, content, and tags
- **Search Functionality**: Search through your posts
- **Profile Management**: Edit your profile and bio

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT Authentication
- Cloudinary (for media storage)

### Frontend
- React.js
- React Router
- Styled Components
- Axios
- React Dropzone (for file uploads)
- React Hot Toast (for notifications)

## Setup Instructions

### Prerequisites
- Node.js (v14 or later)
- MongoDB (local instance or MongoDB Atlas)
- Cloudinary account

### Backend Setup

1. Clone the repository
   ```
   git clone <repository-url>
   cd sologram
   ```

2. Install backend dependencies
   ```
   cd server
   npm install
   ```

3. Create a `.env` file in the server directory with the following variables
   ```
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=<your-mongodb-uri>
   JWT_SECRET=<your-jwt-secret>
   CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
   CLOUDINARY_API_KEY=<your-cloudinary-api-key>
   CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
   ```

4. Start the backend server
   ```
   npm run dev
   ```

### Frontend Setup

1. Install frontend dependencies
   ```
   cd ../client
   npm install
   ```

2. Create a `.env` file in the client directory with the following variable (if your backend is not running on the default port)
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

3. Start the frontend development server
   ```
   npm start
   ```

4. Access the application at `http://localhost:3000`

## Deployment

### Backend Deployment
1. Set up environment variables on your hosting platform
2. Deploy the server directory to your preferred hosting service (e.g., Heroku, Render, Digital Ocean)

### Frontend Deployment
1. Build the production version of the frontend
   ```
   cd client
   npm run build
   ```
2. Deploy the built files from the `build` directory to a static hosting service (e.g., Netlify, Vercel, Firebase Hosting)

## Roadmap for Future Development

- Like/comment functionality for visitors
- Analytics dashboard
- Custom themes
- Multiple image uploads per post
- Collections/albums feature
- Social sharing options

## License

This project is licensed under the MIT License.