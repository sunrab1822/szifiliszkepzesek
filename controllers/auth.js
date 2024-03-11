const path = require("path");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse"); // @desc   Register user

// @route  POST /api/auth/register
// @access Public
exports.register = async (req, res, next) => {
  try {
    const user = await User.create(req.body);
    sendTokenResponse(user, 200, res);
    const token = user.getSignedJwtToken();
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body; // email és jelszó ellenőrzése
    if (!email || !password) {
      return next(
        new ErrorResponse(
          "Kérem adjon meg egy email címet és egy jelszót!",
          400
        )
      );
    } // A felhasználó megkeresése az adatbázisban
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return next(new ErrorResponse("Érvénytelen email vagy jelszó!", 401));
    } // A jelszó megfelelőségének ellenőrzése
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new ErrorResponse("Érvénytelen email vagy jelszó!", 401));
    }
    sendTokenResponse(user, 200, res);
    // Token létrehozása
    const token = user.getSignedJwtToken();
    //res.status(200).json({ success: true, token });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

// Token megszerzése a modeltől, süti létrehozása és válasz küldése
const sendTokenResponse = (user, statusCode, res) => {
  // Token létrehozása
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: true,
  };
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    token,
  });
};

// @desc   A bejelentkezett felhasználó megszerzése
// @route  POST /api/auth/me
// @access Private
exports.getMe = async (req, res, next) => {
  try {
    console.log(req.user);
    const user = await User.findById(req.user._id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};

// @desc   Elfelejtett jelszó
// @route  POST /api/auth/forgotpassword
// @access Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new ErrorResponse("There is no user that email", 404));
    } // A reset token megszerzése
    const resetToken = user.getResetPasswordToken();
    console.log(resetToken);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(400).json({ success: false, msg: error.message });
  }
};
