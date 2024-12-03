const express = require('express');
const authController = require('./../Controllers/authController')
const userController = require('./../Controllers/userController')
const upload=require("../uploadConfig")

const router = express.Router();

router.route('/getAllUsers').get(userController.getAllUsers)
router.route('/updatePassword').patch(authController.protect,userController.updatePassword)
router.route('/deleteMe').delete(authController.protect,userController.deleteMe)
router.route("/me").get(authController.protect, userController.myProfile);
router.route('/updateMe').patch(authController.protect,upload.single('photo'),userController.validateNewData,userController.updateMe)

//i am first using multer to get request body,file and then i am validating new data. So, in this process my photo is getting uploading to server unnecessary if the body validation failed in the next middleware.But i have no other way because body validation can only happen after the multer upload middleware.




module.exports=router;


