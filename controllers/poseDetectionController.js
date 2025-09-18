import PoseDetection from '../models/PoseDetection.js';
import Patient from '../models/Patient.js';

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


    const poseDetection = await PoseDetection.create({
      patientId,
      createdBy: userId,
      summary,
      bodyDetection,
      proportions,
      joints,
      notes
    });

    await Patient.findByIdAndUpdate(patientId, {
      lastScan: new Date()
    });

  
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


export const getPoseDetectionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

   
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



export const getPoseDetectionStats = async (req, res) => {
  try {
    const { patientId } = req.params;
    const userId = req.user._id;


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

// Get pose detection data for a specific patient and date
export const getPoseDetectionByDate = async (req, res) => {
  try {
    const { patientId, date } = req.params;
    const userId = req.user._id;

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format'
      });
    }

    // Verify patient exists and user has permission
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

    // Create date range for the specific date (start and end of day)
    const startDate = new Date(date + 'T00:00:00.000Z');
    const endDate = new Date(date + 'T23:59:59.999Z');

    // Find pose detection data for the specific date
    const poseDetection = await PoseDetection.findOne({
      patientId,
      createdBy: userId,
      scanDate: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate([
      { path: 'patientId', select: 'fullName gender dateOfBirth' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ]);

    if (!poseDetection) {
      return res.status(404).json({
        success: false,
        message: `No pose detection data found for patient on ${date}`,
        data: {
          patient: {
            id: patient._id,
            fullName: patient.fullName
          },
          requestedDate: date,
          poseDetection: null
        }
      });
    }

    res.json({
      success: true,
      message: `Pose detection data retrieved successfully for ${date}`,
      data: {
        patient: {
          id: patient._id,
          fullName: patient.fullName
        },
        requestedDate: date,
        poseDetection
      }
    });
  } catch (error) {
    console.error('Get pose detection by date error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving pose detection data by date'
    });
  }
};

// Get pose detection data for a specific patient within a date range
export const getPoseDetectionByDateRange = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;
    const userId = req.user._id;

    // Validate date formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate are required in YYYY-MM-DD format'
      });
    }

    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Please use YYYY-MM-DD format'
      });
    }

    // Verify patient exists and user has permission
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

    // Create date range
    const start = new Date(startDate + 'T00:00:00.000Z');
    const end = new Date(endDate + 'T23:59:59.999Z');

    if (start > end) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before or equal to end date'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Find pose detection data within the date range
    const poseDetections = await PoseDetection.find({
      patientId,
      createdBy: userId,
      scanDate: {
        $gte: start,
        $lte: end
      }
    })
    .populate([
      { path: 'patientId', select: 'fullName gender dateOfBirth' },
      { path: 'createdBy', select: 'firstName lastName email' }
    ])
    .sort({ scanDate: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await PoseDetection.countDocuments({
      patientId,
      createdBy: userId,
      scanDate: {
        $gte: start,
        $lte: end
      }
    });

    res.json({
      success: true,
      message: `Pose detection data retrieved successfully for date range ${startDate} to ${endDate}`,
      data: {
        patient: {
          id: patient._id,
          fullName: patient.fullName
        },
        dateRange: {
          startDate,
          endDate
        },
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
    console.error('Get pose detection by date range error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving pose detection data by date range'
    });
  }
};
