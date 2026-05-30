const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error('Authentication error: token missing'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password').lean();

    if (!user) {
      return next(new Error('Authentication error: user not found'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error: token invalid'));
  }
};

module.exports = socketAuth;