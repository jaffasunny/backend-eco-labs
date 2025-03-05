import { Router } from 'express';
// routes import
import userRouter from '../routes/user.route.js';
import landownerRouter from '../routes/landowner.route.js';
import universityRouter from './universityRoute/university.route.js';
import researcherRouter from '../routes/researcher.route.js';
import reportsRouter from '../routes/report.route.js';
import propertyRouter from './property.route.js';

const router = Router();

// auth routes
router.use('/users', userRouter);

// landowner routes
router.use('/landowners', landownerRouter);

// university routes
router.use('/universities', universityRouter);

// researcher routes
router.use('/researchers', researcherRouter);

// reports routes
router.use('/reports', reportsRouter);

// properties routes
router.use('/properties', propertyRouter);

export default router;
