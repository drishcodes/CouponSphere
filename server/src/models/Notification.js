import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  channel: { type: String, enum: ['email', 'sms', 'push', 'in_app'], default: 'in_app' },
  title: String,
  body: String,
  status: { type: String, enum: ['queued', 'sent', 'read', 'failed'], default: 'queued' },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true });

export const Notification = mongoose.model('Notification', notificationSchema);

