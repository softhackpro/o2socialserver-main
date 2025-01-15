import { Router } from "express";
import { verifyLogin } from "../middleware/verifyLogin.middleware";

export const followRouter= new Router();

followRouter.get('/getfollower', (req, res) => { res.json({message: 'hello world!'}); });

followRouter.put('/incrementFollowers',verifyLogin ,incrementFollowers);
followRouter.put('/incrementFollowing',verifyLogin ,incrementFollowing);