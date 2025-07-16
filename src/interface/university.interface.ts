import { IUser } from '../types/userTypes/index.js';
import { IPagination } from './index.interface.js';
import { IProperty } from './property.interface.js';
import { IPReport } from './report.interface.js';

export interface IAddUniversityParams extends Omit<IUser, 'note' | 'noteUpdatedBy'>, Omit<IProperty, 'note' | 'noteUpdatedBy'> {
  // Add back the note properties with more specific names to avoid conflicts
  userNote?: string;
  propertyNote?: string;
  userNoteUpdatedBy?: string;
  propertyNoteUpdatedBy?: string;
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

export interface IUpdateUniversity extends Omit<IProperty, 'note' | 'noteUpdatedBy'>, Omit<IPReport, 'note' | 'noteUpdatedBy'>, Omit<IUser, 'note' | 'noteUpdatedBy'> {
  // Add back the note properties with more specific names to avoid conflicts
  userNote?: string;
  propertyNote?: string;
  reportNote?: string;
  userNoteUpdatedBy?: string;
  propertyNoteUpdatedBy?: string;
  reportNoteUpdatedBy?: string;
}
