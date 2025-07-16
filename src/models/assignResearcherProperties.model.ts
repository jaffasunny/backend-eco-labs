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
    researchers: [{
      researcher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: MODELS.USERS,
      },
      assignDate: {
        type: String,
        required: true,
      },
    }],
  },
  {
    timestamps: true,
  }
);
assignPropertyProperties.index({ property: 1, 'researchers.researcher': 1 }); // Updated compound index
assignPropertyProperties.plugin(aggregatePaginate);

export const AssignResearcherProperty = mongoose.model<
  IAssignResearcherProperty,
  PaginateModel<IAssignResearcherProperty>
>(MODELS.ASSIGNED_RESEARCH_PROPERTIES, assignPropertyProperties);
