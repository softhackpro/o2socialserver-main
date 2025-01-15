
import { Router } from "express";
import { login, Logout, post, profile, profileFile, register, updateProfile } from "../controlers/auth.controllers.js";
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = new Router();

router.post('/register', register)
router.post('/login', login)
router.post('/logout', verifyLogin, Logout)

router.get('/profile', verifyLogin, profile)
router.post('/updateprofile', verifyLogin, upload.single('profilePicture'), profileFile ,updateProfile)
router.get('/post', verifyLogin, post)

export default router; 