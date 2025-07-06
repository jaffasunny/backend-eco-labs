import { ROLES } from './../constants.js';
import { Router } from 'express';
import {
  addLandowner,
  archiveLandowner,
  deleteLandowner,
  getSingleLandowner,
  paginatedLandownerData,
  updateLandowner,
  updateLandownerNote,
} from '../controllers/landowner.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  addLandownerValidation,
  archiveLandownerValidation,
  deleteLandownerValidation,
  getLandownerValidation,
  updateLandownerValidation,
  updateLandownerNoteValidation,
} from '../utils/validations/landownerValidations.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import landownerPropertyRouter from './landownerPropertyRoute/landowner.properties.route.js';
import upload from '../middlewares/multer.js';
import { mapFilesToBody } from '../middlewares/index.middleware.js';

const router = Router();

router
  .route('/')
  .get(authMiddleware, roleCheck(ROLES.LANDOWNER), paginatedLandownerData)
  .post(
    upload.array('files', 20),
    mapFilesToBody,
    addLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    addLandowner
  );

router.use('/properties', landownerPropertyRouter);

router
  .route('/:id')
  .get(
    getLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.RESEARCHER, ROLES.UNIVERSITY]),
    getSingleLandowner
  )
  .put(
    updateLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    updateLandowner
  )
  .delete(
    deleteLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    deleteLandowner
  );

router
  .route('/archive/:id')
  .patch(
    archiveLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    archiveLandowner
  );

router
  .route('/:id/note')
  .patch(
    updateLandownerNoteValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.ADMIN]),
    updateLandownerNote
  );

export default router;
