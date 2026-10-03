import type { FilterQuery, UpdateQuery } from 'mongoose';
import { UserModel, type IUserDocument } from './user.model';

export const userRepository = {
  async findById(id: string, selectFields?: string): Promise<IUserDocument | null> {
    const query = UserModel.findById(id);
    if (selectFields) query.select(selectFields);
    return query.lean<IUserDocument>({ virtuals: false }).exec();
  },

  async findByEmail(email: string, selectFields?: string): Promise<IUserDocument | null> {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    if (selectFields) query.select(selectFields);
    return query.exec();
  },

  async findByGoogleId(googleId: string): Promise<IUserDocument | null> {
    return UserModel.findOne({ googleId }).exec();
  },

  async create(data: Partial<IUserDocument>): Promise<IUserDocument> {
    const user = new UserModel(data);
    return user.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<IUserDocument>
  ): Promise<IUserDocument | null> {
    return UserModel.findByIdAndUpdate(id, update, { new: true, runValidators: true }).exec();
  },

  async findAll(
    filter: FilterQuery<IUserDocument> = {},
    page = 1,
    limit = 20
  ): Promise<{ data: IUserDocument[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      UserModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      UserModel.countDocuments(filter).exec(),
    ]);
    return { data, total };
  },

  async exists(filter: FilterQuery<IUserDocument>): Promise<boolean> {
    const count = await UserModel.countDocuments(filter).exec();
    return count > 0;
  },

  async deleteById(id: string): Promise<boolean> {
    const result = await UserModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  },
};
