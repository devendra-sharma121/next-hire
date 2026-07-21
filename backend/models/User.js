// ── USER MODEL ──
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  role: { type: String, enum: ['admin', 'recruiter', 'candidate'], default: 'candidate' },
  isApprovedRecruiter: { type: Boolean, default: false },
  recruiterRequestStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  company: String,
  // Candidate profile
  title: String,
  bio: String,
  skills: [String],
  experience: String,
  education: String,
  // Resume stored in MongoDB
  resume: {
    data: Buffer,
    contentType: String,
    filename: String,
  },
  linkedin: String,
  github: String,
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
}, { timestamps: true });

UserSchema.methods.matchPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);