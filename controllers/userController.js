import crypto from 'crypto';
import User from '../models/userModel.js';
import Worker from '../models/workerModel.js';
import Service from '../models/serviceModel.js';
import Booking from '../models/bookingModel.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      generateToken(res, user._id, 'user');

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({ name, email, password });

    if (user) {
      generateToken(res, user._id, 'user');
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        phone: user.phone,
        address: user.address,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin)
// @route   GET /api/users/all
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    next(error);
  }
};

// @desc    Get admin dashboard stats
// @route   GET /api/users/stats
// @access  Private/Admin
const getAdminStats = async (req, res, next) => {
  try {
    const usersCount = await User.countDocuments();
    const workersCount = await Worker.countDocuments();
    const servicesCount = await Service.countDocuments();
    const bookingsCount = await Booking.countDocuments();

    const revenueResult = await Booking.aggregate([
      { $match: { isPaid: true } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } },
    ]);

    const revenue = revenueResult[0]?.total || 0;

    res.json({ users: usersCount, workers: workersCount, services: servicesCount, bookings: bookingsCount, revenue });
  } catch (error) {
    next(error);
  }
};

// @desc    Send password reset link
// @route   POST /api/users/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      res.status(400);
      throw new Error('Email is required');
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        message: 'If an account with this email exists, password reset instructions will be sent.',
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    let emailSent = false;

    try {
      emailSent = await sendEmail({
        to: user.email,
        subject: 'Reset your SmartServe password',
        text: `Reset your SmartServe password using this link: ${resetUrl}. This link expires in 1 hour.`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
            <h2>Reset your SmartServe password</h2>
            <p>Hello ${user.name},</p>
            <p>We received a request to reset your password. Use the button below to continue:</p>
            <p>
              <a href="${resetUrl}" style="display: inline-block; padding: 12px 20px; background: #ec4899; color: #ffffff; text-decoration: none; border-radius: 8px;">
                Reset Password
              </a>
            </p>
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <p>${resetUrl}</p>
            <p>This link expires in 1 hour.</p>
          </div>
        `,
      });
    } catch (mailError) {
      console.error('Forgot password email error:', mailError.message);
    }

    if (!emailSent) {
      console.log(`Password reset URL (SMTP not configured): ${resetUrl}`);
    }

    res.json({
      message: emailSent
        ? 'Password reset instructions have been sent to your email.'
        : 'Reset link generated. If email delivery is unavailable, check the backend console for the link.',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/users/reset-password/:token
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    const resetToken = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Password reset token is invalid or has expired');
    }

    const { password } = req.body;
    if (!password) {
      res.status(400);
      throw new Error('New password is required');
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: 'Password has been successfully reset. You can log in now.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.address = req.body.address || user.address;

    if (req.body.password) {
      if (req.body.password !== req.body.confirmPassword) {
        res.status(400);
        throw new Error('Passwords do not match');
      }
      user.password = req.body.password;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      phone: updatedUser.phone,
      address: updatedUser.address,
    });
  } catch (error) {
    next(error);
  }
};

export { authUser, registerUser, logoutUser, getUserProfile, updateUserProfile, getAllUsers, getAdminStats, forgotPassword, resetPassword };
