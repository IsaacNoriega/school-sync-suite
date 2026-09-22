import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateAssignmentDto, UpdateAssignmentDto } from './dto/assignment.dto';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createAssignmentDto: CreateAssignmentDto,
  ) {
    let parsedDate: Date | undefined = undefined;
    if (createAssignmentDto.dueDate && typeof createAssignmentDto.dueDate === 'string' && createAssignmentDto.dueDate.trim() !== '') {
      const d = new Date(createAssignmentDto.dueDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }
    return this.assignmentsService.create(
      user.teacherId,
      createAssignmentDto.subjectId,
      createAssignmentDto.title,
      createAssignmentDto.description,
      createAssignmentDto.maxScore,
      parsedDate,
      createAssignmentDto.code,
      createAssignmentDto.color,
      createAssignmentDto.iconKey,
    );
  }

  @Get()
  findAllBySubject(
    @CurrentUser() user: any,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.assignmentsService.findAllBySubject(user.teacherId, subjectId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.assignmentsService.findOne(user.teacherId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() updateAssignmentDto: UpdateAssignmentDto,
  ) {
    let parsedDate: Date | undefined = undefined;
    if (updateAssignmentDto.dueDate && typeof updateAssignmentDto.dueDate === 'string' && updateAssignmentDto.dueDate.trim() !== '') {
      const d = new Date(updateAssignmentDto.dueDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }
    return this.assignmentsService.update(
      user.teacherId,
      id,
      updateAssignmentDto.title,
      updateAssignmentDto.description,
      updateAssignmentDto.maxScore,
      parsedDate,
      updateAssignmentDto.color,
      updateAssignmentDto.iconKey,
    );
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.assignmentsService.remove(user.teacherId, id);
  }
}

