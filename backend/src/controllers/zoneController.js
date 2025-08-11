import Joi from 'joi';
import { Zone } from '../models/zoneModel.js';

const schema = Joi.object({ name: Joi.string().required(), region: Joi.string().valid('hill','city').required(), polygon: Joi.object().required(), active: Joi.boolean().default(true) });

export const createZone = async (req,res)=>{
  const {error,value}=schema.validate(req.body);
  if(error) return res.status(400).json({success:false,message:error.message});
  const z = await Zone.create(value);
  res.status(201).json({success:true,data:z});
};
export const listZones = async (req,res)=>{
  const list = await Zone.find().sort({createdAt:-1});
  res.json({success:true,data:list});
};
export const updateZone = async (req,res)=>{
  const {error,value}=schema.validate(req.body);
  if(error) return res.status(400).json({success:false,message:error.message});
  const z = await Zone.findByIdAndUpdate(req.params.id, value, {new:true});
  if(!z) return res.status(404).json({success:false,message:'Zone not found'});
  res.json({success:true,data:z});
};
export const deleteZone = async (req,res)=>{
  const z = await Zone.findByIdAndDelete(req.params.id);
  if(!z) return res.status(404).json({success:false,message:'Zone not found'});
  res.json({success:true});
};