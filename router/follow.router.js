import { Router } from "express";
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";
import { incrementFollowers, incrementFollowing } from "../controlers/follow.controllers.js";

export const followRouter= new Router();

followRouter.get('/getfollower', (req, res) => { res.json({message: 'hello world!'}); });

followRouter.put('/incrementFollowers',verifyLogin ,incrementFollowers);
followRouter.put('/incrementFollowing',verifyLogin ,incrementFollowing);