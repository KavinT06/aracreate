const messageService = require('../services/messageService');

const getRoomMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const messages = await messageService.getRoomMessages(roomId);
    res.status(200).json({ success: true, data: messages, count: messages.length });
  } catch (err) {
    next(err);
  }
};

module.exports = { getRoomMessages };