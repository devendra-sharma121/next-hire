const express = require('express');
const { Job, Application, Interview } = require('../models/index');
const { protect, recruiterOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', protect, recruiterOnly, async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user._id });
    const jobIds = myJobs.map(j => j._id);
    const [totalApplicants, shortlisted, interviews] = await Promise.all([
      Application.countDocuments({ job: { $in: jobIds } }),
      Application.countDocuments({ job: { $in: jobIds }, status: 'shortlisted' }),
      Interview.countDocuments({ recruiter: req.user._id }),
    ]);
    res.json({ totalJobs: myJobs.length, totalApplicants, shortlisted, interviews });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/analytics', protect, recruiterOnly, async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user._id });
    const jobIds = myJobs.map(j => j._id);
    const applications = await Application.countDocuments({ job: { $in: jobIds } });
    const selected = await Application.countDocuments({ job: { $in: jobIds }, status: 'selected' });
    const views = myJobs.reduce((sum, j) => sum + (j.views || 0), 0);

    // Top jobs by applicant count
    const topJobs = await Promise.all(myJobs.map(async j => ({
      title: j.title,
      count: await Application.countDocuments({ job: j._id }),
    })));
    topJobs.sort((a, b) => b.count - a.count);

    res.json({
      views, applications,
      conversion: applications ? Math.round((selected / applications) * 100) : 0,
      avgHire: 14,
      topJobs: topJobs.slice(0, 5),
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get jobs posted by this recruiter
router.get('/jobs', protect, recruiterOnly, async (req, res) => {
  try {
    const jobs = await Job.find({ postedBy: req.user._id }).sort('-createdAt');
    const jobsWithCount = await Promise.all(jobs.map(async j => {
      const count = await Application.countDocuments({ job: j._id });
      return { ...j.toObject(), applicantCount: count };
    }));
    res.json({ jobs: jobsWithCount });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get applications for recruiter's jobs
router.get('/applications', protect, recruiterOnly, async (req, res) => {
  try {
    const myJobs = await Job.find({ postedBy: req.user._id });
    const jobIds = myJobs.map(j => j._id);
    const filter = { job: { $in: jobIds } };
    if (req.query.status) filter.status = req.query.status;
    const applications = await Application.find(filter)
      .populate('job', 'title location company type postedBy')
      .populate('candidate', 'name email title skills resume')
      .sort('-createdAt')
      .limit(Number(req.query.limit) || 50);
    res.json({ applications });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Update application status
router.patch('/applications/:id/status', protect, recruiterOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['applied', 'reviewing', 'shortlisted', 'rejected', 'selected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const app = await Application.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!app) return res.status(404).json({ message: 'Application not found' });
    res.json({ application: app });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Get single application with full details
router.get('/applications/:id', protect, recruiterOnly, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title location type salary company')
      .populate('candidate', 'name email title skills experience education resume linkedin github bio');
    if (!application) return res.status(404).json({ message: 'Application not found' });
    res.json({ application });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;