import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student, StudentSchema } from '../../database/schemas/student.schema';
import { Attendance, AttendanceSchema } from '../../database/schemas/attendance.schema';
import { Grade, GradeSchema } from '../../database/schemas/grade.schema';
import { Assignment, AssignmentSchema } from '../../database/schemas/assignment.schema';
import { Subject, SubjectSchema } from '../../database/schemas/subject.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Student.name, schema: StudentSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: Grade.name, schema: GradeSchema },
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Subject.name, schema: SubjectSchema },
    ]),
  ],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
