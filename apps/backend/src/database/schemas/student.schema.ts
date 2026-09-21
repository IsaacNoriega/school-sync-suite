import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { Teacher } from './teacher.schema';

export type StudentDocument = HydratedDocument<Student>;

@Schema({ timestamps: true })
export class Student extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Teacher', required: true })
  teacher: Types.ObjectId | Teacher;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, index: true })
  qrCode: string;

  @Prop()
  enrollmentNumber: string;

  @Prop({ default: '3° B' })
  group?: string;

  @Prop({ default: 'Matutino' })
  shift?: string;

  @Prop({ default: 'Tutor Registrado' })
  tutor?: string;

  @Prop()
  tutorPhone?: string;

  @Prop({ default: 'EMITTED' })
  status?: string;
}

export const StudentSchema = SchemaFactory.createForClass(Student);

// Índice para consultas del docente con proyección de campos del dashboard
StudentSchema.index({ teacher: 1, createdAt: -1 });

// Índice para consulta + ordenamiento alfabético (directorio)
StudentSchema.index({ teacher: 1, name: 1 });

// Índice para búsqueda por grupo dentro de un maestro
StudentSchema.index({ teacher: 1, group: 1 });

// Índice para búsqueda por número de matrícula (escaneo QR con fallback)
StudentSchema.index({ enrollmentNumber: 1 });
