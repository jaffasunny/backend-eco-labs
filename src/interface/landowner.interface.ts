import { IUser } from '../types/userTypes';
import { IProperty } from './property.interface';

export interface IAddLandownerParams extends IUser, IProperty {}

export interface IlandownerAggregatePaginationServiceParams {
  page: number;
  limit: number;
  search: string;
  isArchived: boolean | null | string;
  assigned: boolean | null | string;
}
