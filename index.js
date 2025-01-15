import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { connectDb } from "./db/index.js";
import { app, server } from "./socket/socket.js";

dotenv.config();
const port = process.env.PORT || 8000;
const frontendurl = process.env.FRONTEND_URL

const corsOptions = {
  origin: ['https://reeldekho.com', 'https://www.reeldekho.com', 'reeldekho.com'],
  // origin: "http://localhost:5173",
  methods: "GET, POST, PUT, PATCH, DELETE, HEAD",
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
// app.use(
//   cors({
//     origin: ['https://reeldekho.com', 'https://www.reeldekho.com', 'reeldekho.com'] ,
//     credentials: true,
//   })
// );

app.use(cookieParser());
app.use(express.json());
app.get("/", (req, res, next) => {
  console.log(req.params.path);
  next()
});


import authRouter from "./router/auth.router.js";
import { messageRouter } from "./router/message.router.js";
import { userRoute } from "./router/user.router.js";
import postRouter from './router/post.router.js'

app.use("/auth", authRouter);
app.use("/message", messageRouter);
app.use("/user", userRoute);
app.use('/post', postRouter)

server.listen(port, () => {
  connectDb();
  console.log(`Server is running on port http://localhost:${port}`);
});
