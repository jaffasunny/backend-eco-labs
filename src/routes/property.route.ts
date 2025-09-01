import { ROLES } from '../constants.js';
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import {
  addPropertyValidation,
  assignedResearchersToPropertyValidation,
  assignResearcherPropertyValidation,
  deletePropertyValidation,
  propertyFilesValidation,
  researcherSubmittedReportsValidation,
  unnassignResearcherPropertyValidation,
  updatePropertyNoteValidation,
} from '../utils/validations/propertyValidations.js';
import {
  addProperty,
  assignedResearchersToProperty,
  assignResearcherProperty,
  deleteProperty,
  getProperty,
  paginatedAssignedResearcherProperties,
  paginatedProperties,
  removeFiles,
  researcherSubmittedReports,
  toggleArchiveProperty,
  transferProperty,
  updateProperty,
  unnassignResearcherProperty,
  updatePropertyNote,
} from '../controllers/property.controller.js';
import propertyBidsRouter from './propertyBids.route.js';
import upload from '../middlewares/multer.js';
import { mapFilesToBody } from '../middlewares/index.middleware.js';

const router = Router();

router
  .route('/')
  .get(
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.RESEARCHER]),
    paginatedProperties
  )
  .post(
    upload.array('files', 20),
    mapFilesToBody,
    addPropertyValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    addProperty
  );

router
  .route('/researchers/:researcherId/reports')
  .get(
    researcherSubmittedReportsValidation,
    validateRequest,
    authMiddleware,
    researcherSubmittedReports
  );

router
  .route('/researchers')
  .get(
    assignedResearchersToPropertyValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.ADMIN, ROLES.LANDOWNER]),
    assignedResearchersToProperty
  );

router
  .route('/assignedResearcherProperties')
  .get(
    authMiddleware,
    roleCheck([ROLES.ADMIN, ROLES.RESEARCHER, ROLES.UNIVERSITY]),
    paginatedAssignedResearcherProperties
  );

router.use('/bids', propertyBidsRouter);

router
  .route('/files/:fileId')
  .delete(
    propertyFilesValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    removeFiles
  );

router
  .route('/assignResearcherProperty')
  .post(
    assignResearcherPropertyValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.ADMIN]),
    assignResearcherProperty
  );

router
  .route('/unassignResearcherProperty')
  .patch(
    unnassignResearcherPropertyValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.ADMIN]),
    unnassignResearcherProperty
  );

router
  .route('/:id/toggle-archive')
  .post(authMiddleware, roleCheck([ROLES.ADMIN]), toggleArchiveProperty);

router
  .route('/:id')
  .get(
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.RESEARCHER, ROLES.UNIVERSITY]),
    getProperty
  )
  .patch(
    authMiddleware,
    upload.array('files', 20),
    mapFilesToBody,
    roleCheck([ROLES.LANDOWNER, ROLES.ADMIN]),
    updateProperty
  )
  .delete(
    deletePropertyValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.LANDOWNER]),
    deleteProperty
  );

router
  .route('/:id/transfer')
  .patch(authMiddleware, roleCheck([ROLES.ADMIN]), transferProperty);

router
  .route('/:id/note')
  .patch(
    updatePropertyNoteValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.ADMIN]),
    updatePropertyNote
  );

export default router;
