import { IUser } from '../types/userTypes/index.js';
import { IPagination } from './index.interface.js';
import { IProperty } from './property.interface.js';
import { IPReport } from './report.interface.js';

export interface IAddUniversityParams extends IUser, IProperty {
  note: string;
}

export interface IUniversityAggregatePaginationServiceParams
  extends IPagination {
  isArchived: boolean | null;
  assigned: boolean | null;
}

export interface IUniversityReportAggregatePaginationServiceParams
  extends IPagination {
  assigned: boolean | null;
  userId?: string;
}

export interface IUniversityReportBidsAggregatePaginationServiceParams
  extends IPagination {
  reportId: string;
  userId?: string;
}

export interface IUpdateUniversity extends IProperty, IPReport {
  note: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  contactName: string;
}
