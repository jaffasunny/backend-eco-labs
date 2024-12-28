import mongoose from 'mongoose';

export interface IBids {
  status: string;
  property: mongoose.Schema.Types.ObjectId;
  researcher: mongoose.Schema.Types.ObjectId;
}
