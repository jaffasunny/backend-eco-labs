import mongoose from 'mongoose';
import { IPReport, IReport } from './report.interface.js';
import { IUser } from '../types/userTypes/index.js';

export interface IProperty {
  propertyName: string;
  propertyLocation: string;
  propertySize: string | undefined;
  landowner: mongoose.Schema.Types.ObjectId;
}

export interface IUpdateLandowner extends IProperty, IPReport, IUser {}

export interface IAssignReport extends IReport {}
