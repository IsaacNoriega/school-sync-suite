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
}

export const TeacherSchema = SchemaFactory.createForClass(Teacher);
