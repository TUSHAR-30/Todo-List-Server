const express = require('express');
const authController = require('./../Controllers/authController')

const router = express.Router();

router.route('/signup').post(authController.signup);
router.route('/login').post(authController.login);
router.get("/logout", authController.protect, authController.logout);
router.route('/forgotPassword').post(authController.forgotPassword)
router.route('/resetPassword/:token').patch(authController.resetPassword)
router.route('/authenticate').get(authController.protect,(req,res,next)=>{
    res.status(200).json({
        status:"Success",
        message:"User is Authenticated"
    })
});

module.exports = router;