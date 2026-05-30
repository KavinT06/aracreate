const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { createRoom, getRooms, joinRoom } = require('../controllers/roomController');

const router = express.Router();

router.use(protect);
router.get('/', getRooms);
router.post('/', createRoom);
router.post('/:id/join', joinRoom);

module.exports = router;