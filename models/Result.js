import mongoose, { Schema } from 'mongoose';

const ResultSubjectSchema = new Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    name: { type: String, default: '' },
    credits: { type: Number, default: 0 },
    score: { type: String, default: '' },
  },
  { _id: false }
);

const ResultSchema = new Schema(
  {
    courseCode: { type: String, required: true, uppercase: true, trim: true },
    rollNumber: { type: String, required: true, uppercase: true, trim: true },
    semester: { type: Number, required: true, min: 1, max: 16 },
    examYear: { type: Number, required: true },
    studentName: { type: String, required: true, trim: true },
    fatherName: { type: String, default: '', trim: true },
    totalCreditPoints: { type: String, default: '' },
    sgpa: { type: String, default: '' },
    remarks: { type: String, default: '' },
    status: { type: String, default: 'review' },
    visibility: { type: String, enum: ['private', 'public'], default: 'private' },
    publishedAt: { type: Date, default: null },
    subjects: { type: [ResultSubjectSchema], default: [] },
  },
  { timestamps: true }
);

ResultSchema.index({ courseCode: 1, rollNumber: 1, semester: 1, examYear: 1 }, { unique: true });

const Result = mongoose.models.Result || mongoose.model('Result', ResultSchema);

export default Result;