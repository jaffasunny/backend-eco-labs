import mongoose from 'mongoose';
import { IReport } from './report.interface.js';
import { IUser } from '../types/userTypes/index.js';
import { FilesType } from '../types/index.js';

export interface IProperty {
  propertyName: string;
  propertyLocation: string;
  startDate: string;
  note: string;
  propertySize: string | undefined;
  landowner: mongoose.Schema.Types.ObjectId;
  assignedResearchers: mongoose.Schema.Types.ObjectId[];
  archived: boolean;
  noteUpdatedBy?: mongoose.Schema.Types.ObjectId;
}

export interface IReports {
  name: string;
  description: string;
  files: FilesType[];
  property: mongoose.Schema.Types.ObjectId;
  researcher: mongoose.Schema.Types.ObjectId;
  archived: boolean;
}

export interface IUpdateLandowner extends IProperty {
  // Extend only IProperty to avoid the 'note' property conflict
  // Add specific IUser properties that don't conflict
  name: string;
  email: string;
  phone: string;
  role: string;
  password: string;
}

export interface IAssignReport extends IReport {}

export interface IReportsInterface extends IReports, Document {
  isNew: boolean; // Add Mongoose's isNew property
}
