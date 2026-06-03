import mongoose from 'mongoose';

const EvaluationLogSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Interview',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    enum: ['skill_gap', 'question_generation', 'answer_scoring', 'roadmap_generation'],
    required: true
  },
  latencyMs: {
    type: Number,
    required: true
  },
  promptTokens: {
    type: Number,
    default: 0
  },
  completionTokens: {
    type: Number,
    default: 0
  },
  cost: {
    type: Number, // cost in USD
    default: 0
  },
  accuracy: {
    type: Number, // 0 to 100
    default: 80
  },
  relevance: {
    type: Number, // 0 to 100
    default: 80
  },
  faithfulness: {
    type: Number, // 0 to 100
    default: 80
  },
  hallucinationRate: {
    type: Number, // 0 to 100
    default: 0
  },
  userFeedbackScore: {
    type: Number, // 1 to 5 stars (optional, user rating on the session/answer)
    default: null
  },
  userComments: {
    type: String,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('EvaluationLog', EvaluationLogSchema);
