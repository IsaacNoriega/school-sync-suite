import { Controller, Post, Body, UseGuards, Get, Patch, Param, ParseBoolPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterTeacherDto, ChangePasswordDto, UpdateProfileDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register-teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async registerTeacher(@Body() registerDto: RegisterTeacherDto) {
    return this.authService.registerTeacher(registerDto);
  }

  @Get('teachers')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async listTeachers() {
    return this.authService.listTeachers();
  }

  @Patch('teachers/:userId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async toggleTeacherStatus(
    @Param('userId') userId: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.authService.toggleTeacherStatus(userId, isActive);
  }

  @Patch('teachers/:userId/reset-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async adminResetTeacherPassword(
    @Param('userId') userId: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.adminResetTeacherPassword(userId, newPassword);
  }

  @Patch('teachers/:teacherId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async updateTeacher(
    @Param('teacherId') teacherId: string,
    @Body() updateDto: { name?: string; schoolName?: string; schoolCycle?: string; entryTime?: string; shift?: string },
  ) {
    return this.authService.updateTeacher(teacherId, updateDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(user.userId, updateDto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.userId, changePasswordDto);
  }
}
