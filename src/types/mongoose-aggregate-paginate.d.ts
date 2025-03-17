// mongoose-aggregate-paginate.d.ts
import mongoose from 'mongoose';
import {
  AggregatePaginateModel,
  AggregatePaginateOptions,
  AggregatePaginateResult,
} from 'mongoose-aggregate-paginate-v2';

declare module 'mongoose' {
  interface PaginateModel<T> extends mongoose.Model<T> {
    aggregatePaginate(
      aggregation: mongoose.Aggregate<any>,
      options?: AggregatePaginateOptions
    ): Promise<AggregatePaginateResult<any>>;
  }
}
