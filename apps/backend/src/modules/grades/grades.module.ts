import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GradesService } from './grades.service';
import { GradesController } from './grades.controller';
import { Grade, GradeSchema } from '../../database/schemas/grade.schema';
import { StudentsModule } from '../students/students.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Grade.name, schema: GradeSchema }]),
    StudentsModule,
    AssignmentsModule,
    GatewayModule,
  ],
  controllers: [GradesController],
  providers: [GradesService],
  exports: [GradesService],
})
export class GradesModule {}
