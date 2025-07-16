import mongoose from 'mongoose';

export interface IAssignResearcherProperty {
  property: mongoose.Schema.Types.ObjectId | string;
  researchers: Array<{
    researcher: mongoose.Schema.Types.ObjectId | string;
    assignDate: string;
  }>;
}
