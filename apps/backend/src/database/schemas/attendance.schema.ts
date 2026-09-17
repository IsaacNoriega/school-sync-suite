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


  @Prop({ required: true, index: true })
  date: string; // Formatted YYYY-MM-DD

  @Prop({ required: true, enum: ['PRESENT', 'ABSENT', 'LATE'] })
  status: AttendanceStatus;

  @Prop({ default: Date.now })
  scannedAt: Date;
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Unicidad: un alumno solo puede tener un registro de asistencia por día
AttendanceSchema.index({ student: 1, date: 1 }, { unique: true });

// Índice compuesto principal para getDashboardMetrics:
// - Consulta diaria: { student: { $in: [...] }, date: <fecha> }
// - Consulta mensual: { student: { $in: [...] }, date: { $gte, $lte }, status: { $in } }
// Un solo índice (student, date, status) cubre ambas por prefix matching
AttendanceSchema.index({ student: 1, date: 1, status: 1 });

// Índice para consultas por fecha sola (reportes globales / super admin)
AttendanceSchema.index({ date: 1 });
