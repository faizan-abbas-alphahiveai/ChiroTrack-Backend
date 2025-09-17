import { body, validationResult } from 'express-validator';



const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};



const validateUserRegistration = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  
  handleValidationErrors
];


const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];


const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('phoneNumber')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  
  handleValidationErrors
];


const validatePasswordResetRequest = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  handleValidationErrors
];


const validateOTPVerification = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('otp')
    .isLength({ min: 5, max: 5 })
    .withMessage('Verification code must be exactly 5 digits')
    .isNumeric()
    .withMessage('Verification code must contain only numbers'),
  
  handleValidationErrors
];



const validatePasswordReset = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    }),
  
  handleValidationErrors
];



const validatePatientCreation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  
  body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate > today) {
        throw new Error('Date of birth cannot be in the future');
      }
      // Check if age is reasonable (not more than 150 years)
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age > 150) {
        throw new Error('Please provide a valid date of birth');
      }
      return true;
    }),
  
  handleValidationErrors
];



const validatePatientUpdate = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name can only contain letters and spaces'),
  
  body('gender')
    .optional()
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      if (birthDate > today) {
        throw new Error('Date of birth cannot be in the future');
      }
      // Check if age is reasonable (not more than 150 years)
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age > 150) {
        throw new Error('Please provide a valid date of birth');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Pose Detection Validation
const validatePoseDetectionCreation = [
  body('patientId')
    .isMongoId()
    .withMessage('Valid patient ID is required'),
  
  body('summary.validPosesDetected')
    .isInt({ min: 0 })
    .withMessage('Valid poses detected must be a non-negative integer'),
  
  body('summary.bestPoseAccuracy')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Best pose accuracy must be between 0 and 100'),
  
  body('summary.jointsDetected')
    .matches(/^\d+\/\d+$/)
    .withMessage('Joints detected must be in format "detected/total"'),
  
  body('summary.criticalJointsDetected')
    .isBoolean()
    .withMessage('Critical joints detected must be a boolean value'),
  
  body('bodyDetection')
    .isArray({ min: 1 })
    .withMessage('Body detection data is required'),
  
  body('bodyDetection.*.region')
    .isIn(['Head', 'Torso', 'Arms', 'Legs'])
    .withMessage('Body region must be Head, Torso, Arms, or Legs'),
  
  body('bodyDetection.*.detected')
    .isInt({ min: 0 })
    .withMessage('Detected count must be a non-negative integer'),
  
  body('bodyDetection.*.total')
    .isInt({ min: 1 })
    .withMessage('Total count must be a positive integer'),
  
  body('bodyDetection.*.accuracy')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Accuracy must be between 0 and 100'),
  
  body('proportions.height')
    .isFloat({ min: 0 })
    .withMessage('Height must be a non-negative number'),
  
  body('proportions.shoulders')
    .isFloat({ min: 0 })
    .withMessage('Shoulders measurement must be a non-negative number'),
  
  body('proportions.ratio')
    .isFloat({ min: 0 })
    .withMessage('Ratio must be a non-negative number'),
  
  body('joints')
    .isArray({ min: 1 })
    .withMessage('Joints data is required'),
  
  body('joints.*.name')
    .isIn([
      'Head', 'L. Shoulder', 'R. Shoulder', 'L. Elbow', 'R. Elbow',
      'L. Wrist', 'R. Wrist', 'L. Hip', 'R. Hip', 'L. Knee', 'R. Knee',
      'L. Ankle', 'R. Ankle', 'Neck', 'Torso'
    ])
    .withMessage('Invalid joint name'),
  
  body('joints.*.status')
    .isBoolean()
    .withMessage('Joint status must be true or false'),
  
  body('joints.*.confidence')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Joint confidence must be between 0 and 100'),
  
  body('joints.*.screenCoordinates.x')
    .optional()
    .isFloat()
    .withMessage('Screen X coordinate must be a number'),
  
  body('joints.*.screenCoordinates.y')
    .optional()
    .isFloat()
    .withMessage('Screen Y coordinate must be a number'),
  
  body('joints.*.visionCoordinates.x')
    .optional()
    .isFloat()
    .withMessage('Vision X coordinate must be a number'),
  
  body('joints.*.visionCoordinates.y')
    .optional()
    .isFloat()
    .withMessage('Vision Y coordinate must be a number'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  handleValidationErrors
];

const validatePoseDetectionUpdate = [
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  
  handleValidationErrors
];

export {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validatePasswordResetRequest,
  validateOTPVerification,
  validatePasswordReset,
  validatePatientCreation,
  validatePatientUpdate,
  validatePoseDetectionCreation,
  validatePoseDetectionUpdate
};
