import mongoose from 'mongoose';
import { IComment } from '../commentTypes';
import { IUser } from '../userTypes';

export interface IPost extends Document {
  title: string;
  description: string;
  image: string;
  authorId: IUser;
  likes: string[];
  comments: IComment[];
  createdAt: Date;
  updatedAt: Date;
}
