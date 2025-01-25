import mongoose from 'mongoose';
import { IReport } from './report.interface.js';
import { IUser } from '../types/userTypes/index.js';
import { FilesType } from '../types/index.js';

export interface IProperty {
  propertyName: string;
  propertyLocation: string;
  propertySize: string | undefined;
  landowner: mongoose.Schema.Types.ObjectId;
  assignedResearchers: mongoose.Schema.Types.ObjectId[];
}

export interface IPropertyFiles {
  files: FilesType[];
  property: mongoose.Schema.Types.ObjectId;
}

export interface IUpdateLandowner extends IProperty, IUser {}

export interface IAssignReport extends IReport {}
