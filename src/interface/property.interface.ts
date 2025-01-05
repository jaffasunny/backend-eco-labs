import mongoose from 'mongoose';
import { IReport } from './report.interface';
import { IUser } from '../types/userTypes';

export interface IProperty {
  propertyName: string;
  propertyLocation: string;
  propertySize: string | undefined;
  landowner: mongoose.Schema.Types.ObjectId;
}

export interface IUpdateLandowner extends IProperty, IReport, IUser {}

export interface IAssignReport extends IReport {}
