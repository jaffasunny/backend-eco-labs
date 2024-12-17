import mongoose from 'mongoose';

export interface IBid extends Document {
  _id?: mongoose.Schema.Types.ObjectId;
  amount: number;
  bidder: mongoose.Schema.Types.ObjectId;
  ticket: mongoose.Schema.Types.ObjectId;
  status: string;
}
