import mongoose from 'mongoose';

export interface IReport {
  landAssessmentReport: {
    url: string;
    name: string;
  }[];
  property: mongoose.Schema.Types.ObjectId | string;
  researchers: mongoose.Schema.Types.ObjectId[] | string;
  status: string;
}

export interface IPReport {
  landAssessmentReport: {
    url: string;
    name: string;
  }[];
  property: mongoose.Schema.Types.ObjectId | string;
  researchers: mongoose.Schema.Types.ObjectId[] | string;
}
