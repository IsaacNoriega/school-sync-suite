import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './modules/auth/auth.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { StudentsModule } from './modules/students/students.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { GradesModule } from './modules/grades/grades.module';
import { GatewayModule } from './modules/gateway/gateway.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/school-sync'),
    AuthModule,
    SubjectsModule,
    StudentsModule,
    AssignmentsModule,
    AttendanceModule,
    GradesModule,
    GatewayModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
