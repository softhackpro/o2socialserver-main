import { User } from "../models/user.models.js";

export const getUserForSideBar = async (req, res) => {
    try {
        const allUser = await User.find({
            _id: { $ne: req.user._id }
        }).select("-password")

        if(!allUser){
            res.status(400)
            .json({
                message: 'No user found'
            })
        }

        res.status(200).json({
            users: allUser
        })
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export const getCurrentUser = async (req, res) => {

    try {
        const user = req.user
        if(!user) {
            res.status(401)
           .json({
            message: 'No user logged in'
           })
        }
        res.status(200).json({
            user: user
        })
    } catch (error) {
        res.status(500).json({
            message: error.message
        })
    }
} 