import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Student } from './student.schema';
import { AttendanceStatus } from '@school-sync/shared';

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({ timestamps: true })
export class Attendance {
  // Sin index: true redundante (cubierto por el índice compuesto único student_1_date_1)
  @Prop({ type: Types.ObjectId, ref: 'Student', required: true })
  student: Types.ObjectId | Student;

  @Prop({
    required: true,
    match: [/^\d{4}-\d{2}-\d{2}$/, 'La fecha debe cumplir el formato YYYY-MM-DD'],
  })
  date: string; // Formato YYYY-MM-DD

  @Prop({ required: true, enum: ['PRESENT', 'ABSENT', 'LATE'], default: 'PRESENT' })
  status: AttendanceStatus;

  @Prop({ default: Date.now })
  scannedAt: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// 1. Índice Compuesto Único: Garantiza atomicidad y cubre consultas por student solo o student+date
AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// 2. Índice para consultas y reportes agregados por fecha
AttendanceSchema.index({ date: 1 });

