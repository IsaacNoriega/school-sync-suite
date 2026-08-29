import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body('name') name: string,
    @Body('description') description?: string,
  ) {
    return this.subjectsService.create(user.teacherId, name, description);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.subjectsService.findAll(user.teacherId);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.subjectsService.findOne(user.teacherId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('name') name?: string,
    @Body('code') code?: string,
    @Body('description') description?: string,
  ) {
    return this.subjectsService.update(user.teacherId, id, name, code, description);
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.subjectsService.remove(user.teacherId, id);
  }
}
