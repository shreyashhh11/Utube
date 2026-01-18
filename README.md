# 🎥 Utube — Video Streaming Platform Backend

**Utube** is a backend project for a video streaming platform inspired by the **Chai aur Code** YouTube backend mega series taught in Hindi.  
This project implements core backend features for a video hosting platform with modern practices, authentication, video management, analytics, and more.

---

## 🚀 Features

✅ User Authentication (Signup, Login, Logout)  
✅ Video Upload & Management  
✅ Like / Dislike Functionality  
✅ Comments & Replies  
✅ Subscriptions (Follow / Unfollow)  
✅ View Count & Analytics  
✅ Secure Passwords with Bcrypt  
✅ JWT Access & Refresh Token Authentication  
✅ RESTful API Structure with Modular Controllers  
✅ Error Handling and Middleware Support  
🔥 Designed following best backend practices

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js, Express |
| Database | MongoDB |
| Authentication | JWT, Bcrypt |
| Uploads | Multer (file handling) |
| Validation | (MiddleWares) |
| Code Formatting | Prettier |

🧠 *The backend structure and styling are influenced by the “Chai aur Code” backend backend series on YouTube.

---

## 📁 Project Structure

Utube/
├── src/
│ ├── controllers/ # Business logic for routes
│ ├── routes/ # API route definitions
│ ├── middleware/ # Custom middleware (auth, error handlers, etc.)
│ ├── models/ # Database schemas
│ ├── utils/ # Helper utilities
│ ├── app.js # Express app setup
│ └── server.js # Server start entry
├── .env # Environment variables
├── .gitignore
├── package.json
└── README.md


---

## 📦 Getting Started

### 📝 Prerequisites

Make sure you have the following installed:

- Node.js (v14+)
- npm (v6+)
- Database (e.g., MongoDB Atlas or local MongoDB instance)

---

### ⬇️ Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shreyashhh11/Utube.git
Go into the project directory:

cd Utube
Install dependencies:

npm install
🔧 Configuration
Create a .env file in the project root and add your environment variables:

PORT=5000
DATABASE_URL=your_database_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
💡 Replace the values with your own secure keys and database URI.

▶️ Running the Server
Start the development server:

npm start
Server will start on:

http://localhost:5000

🧠 Authentication
This project uses JWT tokens for secure user authentication with:

Access tokens — short lived

Refresh tokens — longer lived

All authenticated routes require a valid token. Tokens are signed and validated using secret keys stored in .env.

🛡 Security Best Practices
Passwords hashed using bcrypt

Token-based access control with JWT

Middleware for protected routes

Centralized error handling

📚 Learning Resources
This project is inspired from the Chai aur Code YouTube backend series, where the instructor builds a full-featured backend step by step and explains concepts in Hindi. 

🙌 Contributing
Contributions are welcome!

Fork the repository

Create a new branch (git checkout -b feature/XYZ)

Commit your changes

Push and open a Pull Request

📄 License
This project is open-source and MIT Licensed.

❤️ Acknowledgements
Chai aur Code — for the backend tutorial series 

Express.js — for simple server setup

Node.js — for backend runtime

Open-Source Community
