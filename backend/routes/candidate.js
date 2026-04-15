const express = require('express');
const multer = require('multer');
const { Application, Interview } = require('../models/index');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ storage, fileFilter: (_, file, cb) => {
  if (file.mimetype === 'application/pdf') cb(null, true);
  else cb(new Error('Only PDF files allowed'));
}});

// Get own profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    const [applied, shortlisted, interviews] = await Promise.all([
      Application.countDocuments({ candidate: req.user._id }),
      Application.countDocuments({ candidate: req.user._id, status: 'shortlisted' }),
      Interview.countDocuments({ candidate: req.user._id }),
    ]);
    const profile = user.toObject();
    const hasResume = !!(profile.resume && profile.resume.data);
    delete profile.resume;
    profile.hasResume = hasResume;
    console.log('Profile response - hasResume:', hasResume);
    res.json({ profile, stats: { applied, shortlisted, interviews } });
  } catch (e) { 
    console.error('Profile error:', e);
    res.status(500).json({ message: e.message }); 
  }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { title, bio, skills, experience, education, linkedin, github } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { title, bio, skills, experience, education, linkedin, github }, { new: true }).select('-password');
    res.json({ profile: user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Upload resume
router.post('/resume', protect, upload.single('resume'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    await User.findByIdAndUpdate(req.user._id, {
      resume: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
        filename: req.file.originalname,
      },
    });
    res.json({ resume: { filename: req.file.originalname } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get resume (for own profile) - accepts token via query param for direct link access
router.get('/resume', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).json({ message: 'Token required' });
    
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'nexthire_super_secret';
    const { id } = jwt.verify(token, JWT_SECRET);
    
    const user = await User.findById(id);
    if (!user.resume || !user.resume.data) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    res.set('Content-Type', user.resume.contentType);
    res.set('Content-Disposition', `inline; filename="${user.resume.filename}"`);
    res.send(user.resume.data);
  } catch (e) { 
    console.error('Resume get error:', e);
    res.status(401).json({ message: 'Invalid token' }); 
  }
});

// Get candidate resume (for recruiter)
router.get('/resume/:candidateId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.candidateId);
    if (!user.resume || !user.resume.data) {
      return res.status(404).json({ message: 'Resume not found' });
    }
    res.set('Content-Type', user.resume.contentType);
    res.set('Content-Disposition', `attachment; filename="${user.resume.filename}"`);
    res.send(user.resume.data);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Candidate stats
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const [applied, shortlisted, interviews] = await Promise.all([
      Application.countDocuments({ candidate: req.user._id }),
      Application.countDocuments({ candidate: req.user._id, status: 'shortlisted' }),
      Interview.countDocuments({ candidate: req.user._id }),
    ]);
    res.json({ applied, shortlisted, interviews, saved: user.savedJobs?.length || 0 });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// My applications
router.get('/applications', protect, async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user._id })
      .populate('job', 'title location company type salary')
      .sort('-createdAt');
    res.json({ applications });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Saved jobs
router.get('/saved', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('savedJobs');
    res.json({ jobs: user.savedJobs || [] });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;