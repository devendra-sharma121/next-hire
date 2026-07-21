const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'nexthire_super_secret';

const genToken = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '30d' });

const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  try {
    const { id } = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.user = await User.findById(id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch (e) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access only' });
  next();
};

const recruiterOnly = (req, res, next) => {
  if (req.user?.role !== 'recruiter') return res.status(403).json({ message: 'Recruiter access only' });
  next();
};

const candidateOnly = (req, res, next) => {
  if (req.user?.role !== 'candidate') return res.status(403).json({ message: 'Candidate access only' });
  next();
};

module.exports = { protect, adminOnly, recruiterOnly, candidateOnly, genToken };