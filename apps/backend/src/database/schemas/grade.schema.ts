import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Student } from './student.schema';
import { Assignment } from './assignment.schema';

export type GradeDocument = HydratedDocument<Grade>;

@Schema({ timestamps: true })
export class Grade extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true, index: true })
  student: Types.ObjectId | Student;

  @Prop({ type: Types.ObjectId, ref: 'Assignment', required: true, index: true })
  assignment: Types.ObjectId | Assignment;

  @Prop({ required: true })
  score: number;

  @Prop({ default: Date.now })
  gradedAt: Date;

  @Prop({ default: false })
  manualCorrection: boolean;
}

export const GradeSchema = SchemaFactory.createForClass(Grade);
GradeSchema.index({ student: 1, assignment: 1 }, { unique: true });

