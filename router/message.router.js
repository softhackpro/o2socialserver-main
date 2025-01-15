
import { Router } from "express";
import { getMessages, sendMessage } from "../controlers/sendMessage.controllers.js";
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";

export const messageRouter = new Router();

messageRouter.get('/get', verifyLogin, getMessages)
messageRouter.post('/send', verifyLogin, sendMessage)