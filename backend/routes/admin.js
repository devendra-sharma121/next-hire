// ── ADMIN ROUTES ──
const express = require('express');
const User = require('../models/User');
const { Job, Application, Interview, Message } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All routes require admin auth
router.use(protect, adminOnly);

// GET /admin/stats - Dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalJobs, totalApplications, totalInterviews, recruiters, candidates, pendingRecruiters] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      Interview.countDocuments(),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'recruiter', recruiterRequestStatus: 'pending' }),
    ]);
    
    const jobsByStatus = await Job.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const appsByStatus = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    res.json({
      totalUsers,
      totalJobs,
      totalApplications,
      totalInterviews,
      recruiters,
      candidates,
      pendingRecruiters,
      jobsByStatus: jobsByStatus.reduce((acc, j) => { acc[j._id] = j.count; return acc; }, {}),
      appsByStatus: appsByStatus.reduce((acc, a) => { acc[a._id] = a.count; return acc; }, {}),
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /admin/users - All users
router.get('/users', async (req, res) => {
  try {
    console.log('GET /admin/users called');
    const users = await User.find().select('-password').sort('-createdAt');
    console.log('Found users:', users.length);
    res.json({ users });
  } catch (e) { 
    console.error('Error fetching users:', e);
    res.status(500).json({ message: e.message }); 
  }
});

// PATCH /admin/users/:id/role - Change user role
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'recruiter', 'candidate'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /admin/users/:id/approve-recruiter - Approve recruiter
router.patch('/users/:id/approve-recruiter', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApprovedRecruiter: true, recruiterRequestStatus: 'approved' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /admin/users/:id/reject-recruiter - Reject recruiter
router.patch('/users/:id/reject-recruiter', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApprovedRecruiter: false, recruiterRequestStatus: 'rejected', role: 'candidate' },
      { new: true }
    ).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE /admin/users/:id - Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Cannot delete admin' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /admin/recruiters - All recruiters
router.get('/recruiters', async (req, res) => {
  try {
    const recruiters = await User.find({ role: 'recruiter' }).select('-password').sort('-createdAt');
    res.json({ recruiters });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /admin/recruiters/:id/activity - Recruiter activity
router.get('/recruiters/:id/activity', async (req, res) => {
  try {
    const recruiter = await User.findById(req.params.id).select('-password');
    if (!recruiter) return res.status(404).json({ message: 'Recruiter not found' });
    
    const jobs = await Job.find({ postedBy: req.params.id });
    const jobIds = jobs.map(j => j._id);
    
    const applications = await Application.find({ job: { $in: jobIds } })
      .populate('candidate', 'name email')
      .populate('job', 'title');
    
    const interviews = await Interview.find({ recruiter: req.params.id })
      .populate('candidate', 'name email')
      .populate('job', 'title');
    
    res.json({
      recruiter,
      stats: {
        totalJobs: jobs.length,
        totalApplications: applications.length,
        totalInterviews: interviews.length,
      },
      recentJobs: jobs.slice(0, 5),
      recentApplications: applications.slice(0, 10),
      recentInterviews: interviews.slice(0, 10),
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /admin/candidates - All candidates
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await User.find({ role: 'candidate' }).select('-password').sort('-createdAt');
    res.json({ candidates });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /admin/candidates/:id - Single candidate with applications
router.get('/candidates/:id', async (req, res) => {
  try {
    const candidate = await User.findById(req.params.id).select('-password');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    
    const applications = await Application.find({ candidate: req.params.id })
      .populate('job', 'title location company type status');
    
    const interviews = await Interview.find({ candidate: req.params.id })
      .populate('job', 'title')
      .populate('recruiter', 'name company');
    
    res.json({ candidate, applications, interviews });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /admin/jobs - All jobs
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().populate('postedBy', 'name company').sort('-createdAt');
    const jobsWithCount = await Promise.all(jobs.map(async j => {
      const count = await Application.countDocuments({ job: j._id });
      return { ...j.toObject(), applicantCount: count };
    }));
    res.json({ jobs: jobsWithCount });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /admin/jobs/:id - Single job with applications
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name company');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    
    const applications = await Application.find({ job: req.params.id })
      .populate('candidate', 'name email title skills resume');
    
    res.json({ job, applications });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /admin/jobs/:id/status - Update job status
router.patch('/jobs/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'closed', 'draft'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const job = await Job.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /admin/pipeline - Application pipeline
router.get('/pipeline', async (req, res) => {
  try {
    const pipeline = await Application.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const byJob = await Application.aggregate([
      { $group: { _id: '$job', statusCounts: { $push: { status: '$status' } } } },
      { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      { $project: { jobTitle: '$job.title', statusCounts: 1 } }
    ]);
    
    const applications = await Application.find()
      .populate('job', 'title company')
      .populate('candidate', 'name email')
      .sort('-createdAt')
      .limit(50);
    
    res.json({
      pipeline: pipeline.reduce((acc, p) => { acc[p._id] = p.count; return acc; }, {}),
      byJob: byJob.slice(0, 10),
      recentApplications: applications,
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /admin/logs - Admin activity logs (simple in-memory style for now)
router.get('/logs', async (req, res) => {
  try {
    const recentUsers = await User.find().select('name email role createdAt').sort('-createdAt').limit(20);
    const recentJobs = await Job.find().select('title status createdAt').sort('-createdAt').limit(20);
    const recentApplications = await Application.find().select('status createdAt').sort('-createdAt').limit(20);
    
    res.json({
      logs: [
        ...recentUsers.map(u => ({ type: 'user', action: 'created', name: u.name, email: u.email, role: u.role, date: u.createdAt })),
        ...recentJobs.map(j => ({ type: 'job', action: j.status, name: j.title, date: j.createdAt })),
        ...recentApplications.map(a => ({ type: 'application', action: a.status, date: a.createdAt })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 50)
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;
