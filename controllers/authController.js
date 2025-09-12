import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import TokenBlacklist from '../models/TokenBlacklist.js';
import { admin } from '../config/firebase.js';
import { sendPasswordResetEmail } from '../config/email.js';
import { normalizeEmail } from '../utils/emailUtils.js';




const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'fallback-secret', {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};


export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Normalize email for consistent storage
    const normalizedEmail = normalizeEmail(email);
    
    // Log the original and normalized email for debugging
    console.log('Registration attempt:', { 
      originalEmail: email, 
      normalizedEmail: normalizedEmail,
      validationNormalized: req.body.email 
    });

    // Check if user already exists with normalized email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email address'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with normalized email
    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      provider: 'email'
    });

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = normalizeEmail(email);
   
  const user = await User.findOne({ email: normalizedEmail });
  

    


    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

 
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id);

   
    user.lastLogin = new Date();
    await user.save();

    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};


export const googleSignIn = async (req, res) => {
  try {
    console.log('Google Sign-in request received:', { body: req.body, headers: req.headers });
    const { idToken } = req.body;

    if (!idToken) {
      console.log('No ID token provided');
      return res.status(400).json({
        success: false,
        message: 'ID token is required'
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if user exists in our database
    let user = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      // Create new user from Google data
      user = await User.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        firstName: decodedToken.name?.split(' ')[0] || 'User',
        lastName: decodedToken.name?.split(' ').slice(1).join(' ') || '',
        provider: 'google',
        isEmailVerified: decodedToken.email_verified || false,
        profilePicture: decodedToken.picture || null
      });
    } else {
      // Update existing user's last login
      user.lastLogin = new Date();
      await user.save();
    }

    // Generate our own JWT token for consistency
    const token = generateToken(user._id);

    // Remove password from response (if exists)
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Google sign-in successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Google sign-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during Google sign-in'
    });
  }
};


const generateOTP = () => {
  return Math.floor(10000 + Math.random() * 90000).toString();
};



export const sendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Normalize email for consistent lookup
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

   
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Please use Google to reset your password.'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    // Update user with OTP
    user.resetPasswordOTP = {
      code: otp,
      expiresAt: expiresAt,
      attempts: 0
    };
    await user.save();

    // Send OTP via email
    const emailResult = await sendPasswordResetEmail(normalizedEmail, otp);
    
    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
    }



    res.json({
      success: true,
      message: 'Verification code sent to your email address',
      data: {
        email: normalizedEmail,
        expiresIn: 180 
      }
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while sending verification code'
    });
  }
};


export const verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Normalize email for consistent lookup
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

 
    if (!user.resetPasswordOTP || !user.resetPasswordOTP.code) {
      return res.status(400).json({
        success: false,
        message: 'No verification code found. Please request a new one.'
      });
    }

    if (user.resetPasswordOTP.expiresAt < new Date()) {
   
      user.resetPasswordOTP = {
        code: null,
        expiresAt: null,
        attempts: 0
      };
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'Verification code has expired. Please request a new one.'
      });
    }

 
    if (user.resetPasswordOTP.attempts >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Too many failed attempts. Please request a new verification code.'
      });
    }


    if (user.resetPasswordOTP.code !== otp) {
   
      user.resetPasswordOTP.attempts += 1;
      await user.save();

      return res.status(400).json({
        success: false,
        message: 'Invalid verification code. Please try again.'
      });
    }


    const resetToken = generateToken(user._id);
    

    user.resetPasswordOTP = {
      code: null,
      expiresAt: null,
      attempts: 0
    };
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        resetToken: resetToken,
        email: normalizedEmail
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while verifying code'
    });
  }
};



export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Normalize email for consistent lookup
    const normalizedEmail = normalizeEmail(email);

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password confirmation does not match'
      });
    }

    // Find user by normalized email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while resetting password'
    });
  }
};



export const resendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Normalize email for consistent lookup
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email address'
      });
    }


    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Please use Google to reset your password.'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes

    // Expire all previous OTPs and set new one
    user.resetPasswordOTP = {
      code: otp,
      expiresAt: expiresAt,
      attempts: 0
    };
    await user.save();

    // Send new OTP via email
    const emailResult = await sendPasswordResetEmail(normalizedEmail, otp);
    
    if (!emailResult.success) {
      console.error('Failed to send email:', emailResult.error);
     
    }

    

    res.json({
      success: true,
      message: 'New verification code sent to your email address',
      data: {
        email: normalizedEmail,
        expiresIn: 180 
      }
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while resending verification code'
    });
  }
};


// Logout user
export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Add token to blacklist for enhanced security
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      
      // Calculate token expiration time
      const expiresAt = new Date(decoded.exp * 1000);
      
      // Add token to blacklist
      await TokenBlacklist.create({
        token: token,
        userId: decoded.userId,
        expiresAt: expiresAt
      });
      
      console.log(`User ${req.user.email} logged out and token blacklisted at ${new Date().toISOString()}`);
    } catch (jwtError) {
      // If it's not a JWT token (might be Firebase token), just log the logout
      console.log(`User ${req.user.email} logged out at ${new Date().toISOString()}`);
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
};

