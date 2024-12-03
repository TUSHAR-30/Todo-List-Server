const CustomError = require('../Utils/CustomError');
const User = require('./../Models/userModel');
const asyncErrorHandler = require('./../Utils/asyncErrorHandler');
const jwt = require("jsonwebtoken")
const validator = require('validator');
const cloudinary = require("cloudinary").v2
const fs = require('fs');


const filterReqObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(prop => {
        if (allowedFields.includes(prop))
            newObj[prop] = obj[prop];
    })
    return newObj;
}


exports.validateNewData = asyncErrorHandler(async (req, res, next) => {
    const body=req.body;
    if("name" in body){
        let trimmedName=req.body.name;
        trimmedName=trimmedName.trim();
        if(!trimmedName){
            return next(new CustomError("Please enter valid name", 400))
        }
    }
    if (req.body.email) {
        // Check if email is unique if it's being updated
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
            return next(new CustomError("Email is already in use", 400));
        }

        //Check whether the provided new value for email is valid or not
        const isEmailValid = validator.isEmail(req.body.email);
        if (!isEmailValid) {
            return next(new CustomError("The new email value is not valid", 400))
        }
    }

    // CHECK IF REQUEST DATA CONTAINS PASSWORD | CONFIRM PASSWORD FIELD
    if (req.body.password || req.body.confirmPassword) {
        return next(new CustomError("You cannot update your password using this endpoint", 400))
    }

    // Allow the request to proceed to the next middleware
    next();

})

exports.updateMe = asyncErrorHandler(async (req, res, next) => {

    const filterObj = filterReqObj(req.body, 'name', 'email')

    //if the file is sent then do these next 2nd,3rd,4rth step and the 1st step is already done which is saving of file in server if file is sent 
    // 2.Store the same file in cloudinary.
    // 3.Add the url returned by cloudinary in the database.
    // 4.Delete the file from server.
    console.log(req.file)
    if (req.file && req.file.path) {
        const x = await cloudinary.uploader.upload(req.file.path);
        filterObj.photo = x.secure_url;
        fs.unlink((req.file.path), function (err) {
            if (err) console.log(err);
            else console.log("\n File deleted successfully");
        })
    }

    const updatedUser = await User.findByIdAndUpdate(req.user._id, filterObj, { runValidators: true, new: true })

    res.status(200).json({
        statuts: "success",
        data: {
            updatedUser
        }
    })
})

exports.deleteMe = asyncErrorHandler(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });

    res.status(204).json({
        status: "success",
        data: null
    })
})

exports.myProfile = (req, res, next) => {
    const user = req.user;
    res.status(200).json({
        success: true,
        user,
    });
};

exports.updatePassword = asyncErrorHandler(async (req, res, next) => {
    if (!req.body.currentPassword || !req.body.password || !req.body.confirmPassword) {
        return next(new CustomError("Please provide current password,new password and confirm password field."))
    }

    // GET USER DATA FROM DATABASE
    const user = await User.findById(req.user._id).select('+password');

    //CHECK IF THE SUPPLIED CURRENT PASSWORD IS CORRECT
    if (!(await user.comparePasswordInDb(req.body.currentPassword, user.password))) {
        return next(new CustomError('The current password you provided is wrong'), 401);
    }

    //IF SUPPLIED PASSWORD IS CORRECT,UPDATE USER PASSWORD WITH NEW VALUE
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    //LOGIN USER AND SEND JWT
    const id = user._id;
    const token = jwt.sign({ id }, process.env.SECRET_STR, {
        expiresIn: process.env.LOGIN_EXPIRES
    })
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
    };

    res.status(200).cookie("token", token, options).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
})

exports.getAllUsers = asyncErrorHandler(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: "success",
        result: users.length,
        data: {
            users
        }
    })
})