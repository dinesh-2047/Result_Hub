import mongoose, { Schema } from 'mongoose';

const SubjectSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    credits: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Subject = mongoose.models.Subject || mongoose.model('Subject', SubjectSchema);

export default Subject;