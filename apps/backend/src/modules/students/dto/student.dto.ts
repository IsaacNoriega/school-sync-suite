import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateStudentDto {
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre del estudiante es obligatorio' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name: string;

  @IsOptional()
  @IsString({ message: 'La matrícula debe ser una cadena de texto' })
  @MaxLength(50, { message: 'La matrícula no puede exceder 50 caracteres' })
  enrollmentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  group?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  shift?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tutor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  tutorPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}

export class UpdateStudentDto {
  @IsOptional()
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MaxLength(100, { message: 'El nombre no puede exceder 100 caracteres' })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  enrollmentNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  tutor?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  tutorPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  group?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  shift?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  status?: string;
}
