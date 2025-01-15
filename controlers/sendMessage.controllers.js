import { Conversations } from "../models/conversations.models.js";
import { Message } from "../models/message.models.js";
import { getUserSocketId } from "../socket/socket.js";
import { io } from "../socket/socket.js";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const receiverId = req.query?.id;
    const senderId = req.user._id;
    let conversations = await Conversations.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversations) {
      conversations = await Conversations.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    });

    conversations.messages.push(newMessage._id);

    await Promise.all([conversations.save(), newMessage.save()]);

    const socketId = getUserSocketId(receiverId)
    if (socketId) {
      io.to(socketId).emit('newMessage', newMessage)
    }
    return res.status(200).json({
      message: "message sent successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: error.message,
      message: "internal server error ",
    });
  }
};


export const getMessages = async (req, res) => {

  try {
    const userId = req.query?.id;
    const senderId = req.user._id;

    const conversations = await Conversations.findOne({
      participants: {
        $all: [senderId, userId]
      }
    }).populate("messages");

    return res.status(200).json(conversations);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: error.message,
      message: "internal server error",
    });
  }
};