import mongoose from 'mongoose';


const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.firebaseUid && !this.googleUid; 
    },
    minlength: [6, 'Password must be at least 6 characters long']
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true 
  },
  googleUid: {
    type: String,
    unique: true,
    sparse: true 
  },
  provider: {
    type: String,
    enum: ['email', 'google'],
    default: 'email'
  },
  lastLogin: {
    type: Date,
    default: null
  },
  resetPasswordOTP: {
    code: {
      type: String,
      default: null
    },
    expiresAt: {
      type: Date,
      default: null
    },
    attempts: {
      type: Number,
      default: 0
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  profilePicture: {
    type: String,
    default: null
  },
}, {
  timestamps: true
});


userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ googleUid: 1 });

export default mongoose.model('User', userSchema);
