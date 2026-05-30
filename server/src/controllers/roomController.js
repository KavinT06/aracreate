const roomService = require('../services/roomService');

const createRoom = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'name is required' });
    }

    const room = await roomService.createRoom({ name, description }, req.user._id);
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
};

const getRooms = async (req, res, next) => {
  try {
    const rooms = await roomService.getAllRooms();
    res.status(200).json({ success: true, data: rooms, count: rooms.length });
  } catch (err) {
    next(err);
  }
};

const joinRoom = async (req, res, next) => {
  try {
    const { id } = req.params;
    const room = await roomService.joinRoom(id, req.user._id);
    res.status(200).json({ success: true, data: room });
  } catch (err) {
    next(err);
  }
};

module.exports = { createRoom, getRooms, joinRoom };