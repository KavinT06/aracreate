const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getRoomMessages } = require('../controllers/messageController');

const router = express.Router();

router.use(protect);
router.get('/:roomId', getRoomMessages);

module.exports = router;