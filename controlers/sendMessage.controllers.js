import mongoose from "mongoose";
import { Conversations } from "../models/conversations.models.js";
import { Message } from "../models/message.models.js";
import { User } from "../models/user.models.js";
import { getUserSocketId, io } from "../socket.js";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const receiverId = req.query?.id;
    const senderId = req.user._id;

    if (!message || !receiverId || !senderId) {
      return res.status(400).json({
        message: "Missing required parameters: message, receiverId, senderId",
      });
    }

    let conversations = await Conversations.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversations) {
      conversations = await Conversations.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      message,
    });

    conversations.messages.push(newMessage._id);

    await conversations.save();
    console.log("io : ", io);

    io.emit('newMessage', {
      id: newMessage._id,
      senderId,
      receiverId,
      message,
      seen: false,
      isOwn: false,
      createdAt: newMessage.createdAt,
    });

    return res.status(200).json({
      message: "Message sent successfully",
      chat: {
        id: newMessage._id,
        senderId,
        receiverId,
        message,
        seen: false,
        isOwn: true,
        createdAt: newMessage.createdAt,
      }
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
    const userId = new mongoose.Types.ObjectId(req.query?.id);
    const senderId = new mongoose.Types.ObjectId(req.user._id);

    const conversations = await Conversations.aggregate([
      {
        $match: {
          participants: { $all: [senderId, userId] },
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "messages",
          foreignField: "_id",
          as: "messages",
        },
      },
      {
        $unwind: "$messages",
      },
      {
        $group: {
          _id: "$_id",
          messages: {
            $push: {
              _id: "$messages._id",
              senderId: "$messages.senderId",
              receiverId: "$messages.receiverId",
              isOwn: { $cond: { if: { $eq: ["$messages.senderId", senderId] }, then: true, else: false } },
              message: "$messages.message",
              createdAt: "$messages.createdAt",
              updatedAt: "$messages.updatedAt",
              seen: "$messages.seen",
            },
          },
        },
      },
      {
        $sort: { "messages.createdAt": -1 },
      },
    ]);

    if (!conversations || conversations.length === 0) {
      return res.status(404).json({
        message: "No conversations found",
      });
    }

    console.log(senderId);
    console.log(conversations);

    return res.status(200).json(conversations[0]);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: error.message,
      message: "Internal server error",
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.user._id; // Get the current user's ID

    // Aggregate all conversations where the user is a participant
    const conversations = await Conversations.aggregate([
      // Step 1: Match conversations where the user is a participant
      {
        $match: {
          participants: userId, // Ensures the user's ID is present in the participants array
        },
      },
      // Step 2: Lookup participant details from the 'users' collection
      {
        $lookup: {
          from: "users", // The collection containing user details
          localField: "participants", // Field in 'Conversations' collection
          foreignField: "_id", // Field in 'users' collection
          as: "participantDetails", // Merged participant details
        },
      },
      // Step 3: Filter and project only necessary user details (exclude current user)
      {
        $project: {
          _id: 0, // Exclude conversation ID from the response
          participants: {
            $filter: {
              input: "$participantDetails", // Filter participant details
              as: "participant", // Alias for each element
              cond: { $ne: ["$$participant._id", userId] }, // Exclude the current user
            },
          },
        },
      },
      // Step 4: Flatten the participant details array
      {
        $unwind: "$participants", // Flatten the array to return individual user objects
      },
      // Step 5: Project only required fields
      {
        $project: {
          _id: "$participants._id",
          fullName: "$participants.fullName",
          email: "$participants.email",
          profilePicture: "$participants.profilePicture",
        },
      },
    ]);

    // Respond with the formatted list of user objects
    return res.status(200).json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return res.status(500).json({
      error: error.message,
      message: "Internal server error",
    });
  }
};



export const info = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        _id: user._id,
        profilePicture: user.profilePicture,
        fullName: user.fullName,
      }
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}