import cloudinary from "../config/cloudinaryConfig.js";
import { Likes } from "../models/like.models.js";
import { Post } from "../models/post.models.js";
import { City } from "../models/city.js";
import { User } from "../models/user.models.js";
import { Gallery } from "../models/gallery.models.js";
import { Settings } from "../models/settings.js";
import fs from 'fs'
import jwt from 'jsonwebtoken'
import { Comment } from "../models/comments.models.js";
import mongoose from "mongoose";
import { request } from "http";
import { SavedPost } from "../models/savedpost.model.js";
import { post } from "./auth.controllers.js";

// Add Post
export const addPost = async (req, res) => {
    try {
        const { title, description, file, caption, price, category, location } = req.body;
        const post = new Post({
            title,
            description,
            file,
            caption,
            price,
            category,
            location,
            userId: req.user._id,
        });

        await post.save();
        return res.status(201).json({
            message: "Post created successfully",
            post,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

export const getsearchresult = async (req, res) => {
    try {
        // Fetch 12 random posts from the SavedPost collection
        const randomPosts = await Post.aggregate([
            { $sample: { size: 12 } } // Get 12 random documents
        ]);

        res.status(200).json(randomPosts); // Send the random posts as a JSON response
    } catch (error) {
        console.error("Error fetching random posts:", error);
        res.status(500).json({ message: "An error occurred while fetching posts." });
    }
};

export const fetchheader = async (req, res) => {
    try {
        const value = await Gallery.find({Type: 'add pages'}).select('_id Title');
        const settin = await Settings.findOne()
        const data ={value, settin}
        res.status(200).json(data);
    } catch (error) {
        console.error("Error fetching", error);
        res.status(500).json({ message: "An error occurred while fetching pages." });
    }
};

export const fetchfaq = async (req, res) => {
    try {
        const value = await Gallery.find({Type: 'add blogs'}).select('_id Title About createdAt');
        res.status(200).json(value);
    } catch (error) {
        console.error("Error fetching", error);
        res.status(500).json({ message: "An error occurred while fetching pages." });
    }
};

export const fetchpagenow = async (req, res) => {
    const { id: title } = req.params; // Destructure 'id' from req.params
    try {
        const value = await Gallery.findOne({ Type: 'add pages', Title: title });
        if (!value) {
            return res.status(404).json({ message: "Page not found" }); // Handle case where no match is found
        }
        res.status(200).json(value);
    } catch (error) {
        console.error("Error fetching page:", error);
        res.status(500).json({ message: "An error occurred while fetching the page." });
    }
};


// Update Post
export const updatePost = async (req, res) => {
    try {
        const { id } = req.query;
        const { data } = req.body;


        const post = await Post.findByIdAndUpdate(id, {
            ...data
        }, { new: true });

        if (!post) {
            return res.status(404).json({
                message: "Post not found",
            });
        }

        return res.status(200).json({
            message: "Post updated successfully",
            post,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

// Delete Post
export const deletePost = async (req, res) => {
    try {
        const { id } = req.query;

        const post = await Post.findByIdAndDelete(id);

        if (!post) {
            return res.status(404).json({
                message: "Post not found",
            });
        }

        return res.status(200).json({
            message: "Post deleted successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

export const getPosts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 3;
        const excludeIds = req.query.excludeIds ? req.query.excludeIds.split(',').map(id => new mongoose.Types.ObjectId(id)) : [];

        const posts = await Post.aggregate([
            {
                $match: {
                    _id: { $nin: excludeIds },
                }
            },
            {
                $sample: { size: limit }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $project: {
                    "user.password": 0,
                    "user.email": 0,
                    "user.createdAt": 0,
                    "user.updatedAt": 0,
                    "user.backgroundCover": 0, 
                },
            }
        ]);

        return res.status(200).json({
            message: "Posts fetched successfully",
            posts,
        });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
};



export const uploadFile = async (req, res) => {
    try {

        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'o2office',
            resource_type: "auto",
            transformation: [
                { width: 500, crop: "scale" },
                { quality: 'auto' },
                { fetch_format: "auto" }
            ]
        });

        fs.unlinkSync(req.file.path);

        return res.status(200).json({
            message: "File uploaded and compressed successfully",
            file: {
                url: result.secure_url,
                fileType: result.format,
                publicId: result.public_id,
            },
        });
    } catch (error) {
        console.error(error);
        if (req.file?.path) {
            fs.unlinkSync(req.file.path);
        }
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
};


export const likePost = async (req, res) => {
    try {
        const { postId } = req.query;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const like = await Likes.findOneAndDelete({ userId, postId });
        if (like) {
            post.likes = Math.max(post.likes - 1, 0);
        } else {
            await Likes.create({ userId, postId });
            post.likes += 1;
        }

        await post.save();

        return res.status(200).json({
            message: like ? "Post unliked successfully" : "Post liked successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
};


// Dislike a post
export const dislikePost = async (req, res) => {
    try {
        const { postId } = req.body;
        const userId = req.user._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post not found",
            });
        }

        const existingLike = await Likes.findOne({ userId, postId });
        if (!existingLike) {
            return res.status(400).json({
                message: "You have not liked this post",
            });
        }

        await Likes.findByIdAndDelete(existingLike._id);
        post.likes -= 1;
        await post.save();

        return res.status(200).json({
            message: "Post disliked successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}
// get profile

export const getprofile = async (req, res) => {
    try {
        const { id } = req.params;

        const profile = await User.findById(id).select('-password'); // Exclude the password field
        const sellerposts = await Post.find({ userId: id })

        if (!profile) {
            return res.status(404).json({ message: "User not found" });
        }


        res.status(200).json({ profile, sellerposts }); // Return the profile data
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred", error: error.message });
    }
};

export const getcitylist = async (req, res) => {
    try {

        const value = await City.find();

        if (!value) {
            return res.status(404).json({ message: "city not found" });
        }


        res.status(200).json({ value });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred", error: error.message });
    }
};

export const getcategory = async (req, res) => {
    try {

        const value = await Gallery.find({Type: 'category'});

        if (!value) {
            return res.status(404).json({ message: "category not found" });
        }


        res.status(200).json({ value });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "An error occurred", error: error.message });
    }
};

// Get likes for a post
export const getLikes = async (req, res) => {
    try {
        const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

        let userId = null;
        let decodedToken = null;
        if (token) {
            try {
                decodedToken = jwt.verify(token, process.env.JWT_SECRET);
                userId = decodedToken?._id;
            } catch (error) {
                // console.error("Token verification failed:", error);
            }
        }

        const { postId } = req.query;

        // Find the post by ID
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({
                message: "Post not found",
            });
        }

        // Get the count of likes for the post
        const likesCount = await Likes.countDocuments({ postId });

        // If the user is authenticated, check if they have liked the post
        let isCurrUserLiked = false;

        if (userId) {
            isCurrUserLiked = await Likes.exists({ postId, userId });
        }

        return res.status(200).json({
            message: "Likes retrieved successfully",
            likesCount,
            isCurrUserLiked: !!isCurrUserLiked,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}



// comments 
export const addComment = async (req, res) => {
    try {
        const { text, postId } = req.body;
        const userId = req.user?._id;

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        const user = await User.findById(req.user?._id)
        if (!user) {
            return res.status(401).json({ message: "User not authenticated" });
        }
        const newComment = await Comment.create({
            text,
            userId,
            postId,
        })

        return res.status(201).json({
            message: "Comment added successfully",
            comment: {
                _id: newComment._id,
                text: newComment.text,
                createdAt: newComment.createdAt,
                user: {
                    _id: user._id,
                    fullName: user.fullName,
                    profilePicture: user.profilePicture,
                },
            },
        });
    } catch (error) {
        // console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.query;
        const userId = req.user?._id;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return res.status(404).json({ message: "Comment not found" });
        }

        if (comment.userId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "You are not authorized to delete this comment" });
        }

        await Comment.findByIdAndDelete(commentId);

        return res.status(200).json({
            message: "Comment deleted successfully",
        });
    } catch (error) {
        // console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

export const getComments = async (req, res) => {
    try {
        const { postId } = req.query;

        const comments = await Comment.aggregate([
            { $match: { postId: new mongoose.Types.ObjectId(postId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            { $sort: { updatedAt: -1 } },
            {
                $project: {
                    text: 1,
                    updatedAt: 1,
                    'user.fullName': 1,
                    'user.profilePicture': 1,
                }
            }
        ]);

        return res.status(200).json({
            message: "Comments fetched successfully",
            comments,
        });
    } catch (error) {
        // console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}


export const savePost = async (req, res) => {
    try {
        const postId = req.query?.postId
        const userId = req.user._id;

        if (!postId || !userId) {
            return res.status(400).json({ message: "Invalid request" });
        }

        const alreadyexist = await SavedPost.findOneAndDelete({ postId: postId, userId: userId })
        if (alreadyexist) {
            return res.status(200).json({ message: "Post already saved" });
        }
        const newPost = await SavedPost.create({
            userId,
            postId,
        })

        return res.status(201).json({
            message: "Post saved successfully",
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        });
    }
}

export const removeFromSaved = async (req, res) => {
    try {
        const savePostId = req.query?.id

        if (!savePostId) {
            return res.status(400).json({
                message: "Invalid request"
            })
        }

        const deletepost = await SavedPost.findByIdAndDelete(savePostId)

        if (!deletepost) {
            return res.status(404).json({
                message: "Post not found"
            })
        }

        return res.status(200).json({
            message: "delete Post successfully"
        })

    } catch (error) {
        return res.status(500).json({
            error: error.message,
            message: "Internal server error",
        })
    }
}

export const getSavedPost = async (req, res) => {
    try {
        const userId = req.user._id;

        const savePost = await SavedPost.aggregate([
            { $match: { userId: new mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: 'posts',
                    localField: 'postId',
                    foreignField: '_id',
                    as: 'post'
                }
            },
            { $unwind: '$post' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'post.userId',
                    foreignField: '_id',
                    as: 'post.user'
                }
            },
            { $unwind: '$post.user' },
            {
                $project: {
                    _id: 0,
                    postId: 1,
                    title: '$post.title',
                    description: '$post.description',
                    price: '$post.price',
                    createdAt: '$post.createdAt',
                    updatedAt: '$post.updatedAt',
                    userId: '$post.userId',
                    user: {
                        _id: '$post.user._id',
                        fullName: '$post.user.fullName',
                        profilePicture: '$post.user.profilePicture',
                    }
                }
            }
        ]);

        if (!savePost.length) {
            return res.status(404).json({
                message: "No saved post found"
            });
        }

        return res.status(200).json({
            message: "Saved posts fetched successfully",
            savedPosts: savePost
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error",
            error: error.message || 'Something went wrong'
        });
    }
}

export const getReelsById = async (req, res) => {
    try {
        const id = req.query?.id;
        if (!id) {
            return res.status(400).json({
                message: "Invalid id provided"
            })
        }

        const post = await Post.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(id),
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                }
            },
            {
                $unwind: '$user'
            },
            {
                $project: {
                    _id: 1,
                    userId: 1,
                    title: 1,
                    description: 1,
                    price: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    user: {
                        _id: '$user._id',
                        fullName: '$user.fullName',
                        profilePicture: '$user.profilePicture',
                    },
                    file: 1
                }
            }
        ]);

        if (!post || post.length === 0) {
            return res.status(404).json({
                message: "Reels not found",
            });
        }

        return res.status(200).json({
            message: "Reels fetched successfully",
            post: post[0],
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({
            error: error.message || 'Something went wrong',
            message: "Something went wrong"
        });
    }
}