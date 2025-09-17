import express from 'express';
import {
  createPoseDetection,
  getPoseDetectionsByPatient,
  getPoseDetection,
  getAllPoseDetections,
  updatePoseDetection,
  deletePoseDetection,
  getPoseDetectionStats
} from '../controllers/poseDetectionController.js';
import { authenticate } from '../middleware/auth.js';
import { validatePoseDetectionCreation, validatePoseDetectionUpdate } from '../middleware/validation.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validatePoseDetectionCreation, createPoseDetection);
router.get('/', getAllPoseDetections);
router.get('/stats/:patientId', getPoseDetectionStats);
router.get('/patient/:patientId', getPoseDetectionsByPatient);
router.get('/:id', getPoseDetection);
router.put('/:id', validatePoseDetectionUpdate, updatePoseDetection);
router.delete('/:id', deletePoseDetection);

export default router;
