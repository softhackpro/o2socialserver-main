import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { app, server } from "./socket.js";
import { connectDb } from "./db/index.js";

// Initialize environment variables
dotenv.config();
const port = process.env.PORT || 8000;
const frontendurl = process.env.FRONTEND_URL;

// Initialize Express app

// Middleware
app.use(cors({ origin: frontendurl, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Example route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Import routers
import authRouter from "./router/auth.router.js";
import messageRouter from "./router/message.router.js";
import { userRoute } from "./router/user.router.js";
import postRouter from "./router/post.router.js";
import { followRouter } from "./router/follow.router.js";

// Setup routes
app.use("/auth", authRouter);
app.use("/message", messageRouter);
app.use("/user", userRoute);
app.use("/post", postRouter);
app.use("/follow", followRouter);

// Start server and connect to DB
server.listen(port, () => {
  connectDb(); // Connect to the database
  console.log(`Server is running on http://localhost:${port}`);
});
