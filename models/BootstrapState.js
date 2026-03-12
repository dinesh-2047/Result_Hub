import mongoose, { Schema } from 'mongoose';

const BootstrapStateSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const BootstrapState = mongoose.models.BootstrapState || mongoose.model('BootstrapState', BootstrapStateSchema);

export default BootstrapState;