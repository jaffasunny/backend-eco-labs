import { IUser } from '../types/userTypes';
import { IPagination } from './index.interface';
import { IProperty } from './property.interface';

export interface IAddLandownerParams extends IUser, IProperty {}

export interface IlandownerAggregatePaginationServiceParams
  extends IPagination {
  isArchived: boolean | null;
  assigned: boolean | null;
}

export interface IlandownerReportAggregatePaginationServiceParams
  extends IPagination {
  assigned: boolean | null;
  userId?: string;
}

export interface IlandownerReportBidsAggregatePaginationServiceParams
  extends IPagination {
  reportId: string;
  userId?: string;
}
