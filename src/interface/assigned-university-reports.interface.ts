import mongoose from 'mongoose';

export interface IAssignUniversityReport {
  report: mongoose.Schema.Types.ObjectId | string;
  universities: mongoose.Schema.Types.ObjectId[] | string;
}
