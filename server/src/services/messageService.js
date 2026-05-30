const Message = require('../models/Message');

const createMessage = async ({ room, sender, content }) => {
  return Message.create({ room, sender, content });
};

const getRoomMessages = async (roomId) => {
  const messages = await Message.find({ room: roomId })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', 'username')
    .lean();

  return messages.reverse();
};

module.exports = { createMessage, getRoomMessages };