# SoloGram

![Lighthouse Performance](https://img.shields.io/badge/Performance-75-yellowgreen)
![Accessibility](https://img.shields.io/badge/Accessibility-87-green)
![Best Practices](https://img.shields.io/badge/Best%20Practices-92-brightgreen)
![SEO](https://img.shields.io/badge/SEO-100-brightgreen)
![PWA](https://img.shields.io/badge/PWA-Ready-blue)

SoloGram is a personal Instagram-like platform where only you can post content (images, videos, text) while allowing others to view your posts. It's built with modern web technologies and has a focus on visual appeal and mobile responsiveness.

## 📊 Lighthouse Report

| Category       | Score    |
| -------------- | -------- |
| Performance    | 75       |
| Accessibility  | 87       |
| Best Practices | 92       |
| SEO            | 100      |
| PWA            | ✅ Ready |

## Features

- **Admin-Only Platform**: SoloGram is designed to be a personal platform where only you (the admin) can create and manage content
- **Secure Authentication**: The registration is disabled - only the admin account created via script can log in
- **Rich Media Support**: Upload up to 10 images or videos per post
- **Media Carousel**: Navigate through multiple images in posts
- **Responsive Design**: Looks great on all devices
- **Rich Content**: Create posts with media, captions, content, and tags
- **Search Functionality**: Search through your posts
- **Profile Management**: Edit your profile and bio

## Demo

[Live Demo](Coming soon)

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
   git clone https://github.com/abutler911/sologram.git
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

   # Admin account credentials
   ADMIN_USERNAME=<your-admin-username>
   ADMIN_EMAIL=<your-admin-email>
   ADMIN_PASSWORD=<your-secure-password>
   ```

4. Create your admin account

   ```
   npm run create-admin
   ```

5. Start the backend server
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

## Project Structure

```
sologram/
├── client/                     # Frontend
│   ├── public/                 # Public assets
│   └── src/                    # Source code
│       ├── components/         # React components
│       ├── context/            # React context providers
│       ├── pages/              # Page components
│       └── styles/             # CSS/SCSS files
└── server/                     # Backend
    ├── config/                 # Configuration files
    ├── controllers/            # Route controllers
    ├── middleware/             # Custom middleware
    ├── models/                 # Database models
    └── routes/                 # API routes
```

## Development Workflow

This project follows a standard Git workflow:

- `main` branch contains production-ready code
- `development` branch is the primary branch for development
- Feature branches are created from `development` with the naming convention `feature/feature-name`
- Bug fixes are created with the naming convention `fix/bug-name`

### Contributing

1. Create a new branch from `development`

   ```
   git checkout -b feature/your-feature-name development
   ```

2. Make your changes and commit them

   ```
   git add .
   git commit -m "Description of changes"
   ```

3. Push to GitHub

   ```
   git push -u origin feature/your-feature-name
   ```

4. Create a Pull Request against the `development` branch

## Using Multiple Media Feature

SoloGram supports uploading multiple images and videos per post:

1. When creating a post, drag and drop or select up to 10 files
2. Preview all uploaded files before submitting
3. Remove individual files if needed
4. When viewing a post with multiple media, use the carousel navigation to browse through the files

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

## Roadmap

- [ ] Like/comment functionality for visitors
- [ ] Analytics dashboard
- [ ] Custom themes
- [ ] Collections/albums feature
- [ ] Social sharing options
- [ ] Automated deployment pipeline

## License

This project is licensed under the MIT License.
