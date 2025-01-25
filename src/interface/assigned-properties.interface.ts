import mongoose from 'mongoose';

export interface IAssignResearcherProperty {
  property: mongoose.Schema.Types.ObjectId | string;
  researchers: mongoose.Schema.Types.ObjectId[] | string;
}
