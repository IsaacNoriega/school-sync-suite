import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Student } from './student.schema';
import { Subject } from './subject.schema';
import { AttendanceStatus } from '@school-sync/shared';

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({ timestamps: true })
export class Attendance extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true, index: true })
  student: Types.ObjectId | Student;

  @Prop({ type: Types.ObjectId, ref: 'Subject', required: false, index: true })
  subject?: Types.ObjectId | Subject;

  @Prop({ required: true, index: true })
  date: string; // Formatted YYYY-MM-DD

  @Prop({ required: true, enum: ['PRESENT', 'ABSENT', 'LATE'] })
  status: AttendanceStatus;

  @Prop({ default: Date.now })
  scannedAt: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
