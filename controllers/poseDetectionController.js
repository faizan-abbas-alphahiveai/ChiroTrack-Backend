import PoseDetection from '../models/PoseDetection.js';
import Patient from '../models/Patient.js';

// Create a new pose detection record
export const createPoseDetection = async (req, res) => {
  try {
    const {
      patientId,
      summary,
      bodyDetection,
      proportions,
      joints,
      notes
    } = req.body;

    const userId = req.user._id;

    // Verify patient exists and belongs to the user
    const patient = await Patient.findOne({
      _id: patientId,
      createdBy: userId
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found or you do not have permission to access this patient'
      });
    }

    // Create the pose detection record
    const poseDetection = await PoseDetection.create({
      patientId,
      createdBy: userId,
      summary,
      bodyDetection,
      proportions,
      joints,
      notes
    });

    // Update patient's lastScan date
    await Patient.findByIdAndUpdate(patientId, {
      lastScan: new Date()
    });

    // Populate the response
    await poseDetection.populate([
      { path: 'patientId', select: 'fullName gender dateOfBirth' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Pose detection data saved successfully',
      data: {
        poseDetection
      }
    });
  } catch (error) {
    console.error('Create pose detection error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while saving pose detection data'
    });
  }
};

// Get all pose detection records for a patient
export const getPoseDetectionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Verify patient exists and belongs to the user
    const patient = await Patient.findOne({
      _id: patientId,
      createdBy: userId
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found or you do not have permission to access this patient'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const poseDetections = await PoseDetection.find({ patientId })
      .populate('createdBy', 'firstName lastName email')
      .sort({ scanDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PoseDetection.countDocuments({ patientId });

    res.json({
      success: true,
      message: 'Pose detection records retrieved successfully',
      data: {
        poseDetections,
        patient: {
          id: patient._id,
          fullName: patient.fullName,
          gender: patient.gender
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRecords: total,
          hasNextPage: skip + poseDetections.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get pose detections by patient error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving pose detection records'
    });
  }
};

// Get a specific pose detection record
export const getPoseDetection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const poseDetection = await PoseDetection.findOne({
      _id: id,
      createdBy: userId
    })
    .populate([
      { path: 'patientId', select: 'fullName gender dateOfBirth' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    if (!poseDetection) {
      return res.status(404).json({
        success: false,
        message: 'Pose detection record not found'
      });
    }

    res.json({
      success: true,
      message: 'Pose detection record retrieved successfully',
      data: {
        poseDetection
      }
    });
  } catch (error) {
    console.error('Get pose detection error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pose detection ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving pose detection record'
    });
  }
};

// Get all pose detection records for the authenticated user
export const getAllPoseDetections = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, patientId, sortBy = 'scanDate', sortOrder = 'desc' } = req.query;

    const query = { createdBy: userId };
    
    if (patientId) {
      query.patientId = patientId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const poseDetections = await PoseDetection.find(query)
      .populate([
        { path: 'patientId', select: 'fullName gender dateOfBirth' },
        { path: 'createdBy', select: 'firstName lastName email' }
      ])
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PoseDetection.countDocuments(query);

    res.json({
      success: true,
      message: 'Pose detection records retrieved successfully',
      data: {
        poseDetections,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalRecords: total,
          hasNextPage: skip + poseDetections.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all pose detections error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving pose detection records'
    });
  }
};

// Update a pose detection record
export const updatePoseDetection = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user._id;

    const poseDetection = await PoseDetection.findOne({
      _id: id,
      createdBy: userId
    });

    if (!poseDetection) {
      return res.status(404).json({
        success: false,
        message: 'Pose detection record not found'
      });
    }

    // Only allow updating notes for now
    const updateData = {};
    if (notes !== undefined) updateData.notes = notes;

    const updatedPoseDetection = await PoseDetection.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'patientId', select: 'fullName gender dateOfBirth' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    res.json({
      success: true,
      message: 'Pose detection record updated successfully',
      data: {
        poseDetection: updatedPoseDetection
      }
    });
  } catch (error) {
    console.error('Update pose detection error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pose detection ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating pose detection record'
    });
  }
};

// Delete a pose detection record
export const deletePoseDetection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const poseDetection = await PoseDetection.findOne({
      _id: id,
      createdBy: userId
    });

    if (!poseDetection) {
      return res.status(404).json({
        success: false,
        message: 'Pose detection record not found'
      });
    }

    await PoseDetection.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Pose detection record deleted successfully',
      data: {
        deletedRecord: {
          id: poseDetection._id,
          scanDate: poseDetection.scanDate
        }
      }
    });
  } catch (error) {
    console.error('Delete pose detection error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid pose detection ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting pose detection record'
    });
  }
};

// Get pose detection statistics for a patient
export const getPoseDetectionStats = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user._id;

    // Verify patient exists and belongs to the user
    const patient = await Patient.findOne({
      _id: patientId,
      createdBy: userId
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found or you do not have permission to access this patient'
      });
    }

    const stats = await PoseDetection.aggregate([
      { $match: { patientId: patient._id } },
      {
        $group: {
          _id: null,
          totalScans: { $sum: 1 },
          averageAccuracy: { $avg: '$summary.bestPoseAccuracy' },
          highestAccuracy: { $max: '$summary.bestPoseAccuracy' },
          lowestAccuracy: { $min: '$summary.bestPoseAccuracy' },
          firstScan: { $min: '$scanDate' },
          lastScan: { $max: '$scanDate' }
        }
      }
    ]);

    const recentScans = await PoseDetection.find({ patientId })
      .sort({ scanDate: -1 })
      .limit(5)
      .select('summary scanDate overallAssessment');

    res.json({
      success: true,
      message: 'Pose detection statistics retrieved successfully',
      data: {
        patient: {
          id: patient._id,
          fullName: patient.fullName
        },
        statistics: stats[0] || {
          totalScans: 0,
          averageAccuracy: 0,
          highestAccuracy: 0,
          lowestAccuracy: 0,
          firstScan: null,
          lastScan: null
        },
        recentScans
      }
    });
  } catch (error) {
    console.error('Get pose detection stats error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving pose detection statistics'
    });
  }
};
