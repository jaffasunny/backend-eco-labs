import { PaginateModel, FilterQuery, Model } from 'mongoose';

export const findModel = async <T>(
  model: Model<T>| PaginateModel<T>,
  condition: FilterQuery<T> = {}
): Promise<T[]> => {
  const result = await model.find(condition).exec();
  return result;
};
