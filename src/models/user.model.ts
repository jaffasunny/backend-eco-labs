import mongoose, { PaginateModel, Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import { ApiError } from '../utils/ApiError.js';
import jwt from 'jsonwebtoken';
import { IUser } from '../types/userTypes/index.js';
import { MODELS, RESEARCHER_STATUS, ROLES } from './../constants.js';
import aggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { validateRoleAndUniversity } from '../utils/utils.js';

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required!!'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required!!'],
      unique: true,
      trim: true,
    },
    // hashed and salted password
    password: {
      type: String,
      required: [true, 'Password is required!!'],
    },
    roles: {
      type: String,
      enum: [ROLES.ADMIN, ROLES.LANDOWNER, ROLES.RESEARCHER, ROLES.UNIVERSITY],
      required: true,
    },
    phone: {
      type: String,
      default: '',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    advisor: {
      type: String,
    },
    universityName: {
      type: String,
    },
    contactName: {
      type: String,
    },
    university: { type: mongoose.Schema.Types.ObjectId, ref: MODELS.USERS },
    status: {
      type: String,
      enum: [
        RESEARCHER_STATUS.PENDING,
        RESEARCHER_STATUS.APPROVED,
        RESEARCHER_STATUS.REJECTED,
      ],
      default: RESEARCHER_STATUS.PENDING,
    },
    note: {
      type: String,
    },
    noteUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: MODELS.USERS,
    },
    refreshTokens: [{ token: String }],
  },
  {
    timestamps: true,
  }
);

userSchema.pre<IUser>('save', async function (next) {
  try {
    validateRoleAndUniversity(this.roles, this.university);

    const saltRounds = Number(process.env.SALT_ROUNDS) || 10;

    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, saltRounds);

    // Only check for note updates if this is an update operation (not a new document) and user is landowner
    if (!(this as any).isNew && (this as any).isModified('note') && this.roles === ROLES.LANDOWNER) {
      // Get the user from the request context
      // This will be set by the controller before calling save()
      const user = (this as any).__user;
      
      if (!user || user.roles !== 'super-admin') {
        return next(new Error('Only admins can update landowner notes'));
      }
      
      // Set the noteUpdatedBy field
      this.noteUpdatedBy = user._id;
    }

    next();
  } catch (error) {
    console.log('Error in user pre save', error);
    throw new ApiError(500, `User creation failed! ${error}`);
  }
});

userSchema.pre<IUser>('updateOne', async function (next) {
  try {
    const update = this.getUpdate();

    if (update.roles || update.university) {
      validateRoleAndUniversity(update.roles, update.university); // Call the helper
    }

    if (update && update.password) {
      const saltRounds = Number(process.env.SALT_ROUNDS) || 10;

      // Hash the password before updating
      update.password = await bcrypt.hash(update.password, saltRounds);
    }

    // Check if note is being updated for landowner users
    if (update && (update as any).note !== undefined) {
      const user = (this as any).__user;
      
      if (!user || user.roles !== 'super-admin') {
        return next(new Error('Only admins can update landowner notes'));
      }
      
      // Add noteUpdatedBy to the update
      (update as any).noteUpdatedBy = user._id;
    }

    next();
  } catch (error) {
    console.log('Error in user pre update', error);
    next(new ApiError(500, `User update failed! ${error}`));
  }
});

userSchema.methods.isPasswordCorrect = async function (
  this: IUser,
  password: string
) {
  let correct = await bcrypt.compare(password, this.password);

  return correct;
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      name: this.name,
    },
    process.env.ACCESS_TOKEN_SECRET as string,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};

userSchema.set('toJSON', {
  transform: (doc, ret) => {
    // Remove sensitive fields like password and tokens from the response
    delete ret.password;
    delete ret.refreshTokens;

    // Conditionally include `isApproved`
    if (ret.roles !== ROLES.RESEARCHER) {
      delete ret.isApproved;
    }

    return ret;
  },
});

userSchema.set('toObject', {
  transform: (doc, ret) => {
    // Remove sensitive fields like password and tokens from the response
    delete ret.password;
    delete ret.refreshTokens;

    // Conditionally include `isApproved`
    if (ret.roles !== ROLES.RESEARCHER) {
      delete ret.isApproved;
    }

    return ret;
  },
});
userSchema.index({ roles: 1, status: 1 }); // Compound index for roles and status
userSchema.index({ university: 1, isArchived: 1 }); // Compound index for university and isArchived

userSchema.plugin(aggregatePaginate);

export const User = mongoose.model<IUser, PaginateModel<IUser>>(
  MODELS.USERS,
  userSchema
);
