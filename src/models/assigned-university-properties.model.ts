import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { MODELS } from '../constants.js';
import { IAssignUniversityProperties } from '../interface/assigned-university-properties.interface.js';

const assignUniversityProperties = new Schema<IAssignUniversityProperties>(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.PROPERTIES,
    },
    universities: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.USERS }],
  },
  {
    timestamps: true,
  }
);

assignUniversityProperties.plugin(aggregatePaginate);

export const AssignUniversityProperty = mongoose.model<
  IAssignUniversityProperties,
  PaginateModel<IAssignUniversityProperties>
>(MODELS.ASSIGNED_UNIVERSITY_PROPERTIES, assignUniversityProperties);
