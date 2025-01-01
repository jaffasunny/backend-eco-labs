import mongoose from 'mongoose';

export interface IReport {
  landAssessmentReport: {
    url: string;
    name: string;
  }[];
  property: mongoose.Schema.Types.ObjectId;
  proposals: mongoose.Schema.Types.ObjectId;
}
