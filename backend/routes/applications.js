// ── APPLICATIONS ──
const express = require('express');
const { Application, Job } = require('../models/index');
const { protect, recruiterOnly, candidateOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let filter;
    if (req.user.role === 'recruiter') {
      const myJobs = await Job.find({ postedBy: req.user._id }).select('_id');
      filter = { job: { $in: myJobs.map(j => j._id) } };
    } else {
      filter = { candidate: req.user._id };
    }
    if (req.query.status) filter.status = req.query.status;
    const applications = await Application.find(filter)
      .populate('job', 'title location company type postedBy')
      .populate('candidate', 'name email title skills resume')
      .sort('-createdAt')
      .limit(Number(req.query.limit) || 50);
    res.json({ applications });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job', 'title location type salary')
      .populate('candidate', 'name email title skills experience education resume linkedin github');
    if (!application) return res.status(404).json({ message: 'Not found' });
    res.json({ application });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, candidateOnly, async (req, res) => {
  try {
    if (!req.user.resume || !req.user.resume.data) {
      return res.status(400).json({ message: 'Please upload your resume before applying' });
    }
    const app = await Application.create({ job: req.body.jobId, candidate: req.user._id, coverLetter: req.body.coverLetter });
    res.status(201).json({ application: app });
  } catch (e) {
    if (e.code === 11000) return res.status(400).json({ message: 'Already applied to this job' });
    res.status(500).json({ message: e.message });
  }
});

router.put('/:id/status', protect, recruiterOnly, async (req, res) => {
  try {
    const app = await Application.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json({ application: app });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;