import mongoose from 'mongoose';

export interface IBids {
  status: string;
  description: string;
  report: mongoose.Schema.Types.ObjectId;
  researcher: mongoose.Schema.Types.ObjectId;
}
