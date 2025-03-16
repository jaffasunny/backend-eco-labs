import mongoose from 'mongoose';

export interface IAssignUniversityProperties {
  property: mongoose.Schema.Types.ObjectId | string;
  universities: mongoose.Schema.Types.ObjectId[] | string;
}
