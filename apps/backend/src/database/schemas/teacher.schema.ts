import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { User } from './user.schema';

export type TeacherDocument = HydratedDocument<Teacher>;

@Schema({ timestamps: true })
export class Teacher extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true, index: true })
  user: Types.ObjectId | User;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  schoolName: string;

  @Prop({ default: '2025-2026' })
  schoolCycle: string;

  @Prop({ default: '07:30' })
  entryTime: string;

  @Prop({ default: 'Matutino' })
  shift: string;
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);
