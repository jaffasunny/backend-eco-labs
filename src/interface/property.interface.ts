import mongoose from 'mongoose';

export interface IProperty {
  propertyName: string;
  propertyLocation: string;
  propertySize: string;
  landAssessmentReport: string;
  landowner: mongoose.Schema.Types.ObjectId;
}
