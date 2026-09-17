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

// Unicidad: un alumno solo puede tener una calificación por tarea
GradeSchema.index({ student: 1, assignment: 1 }, { unique: true });

// Índice de cobertura para getDashboardMetrics:
// Cubre la consulta { student: { $in }, assignment: { $in } }
// con proyección .select('student assignment score')
// MongoDB resuelve todo el query desde el índice sin cargar documentos (covered query)
GradeSchema.index({ assignment: 1, student: 1, score: 1 });
