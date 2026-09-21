import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateSubjectDto, UpdateSubjectDto } from './dto/subject.dto';

@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Post()
  create(
    @CurrentUser() user: any,
    @Body() createSubjectDto: CreateSubjectDto,
  ) {
    return this.subjectsService.create(
      user.teacherId,
      createSubjectDto.name,
      createSubjectDto.description,
      createSubjectDto.color,
      createSubjectDto.iconKey,
    );
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
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(
      user.teacherId,
      id,
      updateSubjectDto.name,
      updateSubjectDto.code,
      updateSubjectDto.description,
      updateSubjectDto.color,
      updateSubjectDto.iconKey,
    );
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.subjectsService.remove(user.teacherId, id);
  }
}

