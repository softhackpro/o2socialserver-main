import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true
    },
    profilePicture: {
        type: String,
        default: ''
    },
    occupation: {
        type: String,
        default: 'Shoes Seller'
    },
    website: {
        type: String,
        default: 'www.shoeseller.com'
    },
    adderess: {
        type: String,
        default: 'New York, USA'
    },
    role: {
        type: String,
        default: 'Member'
    },
    smallvideo: {
        type: String,
        default: 'https://cdn.pixabay.com/video/2024/09/24/233024_large.mp4'
    },
    phone: {
        type: String,
        default: '9955099966'
    },
    lattitude: {
        type: String,
    },
    longitude: {
        type: String,
    }

}, { timestamps: true });


export const User = mongoose.model('User', UserSchema);
