import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Teacher } from './teacher.schema';

export type SubjectDocument = HydratedDocument<Subject>;

@Schema({ timestamps: true })
export class Subject extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Teacher', required: true, index: true })
  teacher: Types.ObjectId | Teacher;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  code: string;

  @Prop()
  description: string;
}

export const SubjectSchema = SchemaFactory.createForClass(Subject);
