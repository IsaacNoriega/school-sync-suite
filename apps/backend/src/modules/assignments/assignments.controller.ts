import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Controller('assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body('subjectId') subjectId: string,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('maxScore') maxScore?: number,
    @Body('dueDate') dueDate?: string,
  ) {
    let parsedDate: Date | undefined = undefined;
    if (dueDate && typeof dueDate === 'string' && dueDate.trim() !== '') {
      const d = new Date(dueDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }
    return this.assignmentsService.create(user.teacherId, subjectId, title, description, maxScore, parsedDate);
  }

  @Post(':id/export')
  exportToLocalDisk(
    @Param('id') id: string,
    @Body('subjectName') subjectName: string,
    @Body('assignmentTitle') assignmentTitle: string,
    @Body('csvContent') csvContent: string,
  ) {
    const safeSubjectName = subjectName.replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\- ]/g, '_');
    const safeAssignmentTitle = assignmentTitle.replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\- ]/g, '_');
    
    const os = require('os');
    const exportsDir = path.resolve(os.tmpdir(), 'educaqr_exports', safeSubjectName);
    
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    const filePath = path.resolve(exportsDir, `${safeAssignmentTitle}.csv`);
    
    // Path traversal mitigation
    if (!filePath.startsWith(exportsDir)) {
      throw new Error('Invalid file path');
    }
    
    fs.writeFileSync(filePath, csvContent, 'utf8');
    
    return { success: true, path: filePath };
  }

  @Get()
  findAllBySubject(
    @CurrentUser() user: any,
    @Query('subjectId') subjectId: string,
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
    @Body('title') title?: string,
    @Body('description') description?: string,
    @Body('maxScore') maxScore?: number,
    @Body('dueDate') dueDate?: string,
  ) {
    let parsedDate: Date | undefined = undefined;
    if (dueDate && typeof dueDate === 'string' && dueDate.trim() !== '') {
      const d = new Date(dueDate);
      if (!isNaN(d.getTime())) {
        parsedDate = d;
      }
    }
    return this.assignmentsService.update(user.teacherId, id, title, description, maxScore, parsedDate);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.assignmentsService.remove(user.teacherId, id);
  }
}
