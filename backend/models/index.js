const mongoose = require('mongoose');

// ── JOB ──
const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  type: { type: String, enum: ['Full-time','Part-time','Remote','Contract','Internship'], default: 'Full-time' },
  salary: String,
  skills: [String],
  department: String,
  status: { type: String, enum: ['active','closed','draft'], default: 'active' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  views: { type: Number, default: 0 },
}, { timestamps: true });

// ── APPLICATION ──
const ApplicationSchema = new mongoose.Schema({
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['applied','reviewing','shortlisted','rejected','selected'], default: 'applied' },
  coverLetter: String,
  interviewDate: Date,
}, { timestamps: true });

// Prevent duplicate applications
ApplicationSchema.index({ job: 1, candidate: 1 }, { unique: true });

// ── INTERVIEW ──
const InterviewSchema = new mongoose.Schema({
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  scheduledAt: Date,
  time: String,
  type: { type: String, default: 'Video Call' },
  meetLink: String,
  notes: String,
  status: { type: String, enum: ['scheduled','completed','cancelled'], default: 'scheduled' },
}, { timestamps: true });

// ── MESSAGE ──
const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = {
  Job: mongoose.model('Job', JobSchema),
  Application: mongoose.model('Application', ApplicationSchema),
  Interview: mongoose.model('Interview', InterviewSchema),
  Message: mongoose.model('Message', MessageSchema),
};