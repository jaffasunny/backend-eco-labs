import mongoose from 'mongoose';
import { IUser } from '../types/userTypes';
import { IProperty } from './property.interface';

export interface IAddLandownerParams extends IUser, IProperty {}
