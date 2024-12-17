import mongoose from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  notifications: {
    body: string;
    title: string;
  }[];
  isViewed: boolean;
}
