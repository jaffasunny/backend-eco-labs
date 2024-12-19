import mongoose from 'mongoose';

export interface IProperty {
  propertyName: string;
  propertyLocation: string;
  propertySize: string;
  landAssessmentReport: {
    url: string;
    public_id: string;
  }[];
  landowner: mongoose.Schema.Types.ObjectId;
}
