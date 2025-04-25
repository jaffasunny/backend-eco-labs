import { TSort } from '../types/index.js';

export interface IPagination {
  page: number;
  limit: number;
  search: string;
  sort?: TSort;
}
