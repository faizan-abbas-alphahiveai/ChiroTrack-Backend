import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  updatePassword
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();


router.use(authenticate);


router.get('/', getUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.patch('/:id/password', updatePassword);

export default router;
