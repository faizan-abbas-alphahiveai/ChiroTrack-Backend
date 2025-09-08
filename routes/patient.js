import express from 'express';
import {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
  searchPatients
} from '../controllers/patientController.js';
import { authenticate } from '../middleware/auth.js';
import { validatePatientCreation, validatePatientUpdate } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);


router.post('/', validatePatientCreation, createPatient);
router.get('/search', searchPatients);
router.get('/', getPatients);
router.get('/:id', getPatient);
router.put('/:id', validatePatientUpdate, updatePatient);
router.delete('/:id', deletePatient);

export default router;
