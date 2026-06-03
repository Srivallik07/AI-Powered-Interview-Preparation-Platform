import mongoose from 'mongoose';

const InterviewSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed'],
    default: 'active'
  },
  questions: [{
    question: { type: String, required: true },
    type: { type: String, enum: ['technical', 'behavioral', 'situational', 'role-specific'], required: true },
    idealKeywords: [{ type: String }],
    answer: { type: String, default: '' },
    evaluation: {
      score: { type: Number, default: 0 },
      relevance: { type: Number, default: 0 },
      completeness: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      feedback: { type: String, default: '' },
      suggestions: [{ type: String }]
    }
  }],
  overallScore: {
    type: Number,
    default: 0
  },
  overallFeedback: {
    type: String,
    default: ''
  },
  roadmap: {
    weeks: [{
      weekNumber: { type: Number },
      focus: { type: String },
      topics: [{
        title: { type: String },
        details: { type: String },
        resources: [{ type: String }],
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' }
      }]
    }]
  }
}, {
  timestamps: true
});

export default mongoose.model('Interview', InterviewSchema);
