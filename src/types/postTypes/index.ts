import { IComment } from '../commentTypes/index.js';
import { IUser } from '../userTypes/index.js';

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
