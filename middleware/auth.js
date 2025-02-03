// middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
      const token = req.header('x-auth-token');
      if (!token) return res.status(401).json({ message: 'No token' });
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded token:', decoded); // Debug line
      req.user = decoded.user;
      next();
    } catch (err) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };