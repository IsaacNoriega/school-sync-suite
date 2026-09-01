import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as fs from 'fs';
import * as path from 'path';

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body('name') name: string,
    @Body('enrollmentNumber') enrollmentNumber?: string,
  ) {
    return this.studentsService.create(user.teacherId, name, enrollmentNumber);
  }

  @Post(':id/export')
  exportToLocalDisk(
    @Param('id') id: string,
    @Body('studentName') studentName: string,
    @Body('csvContent') csvContent: string,
  ) {
    const safeStudentName = studentName.replace(/[^a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ\- ]/g, '_');
    const os = require('os');
    const exportsDir = path.resolve(os.tmpdir(), 'educaqr_exports', 'Alumnos');
    
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }
    
    const filePath = path.resolve(exportsDir, `Reporte_${safeStudentName}.csv`);
    
    // Path traversal mitigation
    if (!filePath.startsWith(exportsDir)) {
      throw new Error('Invalid file path');
    }
    
    fs.writeFileSync(filePath, csvContent, 'utf8');
    
    return { success: true, path: filePath };
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
    @Body('name') name?: string,
    @Body('enrollmentNumber') enrollmentNumber?: string,
  ) {
    return this.studentsService.update(user.teacherId, id, name, enrollmentNumber);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.studentsService.remove(user.teacherId, id);
  }
}
