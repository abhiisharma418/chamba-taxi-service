import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['customer', 'driver'], required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  messages: [{ senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, message: String, sentAt: Date }]
}, { timestamps: true });

export const Ticket = mongoose.model('Ticket', ticketSchema);