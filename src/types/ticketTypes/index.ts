import mongoose, { ObjectId } from 'mongoose';

export interface ITicket extends Document {
  _id: ObjectId;
  title: string;
  tags: string[];
  priority: string;
  duration: string;
  developer?: mongoose.Schema.Types.ObjectId;
  project: mongoose.Schema.Types.ObjectId;
  applied?: mongoose.Schema.Types.ObjectId;
  bids?: mongoose.Schema.Types.ObjectId[];
  description?: string;
  minimumBid: number;
  maximumBid: number;
}
// description?: object;

export interface ITicketSkill extends Document {
  skillsTitle: string[];
  skillsCategory: string;
}
