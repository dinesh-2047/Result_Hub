import mongoose, { Schema } from 'mongoose';

const UserSchema = new Schema(
  {
    role: { type: String, enum: ['admin', 'student'], required: true },
    name: { type: String, default: '' },
    email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
    passwordHash: { type: String, required: true },
    courseCode: { type: String, uppercase: true, trim: true, default: '' },
    rollNumber: { type: String, uppercase: true, trim: true, unique: true, sparse: true },
    currentSemester: { type: Number, min: 1, max: 16, default: 1 },
    parentEmail: { type: String, lowercase: true, trim: true, default: '' },
    parentPhone: { type: String, trim: true, default: '' },
    profileCompleted: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const existingUserModel = mongoose.models.User;
const User = existingUserModel?.schema?.path('currentSemester')
  ? existingUserModel
  : (existingUserModel ? mongoose.deleteModel('User') : null, mongoose.model('User', UserSchema));

export default User;