const CustomError = require('../Utils/CustomError');
const User = require('./../Models/userModel');
const BlacklistedToken = require('./../Models/blacklistedTokenModal')
const asyncErrorHandler = require('./../Utils/asyncErrorHandler');
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const util = require("util");
const sendEmail = require("../Utils/email")

const signToken = id => {
    return jwt.sign({ id }, process.env.SECRET_STR, {
        expiresIn: process.env.LOGIN_EXPIRES
    })
}

const createSendResponse = (user, statusCode, res) => {
    const token = signToken(user._id)
    const options = {
        expires: new Date(
            Date.now() + process.env.COOKIE_EXPIRE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure:true,
        sameSite:'None'
    };

    res.status(statusCode).cookie("token", token, options).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
}


exports.signup = asyncErrorHandler(async (req, res, next) => {
    const newUser = await User.create(req.body);
    createSendResponse(newUser, 201, res);
});

exports.login = asyncErrorHandler(async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;

    //Check if email and pasword is present in request body
    if (!email || !password) {
        const error = new CustomError("Please provide email ID and password for login !", 400)
        return next(error)
    }

    //Check if user exists with given email
    const user = await User.findOne({ email })
        .select("+password")

    const isMatch = user && await user.comparePasswordInDb(password, user.password)

    if (!user || !isMatch) {
        const error = new CustomError("Incorrect email or password", 400);
        return next(error)
    }

    createSendResponse(user, 200, res)
})

exports.logout = asyncErrorHandler(async(req, res, next) => {

    const { token } = req.cookies;
    const decoded = jwt.decode(token);
    const expiresAt = new Date(decoded.exp * 1000);

    await BlacklistedToken.create({ token, expiresAt });

    res
      .status(200)
      .cookie("token", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
      })
      .json({
        success: true,
        message: "User Logged Out!",
      });
  });

exports.protect = asyncErrorHandler(async (req, res, next) => {
    //Read the token & check if it exits
    // const testToken=req.headers.authorization;
    // let token;
    // if(testToken && testToken.startsWith("Bearer")){
    //     token=testToken.split(" ")[1];
    // }
    // if(!token) {
    //     return next(new CustomError("You are not logged in",401))
    // }

    // Validate the token
    //  const decodedToken=await util.promisify(jwt.verify)(token,process.env.SECRET_STR)


    //1.Read the token & check if it exits
    const { token } = req.cookies;
    // 2.Validate the token
    if (!token) {
        return next(new CustomError("You are not logged in", 401))
    }
    const decodedToken = jwt.verify(token, process.env.SECRET_STR)
    // Check if token is blacklisted
    const blacklisted = await BlacklistedToken.findOne({ token });
    if (blacklisted) {
        return next(new CustomError("Token is invalid. Please log in again!", 401));
    }


    // 3 If the user exists
    const user = await User.findById(decodedToken.id);
    if (!user) {
        return next(new CustomError("User with the given token does not exist in database."))
    }

    // 4 If the user changed password after the token was issued
    const isPasswordChanged = await user.isPasswordChanged(decodedToken.iat)
    if (isPasswordChanged) {
        return next(new CustomError("The password has changed recently . Please login again.", 401))
    }

    // 5 Allow the user to access route
    req.user = user;
    next()
}

)

exports.restrict = (req, res, next) => {
    if (req.user.role != "admin") {
        return next(new CustomError("You do not have permission do perform this action", 401))
    }

    next()
}


exports.forgotPassword = asyncErrorHandler(async (req, res, next) => {
    //CHECK FOR THE USER EXISTENCE
    const email = req.body.email;
    if (!email) {
        return next(new CustomError("Please provide the email in order to reset your password.", 400))
    }
    const user = await User.findOne({ email })
    if (!user) {
        return next(new CustomError("User doesnot exist with the given email.", 400))
    }

    //CREATE TOKEN
    const resetToken = user.createResetPasswordToken();
    user.save({ validateBeforeSave: false })

    //SEND THE TOKEN BACK TO THE USER EMAIL
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    const message = `We have received a password reset request.Please use the below link to reset your password\n\n ${resetUrl}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Password change request received',
            message: message
        })

        res.status(200).json({
            status: "Success",
            message: "password reset link send to the user email."
        })

    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetTokenExpires = undefined;
        user.save({ validateBeforeSave: false });

        return next(new CustomError("There was an error sending password reset email.Please try again later."))
    }

})

exports.resetPassword = asyncErrorHandler(async (req, res, next) => {
    //1.IF THE USER EXISTS WITH THE GIVEN TOKEN AND TOKEN HAS NOT EXPIRED
    const token = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: token, passwordResetTokenExpires: { $gt: Date.now() } });

    if (!user) {
        const error = new CustomError("Token is invalid or has expired", 400)
        return next(error)
    }

    // 2. RESETING THE USER PASSWORD
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    //3.LOGIN THE USER
    createSendResponse(user, 200, res)
})
