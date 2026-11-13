const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const controller = require('../controllers/taskController');
const { validateCreate, validateUpdate } = require('../middleware/validateTask');

const router = express.Router();

// Sabit yollar (/search, /assignee/:name) /:id'den önce tanımlanmalı
router.get('/', asyncHandler(controller.getTasks));
router.get('/search', asyncHandler(controller.searchTasks));
router.get('/assignee/:name', asyncHandler(controller.getTasksByAssignee));
router.get('/:id', asyncHandler(controller.getTaskById));
router.post('/', validateCreate, asyncHandler(controller.createTask));
router.put('/:id', validateUpdate, asyncHandler(controller.updateTask));
router.delete('/:id', asyncHandler(controller.deleteTask));

module.exports = router;
