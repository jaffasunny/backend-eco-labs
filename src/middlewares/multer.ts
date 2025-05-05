import multer, { StorageEngine } from 'multer';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { ALLOWED_UPLOAD_FORMATS } from '../constants.js';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'raw-formats',
    allowed_formats: ALLOWED_UPLOAD_FORMATS,
    resource_type: 'auto',
  } as {
    folder: string;
    allowed_formats: string[];
    resource_type: string;
  },
}) as StorageEngine;

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  const fileExtension = file.mimetype.split('/')[1].toLowerCase();

  if (ALLOWED_UPLOAD_FORMATS.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${fileExtension}. Allowed formats: ${ALLOWED_UPLOAD_FORMATS.join(', ')}`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export default upload;
