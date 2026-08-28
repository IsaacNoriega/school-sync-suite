import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Teacher } from './teacher.schema';

export type StudentDocument = HydratedDocument<Student>;

@Schema({ timestamps: true })
export class Student extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Teacher', required: true, index: true })
  teacher: Types.ObjectId | Teacher;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  qrCode: string;

  @Prop()
  enrollmentNumber: string;
}

export const StudentSchema = SchemaFactory.createForClass(Student);
