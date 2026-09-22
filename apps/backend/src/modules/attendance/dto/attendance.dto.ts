import { IsString, IsNotEmpty, IsOptional, Matches, IsIn } from 'class-validator';
import { AttendanceStatus } from '@school-sync/shared';

export class ScanAttendanceDto {
  @IsString()
  @IsNotEmpty({ message: 'El código QR es obligatorio' })
  qrCode: string;

  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  date?: string;
}

export class ManualCorrectionDto {
  @IsString()
  @IsNotEmpty({ message: 'El ID del estudiante es obligatorio' })
  studentId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  date: string;

  @IsIn(['PRESENT', 'ABSENT', 'LATE'], { message: 'Estado de asistencia no válido' })
  status: AttendanceStatus;
}

export class MarkAllPresentDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha debe tener formato YYYY-MM-DD' })
  date: string;
}
