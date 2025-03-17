import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { PaginateModel, Schema } from 'mongoose';
import { MODELS } from '../constants.js';
import { IAssignResearcherProperty } from '../interface/assigned-properties.interface.js';

const assignPropertyProperties = new Schema<IAssignResearcherProperty>(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.PROPERTIES,
    },
    researchers: [{ type: mongoose.Schema.Types.ObjectId, ref: MODELS.USERS }],
  },
  {
    timestamps: true,
  }
);

assignPropertyProperties.plugin(aggregatePaginate);

export const AssignResearcherProperty = mongoose.model<
  IAssignResearcherProperty,
  PaginateModel<IAssignResearcherProperty>
>(MODELS.ASSIGNED_RESEARCH_PROPERTIES, assignPropertyProperties);
