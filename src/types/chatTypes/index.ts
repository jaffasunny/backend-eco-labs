import mongoose from 'mongoose';

export interface IChat {
  chatName: string;
  isGroupChat: boolean;
  users: mongoose.Schema.Types.ObjectId[];
  groupAdmin: mongoose.Schema.Types.ObjectId;
  latestMessage: mongoose.Schema.Types.ObjectId;
}
