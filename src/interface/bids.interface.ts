import mongoose from 'mongoose';
import { FilesType } from '../types/index.js';

export interface IBids {
  status: string;
  description: string;
  files: FilesType[];
  property: mongoose.Schema.Types.ObjectId;
  researcher: mongoose.Schema.Types.ObjectId;
}
