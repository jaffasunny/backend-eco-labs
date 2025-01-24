import { ROLES } from '../constants.js';
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import {
  addPropertyValidation,
  assignResearcherPropertyValidation,
  deletePropertyValidation,
  propertyFilesValidation,
} from '../utils/validations/propertyValidations.js';
import {
  addProperty,
  assignResearcherProperty,
  deleteProperty,
  getProperty,
  paginatedAssignedResearcherProperties,
  paginatedAssignedUniversityProperties,
  removeFiles,
} from '../controllers/property.controller.js';
import upload from '../middlewares/multer.js';
import { mapFilesToBody } from '../middlewares/index.middleware.js';

const router = Router();

router
  .route('/')
  .post(
    upload.array('files', 5),
    mapFilesToBody,
    addPropertyValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    addProperty
  );

router
  .route('/:id')
  .delete(
    deletePropertyValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.LANDOWNER]),
    deleteProperty
  )
  .get(
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.RESEARCHER]),
    getProperty
  );

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
  .route('/assignedResearcherProperties')
  .get(
    authMiddleware,
    roleCheck([ROLES.ADMIN, ROLES.RESEARCHER]),
    paginatedAssignedResearcherProperties
  );

router
  .route('/assignedResearcherUniversities')
  .get(
    authMiddleware,
    roleCheck([ROLES.ADMIN, ROLES.RESEARCHER]),
    paginatedAssignedUniversityProperties
  );

export default router;
