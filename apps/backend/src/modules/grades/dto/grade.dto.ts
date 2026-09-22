import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class ScanGradeDto {
  @IsString({ message: 'El identificador de la tarea es obligatorio' })
  @IsNotEmpty()
  assignmentId: string;

  @IsString({ message: 'El código QR o matrícula es obligatorio' })
  @IsNotEmpty()
  qrCode: string;

  @IsNumber({}, { message: 'La calificación debe ser un número válido' })
  @Min(0, { message: 'La calificación no puede ser negativa' })
  score: number;
}

export class ManualCorrectionDto {
  @IsString({ message: 'El identificador del estudiante es obligatorio' })
  @IsNotEmpty()
  studentId: string;

  @IsString({ message: 'El identificador de la tarea es obligatorio' })
  @IsNotEmpty()
  assignmentId: string;

  @IsNumber({}, { message: 'La calificación debe ser un número válido' })
  @Min(0, { message: 'La calificación no puede ser negativa' })
  score: number;
}
