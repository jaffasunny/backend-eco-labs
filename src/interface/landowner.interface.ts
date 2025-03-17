import { IUser } from '../types/userTypes/index.js';
import { IPagination } from './index.interface.js';
import { IProperty } from './property.interface.js';

export interface IAddLandownerParams extends IUser, IProperty {}

export interface IlandownerAggregatePaginationServiceParams
  extends IPagination {
  isArchived: boolean | null;
  assigned: boolean | null;
}

export interface IUniversityAggregatePaginationServiceParams
  extends IPagination {
  isArchived: boolean | null;
  assigned: boolean | null;
  uniId: string | null;
}

export interface IlandownerPropertyAggregatePaginationServiceParams
  extends IPagination {
  assigned: boolean | null;
  userId: string;
}

export interface IlandownerPropertyBidsAggregatePaginationServiceParams
  extends IPagination {
  propertyId: string;
  userId?: string;
}
