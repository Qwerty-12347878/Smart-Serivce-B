import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import Worker from '../models/workerModel.js';

// Protect routes
const protect = async (req, res, next) => {
  let token;
  token = req.cookies.jwt;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Depending on the role, fetch from User or Worker model
      if (decoded.role === 'worker') {
        req.worker = await Worker.findById(decoded.userId).select('-password');
      } else {
        req.user = await User.findById(decoded.userId).select('-password');
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      next(new Error('Not authorized, token failed'));
    }
  } else {
    res.status(401);
    next(new Error('Not authorized, no token'));
  }
};

// Admin middleware
const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401);
    next(new Error('Not authorized as an admin'));
  }
};

// Worker middleware
const worker = (req, res, next) => {
  if (req.worker) {
    next();
  } else {
    res.status(401);
    next(new Error('Not authorized as a worker'));
  }
};

export { protect, admin, worker };
