
import jwt from 'jsonwebtoken'
import { User } from '../models/user.models.js';

export const verifyLogin = async (req, res, next) => {

    try {
        const token = await req.cookies?.token || req.headers?.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: "unauthorized request" })
        }
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        if (!decodedToken) {
            return res.status(401).json({ message: 'Invalid token' });
        }

        const user = await User.findById(decodedToken._id).select(" -password")
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        req.user = user

        next()
    } catch (error) {
        console.log(error);

        return res.status(500).json({
            error: error.message,
            message: 'Server error from verify',
        })
    }

}