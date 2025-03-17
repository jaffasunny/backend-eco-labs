import multer, { StorageEngine } from 'multer';
import cloudinary from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: {
    folder: 'raw-formats',
    allowed_formats: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif'],
    resource_type: 'auto',
  } as {
    folder: string;
    allowed_formats: string[];
    resource_type: string;
  },
}) as StorageEngine;

const upload = multer({ storage });

export default upload;
