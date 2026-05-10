import mongoose from 'mongoose';

const webhookSchema = new mongoose.Schema({
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
  url: String,
  events: [String],
  secretHash: String,
  active: { type: Boolean, default: true },
  lastDeliveryStatus: String
}, { timestamps: true });

export const Webhook = mongoose.model('Webhook', webhookSchema);

