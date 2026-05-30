const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');

const createRoom = async ({ name, description }, userId) => {
  const trimmedName = name.trim();
  const trimmedDescription = description?.trim() || '';

  const existing = await Room.findOne({ name: trimmedName });
  if (existing) {
    const err = new Error('Room name already exists');
    err.statusCode = 409;
    throw err;
  }

  const room = await Room.create({
    name: trimmedName,
    description: trimmedDescription,
    createdBy: userId,
  });

  await RoomMember.create({ room: room._id, user: userId });

  return room;
};

const getAllRooms = async () => {
  return Room.find().sort({ createdAt: -1 }).populate('createdBy', 'username').lean();
};

const joinRoom = async (roomId, userId) => {
  const room = await Room.findById(roomId);
  if (!room) {
    const err = new Error('Room not found');
    err.statusCode = 404;
    throw err;
  }

  const existing = await RoomMember.findOne({ room: roomId, user: userId });
  if (!existing) {
    await RoomMember.create({ room: roomId, user: userId });
  }

  return room;
};

module.exports = { createRoom, getAllRooms, joinRoom };