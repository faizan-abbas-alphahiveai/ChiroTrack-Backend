import mongoose from 'mongoose';

const jointSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: [
      'Head', 'L. Shoulder', 'R. Shoulder', 'L. Elbow', 'R. Elbow',
      'L. Wrist', 'R. Wrist', 'L. Hip', 'R. Hip', 'L. Knee', 'R. Knee',
      'L. Ankle', 'R. Ankle', 'Neck', 'Torso'
    ]
  },
  status: {
    type: Boolean,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  screenCoordinates: {
    x: Number,
    y: Number
  },
  visionCoordinates: {
    x: Number,
    y: Number
  }
});

const bodyRegionSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    enum: ['Head', 'Torso', 'Arms', 'Legs']
  },
  detected: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  accuracy: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  }
});

const proportionsSchema = new mongoose.Schema({
  height: {
    type: Number,
    required: true,
    min: 0
  },
  shoulders: {
    type: Number,
    required: true,
    min: 0
  },
  ratio: {
    type: Number,
    required: true,
    min: 0
  }
});

const poseDetectionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Summary data
  summary: {
    validPosesDetected: {
      type: Number,
      required: true,
      min: 0
    },
    bestPoseAccuracy: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    jointsDetected: {
      type: String,
      required: true,
      pattern: /^\d+\/\d+$/
    },
    criticalJointsDetected: {
      type: Boolean,
      required: true
    }
  },

  // Detailed analysis
  bodyDetection: [bodyRegionSchema],
  proportions: proportionsSchema,
  joints: [jointSchema],

  // Additional metadata
  scanDate: {
    type: Date,
    default: Date.now
  },
  deviceInfo: {
    type: String,
    default: 'Apple Vision API'
  },
  notes: {
    type: String,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Indexes for better query performance
poseDetectionSchema.index({ patientId: 1, scanDate: -1 });
poseDetectionSchema.index({ createdBy: 1, scanDate: -1 });
poseDetectionSchema.index({ 'summary.bestPoseAccuracy': -1 });

// Virtual for formatted joints detected
poseDetectionSchema.virtual('jointsDetectedCount').get(function() {
  const [detected, total] = this.summary.jointsDetected.split('/').map(Number);
  return { detected, total };
});

// Virtual for overall assessment
poseDetectionSchema.virtual('overallAssessment').get(function() {
  const accuracy = this.summary.bestPoseAccuracy;
  if (accuracy >= 90) return 'Excellent';
  if (accuracy >= 80) return 'Good';
  if (accuracy >= 70) return 'Fair';
  return 'Needs Improvement';
});

poseDetectionSchema.set('toJSON', { virtuals: true });
poseDetectionSchema.set('toObject', { virtuals: true });

const PoseDetection = mongoose.model('PoseDetection', poseDetectionSchema);

export default PoseDetection;
