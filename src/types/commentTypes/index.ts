import mongoose from 'mongoose';

export interface IComment extends Document {
  authorId: mongoose.Schema.Types.ObjectId;
  content: string;
  likes: mongoose.Schema.Types.ObjectId;
  replies: mongoose.Schema.Types.ObjectId;
}
