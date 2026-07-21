const express = require('express');
const { Job, Application } = require('../models/index');
const { protect, recruiterOnly } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET all jobs (public + filtered)
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.mine === 'true') filter.postedBy = req.user._id;
    else filter.status = 'active';
    const jobs = await Job.find(filter).populate('postedBy', 'name company').sort('-createdAt').limit(Number(req.query.limit) || 50);
    // Add applicant count
    const jobsWithCount = await Promise.all(jobs.map(async j => {
      const count = await Application.countDocuments({ job: j._id });
      return { ...j.toObject(), applicantCount: count };
    }));
    res.json({ jobs: jobsWithCount });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET single job
router.get('/:id', protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('postedBy', 'name company');
    if (!job) return res.status(404).json({ message: 'Job not found' });
    job.views++;
    await job.save();
    res.json({ job });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST create job
router.post('/', protect, recruiterOnly, async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json({ job });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PUT update job
router.put('/:id', protect, recruiterOnly, async (req, res) => {
  try {
    const job = await Job.findOneAndUpdate({ _id: req.params.id, postedBy: req.user._id }, req.body, { new: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json({ job });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// DELETE job
router.delete('/:id', protect, recruiterOnly, async (req, res) => {
  try {
    await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Save job (candidate)
router.post('/:id/save', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const jobId = req.params.id;
    const idx = user.savedJobs.indexOf(jobId);
    if (idx > -1) user.savedJobs.splice(idx, 1);
    else user.savedJobs.push(jobId);
    await user.save();
    res.json({ saved: idx === -1 });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;