import Joi from 'joi';
import { Ticket } from '../models/ticketModel.js';

export const createTicket = async (req, res) => {
  const schema = Joi.object({ subject: Joi.string().required(), description: Joi.string().required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const ticket = await Ticket.create({ ...value, creatorId: req.user.id, role: req.user.role });
  res.status(201).json({ success: true, data: ticket });
};

export const listMyTickets = async (req, res) => {
  const tickets = await Ticket.find({ creatorId: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: tickets });
};

export const addMessage = async (req, res) => {
  const schema = Joi.object({ message: Joi.string().required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const ticket = await Ticket.findOneAndUpdate({ _id: req.params.id }, { $push: { messages: { senderId: req.user.id, message: value.message, sentAt: new Date() } } }, { new: true });
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  res.json({ success: true, data: ticket });
};

export const adminListTickets = async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json({ success: true, data: tickets });
};

export const adminUpdateStatus = async (req, res) => {
  const schema = Joi.object({ status: Joi.string().valid('open', 'in-progress', 'resolved', 'closed').required() });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.message });
  const ticket = await Ticket.findByIdAndUpdate(req.params.id, { status: value.status }, { new: true });
  if (!ticket) return res.status(404).json({ success: false, message: 'Ticket not found' });
  res.json({ success: true, data: ticket });
};