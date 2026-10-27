import mongoose from 'mongoose';
import { User } from '../models/User.model.js';

export class UserRepository {
  async findById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await User.findById(id).lean();
    if (!doc) return null;
    doc.id = doc._id.toString();
    return doc;
  }

  async findByEmail(email) {
    if (!email) return null;
    const doc = await User.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!doc) return null;
    doc.id = doc._id.toString();
    return doc;
  }

  async create(data) {
    const created = await User.create({
      name: data.name,
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      role: data.role || 'ANALYST',
      isActive: data.isActive ?? true,
    });
    const doc = created.toJSON();
    doc.id = created._id.toString();
    return doc;
  }

  async updateLastLogin(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await User.findByIdAndUpdate(id, { $set: { lastLoginAt: new Date() } });
  }
}

export const userRepository = new UserRepository();
