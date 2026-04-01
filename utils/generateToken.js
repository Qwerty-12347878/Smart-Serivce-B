import jwt from 'jsonwebtoken';

const generateToken = (res, userId, role) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const token = jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

export default generateToken;
