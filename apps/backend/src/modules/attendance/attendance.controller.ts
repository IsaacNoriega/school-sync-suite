import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PolicyGuard } from '../../common/security/rbac/policy.guard';
import { RequirePolicy } from '../../common/security/rbac/require-policy.decorator';
import { RoleBasedPolicy } from '../../common/security/rbac/policies/role-based.policy';
import { ScanRateLimitGuard } from '../../common/security/rate-limit/scan-rate-limit.guard';
import { ScanRateLimit } from '../../common/security/rate-limit/scan-rate-limit.decorator';
import { ScanAttendanceDto, ManualCorrectionDto, MarkAllPresentDto } from './dto/attendance.dto';

// Política RBAC para operaciones de asistencia (cumple OCP: extensible a nuevos roles sin modificar el guard)
const attendanceTeacherPolicy = new RoleBasedPolicy(['TEACHER', 'SUPER_ADMIN']);

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'SUPER_ADMIN')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('scan')
  @UseGuards(PolicyGuard, ScanRateLimitGuard)
  @RequirePolicy(attendanceTeacherPolicy)
  @ScanRateLimit(45, 60000) // Máximo 45 escaneos por minuto por profesor
  scan(
    @CurrentUser() user: any,
    @Body() dto: ScanAttendanceDto,
  ) {
    return this.attendanceService.scanAttendance(user.teacherId, dto.qrCode, dto.date);
  }

  @Get('daily')
  getDaily(
    @CurrentUser() user: any,
    @Query('date') date: string, // YYYY-MM-DD
  ) {
    return this.attendanceService.getDailyAttendance(user.teacherId, date);
  }

  @Get('monthly-report')
  getMonthlyReport(
    @CurrentUser() user: any,
    @Query('month') month?: string, // YYYY-MM
  ) {
    return this.attendanceService.getMonthlyReport(user.teacherId, month);
  }

  @Post('manual')
  manualCorrect(
    @CurrentUser() user: any,
    @Body() dto: ManualCorrectionDto,
  ) {
    return this.attendanceService.manualCorrection(user.teacherId, dto.studentId, dto.date, dto.status);
  }

  @Post('mark-all-present')
  markAllPresent(
    @CurrentUser() user: any,
    @Body() dto: MarkAllPresentDto,
  ) {
    return this.attendanceService.markAllPresent(user.teacherId, dto.date);
  }
}

