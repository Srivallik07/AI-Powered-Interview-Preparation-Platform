import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  resumeName: {
    type: String,
    required: true
  },
  resumeParsedText: {
    type: String,
    required: true
  },
  resumeData: {
    type: mongoose.Schema.Types.Mixed, // parsed JSON: skills, experience, etc.
    default: {}
  },
  jobDescription: {
    type: String,
    required: true
  },
  companyProfile: {
    type: String,
    default: ''
  },
  roleRequirements: {
    type: String,
    default: ''
  },
  skillGaps: {
    matchedSkills: [{ type: String }],
    missingSkills: [{ type: String }],
    skillScores: [{
      skill: { type: String },
      score: { type: Number, min: 0, max: 100 }
    }],
    gapAnalysis: { type: String }
  }
}, {
  timestamps: true
});

export default mongoose.model('Session', SessionSchema);
