import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PolicyGuard } from '../../common/security/rbac/policy.guard';
import { RequirePolicy } from '../../common/security/rbac/require-policy.decorator';
import { RoleBasedPolicy } from '../../common/security/rbac/policies/role-based.policy';
import { ScanRateLimitGuard } from '../../common/security/rate-limit/scan-rate-limit.guard';
import { ScanRateLimit } from '../../common/security/rate-limit/scan-rate-limit.decorator';

const gradesTeacherPolicy = new RoleBasedPolicy(['TEACHER', 'SUPER_ADMIN']);

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post('scan')
  @UseGuards(PolicyGuard, ScanRateLimitGuard)
  @RequirePolicy(gradesTeacherPolicy)
  @ScanRateLimit(45, 60000)
  scan(
    @CurrentUser() user: any,
    @Body('assignmentId') assignmentId: string,
    @Body('qrCode') qrCode: string,
    @Body('score') score: number,
  ) {
    return this.gradesService.scanGrade(user.teacherId, assignmentId, qrCode, score);
  }

  @Get('assignment')
  getAssignmentGrades(
    @CurrentUser() user: any,
    @Query('assignmentId') assignmentId: string,
  ) {
    return this.gradesService.getGradesForAssignment(user.teacherId, assignmentId);
  }

  @Post('manual')
  manualCorrect(
    @CurrentUser() user: any,
    @Body('studentId') studentId: string,
    @Body('assignmentId') assignmentId: string,
    @Body('score') score: number,
  ) {
    return this.gradesService.manualCorrection(user.teacherId, studentId, assignmentId, score);
  }
}
