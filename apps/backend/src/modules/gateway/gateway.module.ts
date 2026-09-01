import { Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Teacher, TeacherSchema } from '../../database/schemas/teacher.schema';

@Module({
  imports: [
    JwtModule,
    MongooseModule.forFeature([{ name: Teacher.name, schema: TeacherSchema }])
  ],
  providers: [AppGateway],
  exports: [AppGateway],
})
export class GatewayModule {}
