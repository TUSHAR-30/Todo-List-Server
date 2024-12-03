const express = require('express');
const taskController = require('./../Controllers/taskController');
const authController=require("./../Controllers/authController")

const router = express.Router();

router.route('/')
.get(authController.protect,taskController.getAllTasks)
.post(authController.protect,taskController.createTask)

router.route('/:id')
.get(authController.protect,taskController.getTask)
.patch(authController.protect,taskController.updateTask)
.delete(authController.protect,taskController.deleteTask)

module.exports = router;