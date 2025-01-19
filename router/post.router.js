import { Router } from "express";
import {getcategory, getcitylist, fetchfaq, fetchpagenow, fetchheader, getsearchresult, addPost, deletePost, getPosts, updatePost, uploadFile, likePost, dislikePost, getLikes, getprofile, addComment, deleteComment, getComments, savePost, removeFromSaved, getSavedPost, getReelsById } from "../controlers/post.controllers.js";
// import { getsearchresult, addPost, deletePost, getPosts, updatePost, uploadFile, likePost, dislikePost, getLikes, getprofile, addComment, deleteComment, getComments, savePost, removeFromSaved, getSavedPost, getReelsById } from "../controlers/post.controllers.js";
import { verifyLogin } from "../middleware/verifyLogin.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.post('/add', verifyLogin, addPost);
router.put('/update', verifyLogin, updatePost);
router.delete('/delete', verifyLogin, deletePost);
router.get('/get', getPosts);
router.get('/getcitylist', getcitylist);
router.get('/getcategory', getcategory);
router.get('/getbyid', getReelsById);

router.post('/upload', verifyLogin, upload.single('file'), uploadFile);

router.post('/like', verifyLogin, likePost);
router.post('/dislike', verifyLogin, dislikePost);
router.get('/getLikes', getLikes);
router.post('/getprofile/:id', getprofile);


// comments 
router.post('/addcomment', verifyLogin, addComment)
router.delete('/deletecomment', verifyLogin, deleteComment)
router.get('/getcomment', getComments)

// saved post

router.post('/addSaved', verifyLogin, savePost)
router.delete('/deletesaved', verifyLogin, removeFromSaved)
router.get('/getSaved', verifyLogin, getSavedPost);

router.get('/getsearchresult', getsearchresult);
router.get('/fetchheader', fetchheader);
router.get('/fetchfaq', fetchfaq);
router.get('/fetchpagenow/:id', fetchpagenow);
export default router;