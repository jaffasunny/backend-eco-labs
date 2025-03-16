import mongoose from 'mongoose';

export interface IMessage {
  sender: mongoose.Schema.Types.ObjectId;
  content: string;
  chat: mongoose.Schema.Types.ObjectId;
  execPopulate(): any;
}
