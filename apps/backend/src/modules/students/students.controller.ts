import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'SUPER_ADMIN')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createStudentDto: CreateStudentDto,
  ) {
    return this.studentsService.create(
      user.teacherId,
      createStudentDto.name,
      createStudentDto.enrollmentNumber,
      createStudentDto.group,
      createStudentDto.shift,
      createStudentDto.tutor,
      createStudentDto.tutorPhone,
      createStudentDto.status,
    );
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.studentsService.findAll(user.teacherId);
  }

  @Get(':id/summary')
  getSummary(@CurrentUser() user: any, @Param('id') id: string) {
    return this.studentsService.getStudentSummary(user.teacherId, id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.studentsService.findOne(user.teacherId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return this.studentsService.update(
      user.teacherId,
      id,
      updateStudentDto.name,
      updateStudentDto.enrollmentNumber,
      updateStudentDto.tutor,
      updateStudentDto.tutorPhone,
      updateStudentDto.group,
      updateStudentDto.shift,
    );
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.studentsService.remove(user.teacherId, id);
  }
}

