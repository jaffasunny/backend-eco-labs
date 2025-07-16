import { IUser } from '../types/userTypes/index.js';
import { IPagination } from './index.interface.js';
import { IProperty } from './property.interface.js';

// Create a combined interface that avoids conflicts by being more specific
export interface IAddLandownerParams extends Omit<IUser, 'note' | 'noteUpdatedBy'>, Omit<IProperty, 'note' | 'noteUpdatedBy'> {
  // Add back the note properties with more specific names to avoid conflicts
  userNote?: string;
  propertyNote?: string;
  userNoteUpdatedBy?: string;
  propertyNoteUpdatedBy?: string;
}

export interface IlandownerAggregatePaginationServiceParams
  extends IPagination {
  isArchived: boolean | null;
  assigned: boolean | null;
  roles: string;
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
  roles: string;
}

export interface IlandownerPropertyBidsAggregatePaginationServiceParams
  extends IPagination {
  propertyId: string;
  userId?: string;
  roles: string;
}
