import DataUriParser from 'datauri/parser';
import path from 'path';

export type File = {
  originalname: string;
  buffer: Buffer | string; // Assuming content can be either Buffer or string
};

const getDataUri = (file: File) => {
  const parser = new DataUriParser();

  const extName = path.extname(file.originalname).toString();

  return parser.format(extName, file.buffer);
};

export default getDataUri;
