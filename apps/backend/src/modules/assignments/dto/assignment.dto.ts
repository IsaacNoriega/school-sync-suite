import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, MaxLength } from 'class-validator';

export class CreateAssignmentDto {
  @IsString({ message: 'El identificador de la asignatura debe ser válido' })
  @IsNotEmpty({ message: 'La asignatura es obligatoria' })
  subjectId: string;

  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título de la tarea es obligatorio' })
  @MaxLength(150, { message: 'El título no puede exceder 150 caracteres' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'La descripción no puede exceder 1000 caracteres' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'La puntuación máxima debe ser un número' })
  @Min(1, { message: 'La puntuación mínima es 1' })
  @Max(100, { message: 'La puntuación máxima permitida es 100' })
  maxScore?: number;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  iconKey?: string;
}

export class UpdateAssignmentDto {
  @IsOptional()
  @IsString({ message: 'El título debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El título no puede estar vacío' })
  @MaxLength(150, { message: 'El título no puede exceder 150 caracteres' })
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxScore?: number;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  iconKey?: string;
}
