const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/reportController');

const router = express.Router();

router.get('/completed', asyncHandler(controller.completed));
router.get('/pending', asyncHandler(controller.pending));
router.get('/summary', asyncHandler(controller.summary));

module.exports = router;
