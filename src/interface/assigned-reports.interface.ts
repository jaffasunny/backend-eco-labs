import mongoose from 'mongoose';

export interface IAssignResearcherReport {
  report: mongoose.Schema.Types.ObjectId | string;
  researchers: mongoose.Schema.Types.ObjectId[] | string;
}
