import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { Assignment, AssignmentSchema } from '../../database/schemas/assignment.schema';
import { Grade, GradeSchema } from '../../database/schemas/grade.schema';
import { Student, StudentSchema } from '../../database/schemas/student.schema';
import { SubjectsModule } from '../subjects/subjects.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Assignment.name, schema: AssignmentSchema },
      { name: Grade.name, schema: GradeSchema },
      { name: Student.name, schema: StudentSchema },
    ]),
    SubjectsModule,
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
