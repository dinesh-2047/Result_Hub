import mongoose, { Schema } from 'mongoose';

const NoticeSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true },
    type: { type: String, enum: ['general', 'result'], default: 'general' },
    audience: { type: String, enum: ['public', 'students'], default: 'public' },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    isPinned: { type: Boolean, default: false },
    relatedCourseCode: { type: String, uppercase: true, trim: true, default: '' },
    actionUrl: { type: String, trim: true, default: '' },
    actionLabel: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

const Notice = mongoose.models.Notice || mongoose.model('Notice', NoticeSchema);

export default Notice;