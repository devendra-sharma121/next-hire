const express = require('express');
const { Interview, Application } = require('../models/index');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const filter = req.user.role === 'recruiter' ? { recruiter: req.user._id } : { candidate: req.user._id };
    const interviews = await Interview.find(filter)
      .populate('candidate', 'name email')
      .populate('job', 'title')
      .sort('scheduledAt');
    res.json({ interviews });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/', protect, async (req, res) => {
  try {
    const { applicationId, scheduledAt, time, type, meetLink, notes } = req.body;
    const app = await Application.findById(applicationId).populate('job');
    if (!app) return res.status(404).json({ message: 'Application not found' });
    const interview = await Interview.create({
      application: applicationId,
      job: app.job,
      candidate: app.candidate,
      recruiter: req.user._id,
      scheduledAt, time, type, meetLink, notes,
    });
    await Application.findByIdAndUpdate(applicationId, { status: 'reviewing', interviewDate: scheduledAt });
    res.status(201).json({ interview });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const interview = await Interview.findOneAndDelete({ _id: req.params.id, recruiter: req.user._id });
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;