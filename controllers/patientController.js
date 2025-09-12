import Patient from '../models/Patient.js';



export const createPatient = async (req, res) => {
  try {
    const { fullName, gender, dateOfBirth } = req.body;
    const userId = req.user._id; 

    const existingPatient = await Patient.findOne({
      fullName: { $regex: new RegExp(`^${fullName}$`, 'i') }, 
      createdBy: userId
    });

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: 'A patient with this name already exists in your records'
      });
    }


    const patient = await Patient.create({
      fullName,
      gender,
      dateOfBirth: new Date(dateOfBirth),
      createdBy: userId
    });

 
    await patient.populate('createdBy', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Patient record created successfully',
      data: {
        patient
      }
    });
  } catch (error) {
    console.error('Create patient error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while creating patient record'
    });
  }
};


export const getPatients = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10, search } = req.query;

    const query = { createdBy: userId };

    if (search) {
      query.fullName = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Specify fields to return, including lastScan
    const patients = await Patient.find(query)
      .select('fullName gender dateOfBirth lastScan createdBy createdAt updatedAt')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Patient.countDocuments(query);

    res.json({
      success: true,
      message: 'Patients retrieved successfully',
      data: {
        patients,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalPatients: total,
          hasNextPage: skip + patients.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving patients'
    });
  }
};



export const getPatient = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const patient = await Patient.findOne({
      _id: id,
      createdBy: userId
    })
    .select('fullName gender dateOfBirth lastScan createdBy createdAt updatedAt')  // explicitly select fields including lastScan
    .populate('createdBy', 'firstName lastName email');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found'
      });
    }

    res.json({
      success: true,
      message: 'Patient retrieved successfully',
      data: {
        patient
      }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while retrieving patient'
    });
  }
};



export const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, gender, dateOfBirth } = req.body;
    const userId = req.user._id;

    const patient = await Patient.findOne({
      _id: id,
      createdBy: userId
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found'
      });
    }


    if (fullName && fullName !== patient.fullName) {
      const existingPatient = await Patient.findOne({
        fullName: { $regex: new RegExp(`^${fullName}$`, 'i') },
        createdBy: userId,
        _id: { $ne: id }
      });

      if (existingPatient) {
        return res.status(400).json({
          success: false,
          message: 'A patient with this name already exists in your records'
        });
      }
    }

   
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (gender) updateData.gender = gender;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    
    updateData.updatedAt = new Date();

    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Patient record updated successfully',
      data: {
        patient: updatedPatient
      }
    });
  } catch (error) {
    console.error('Update patient error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format'
      });
    }

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while updating patient record'
    });
  }
};


export const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;


    const patient = await Patient.findOne({
      _id: id,
      createdBy: userId
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient record not found'
      });
    }

    // Delete the patient
    await Patient.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Patient record deleted successfully',
      data: {
        deletedPatient: {
          id: patient._id,
          fullName: patient.fullName
        }
      }
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid patient ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error while deleting patient record'
    });
  }
};


export const searchPatients = async (req, res) => {
  try {
    const { q } = req.query; 
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

   
    const searchQuery = q.trim();
    const regexPattern = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    
    const query = {
      createdBy: userId,
      fullName: regexPattern
    };

    
    const skip = (parseInt(page) - 1) * parseInt(limit);


  const patients = await Patient.find(query)
  .select('fullName gender dateOfBirth lastScan createdBy createdAt updatedAt') 
  .populate('createdBy', 'firstName lastName email')
  .sort({ 
 
    fullName: 1,
    createdAt: -1 
  })
  .skip(skip)
  .limit(parseInt(limit));


    // Get total count for pagination
    const total = await Patient.countDocuments(query);

    // Calculate search relevance scores
    const patientsWithRelevance = patients.map(patient => {
      const patientName = patient.fullName.toLowerCase();
      const searchTerm = searchQuery.toLowerCase();
      
      let relevanceScore = 0;
      
      // Exact match gets highest score
      if (patientName === searchTerm) {
        relevanceScore = 100;
      }
      // Starts with search term gets high score
      else if (patientName.startsWith(searchTerm)) {
        relevanceScore = 80;
      }
      // Contains search term gets medium score
      else if (patientName.includes(searchTerm)) {
        relevanceScore = 60;
      }
      // Word boundary match gets lower score
      else if (new RegExp(`\\b${searchTerm}`, 'i').test(patientName)) {
        relevanceScore = 40;
      }

      return {
        ...patient.toObject(),
        relevanceScore
      };
    });

    // Sort by relevance score (highest first)
    patientsWithRelevance.sort((a, b) => b.relevanceScore - a.relevanceScore);

    res.json({
      success: true,
      message: 'Patient search completed successfully',
      data: {
        patients: patientsWithRelevance,
        searchQuery: searchQuery,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalResults: total,
          hasNextPage: skip + patients.length < total,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Search patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while searching patients'
    });
  }
};

