import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AttendanceStatus } from '@school-sync/shared';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('scan')
  scan(
    @CurrentUser() user: any,
    @Body('subjectId') subjectId: string,
    @Body('qrCode') qrCode: string,
  ) {
    return this.attendanceService.scanAttendance(user.teacherId, subjectId, qrCode);
  }

  @Get('daily')
  getDaily(
    @CurrentUser() user: any,
    @Query('subjectId') subjectId: string,
    @Query('date') date: string, // YYYY-MM-DD
  ) {
    return this.attendanceService.getDailyAttendance(user.teacherId, subjectId, date);
  }

  @Post('manual')
  manualCorrect(
    @CurrentUser() user: any,
    @Body('studentId') studentId: string,
    @Body('subjectId') subjectId: string,
    @Body('date') date: string,
    @Body('status') status: AttendanceStatus,
  ) {
    return this.attendanceService.manualCorrection(user.teacherId, studentId, subjectId, date, status);
  }

  @Post('mark-all-present')
  markAllPresent(
    @CurrentUser() user: any,
    @Body('subjectId') subjectId: string,
    @Body('date') date: string,
  ) {
    return this.attendanceService.markAllPresent(user.teacherId, subjectId, date);
  }
}
