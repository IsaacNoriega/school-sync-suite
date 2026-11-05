import { Controller, Post, Body, UseGuards, Get, Patch, Param, Res, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterTeacherDto, ChangePasswordDto, UpdateProfileDto, ToggleStatusDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // C-01: Rate limit + emisión de cookie HttpOnly para mitigar XSS.
  // La cookie usa sameSite:'none' porque frontend y backend son subdominios
  // distintos en Render (cross-domain). Requiere secure:true (HTTPS en prod).
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('access_token', result.access_token, {
      httpOnly: true,                          // Inaccesible desde JavaScript
      secure: isProduction,                    // Solo HTTPS en prod (Render)
      sameSite: isProduction ? 'none' : 'lax', // 'none' requerido para cross-domain
      maxAge: 4 * 60 * 60 * 1000,             // 4 horas (alineado con JWT_EXPIRATION)
      path: '/',
    });

    // C-01: Soporte híbrido: emisión de cookie HttpOnly + retorno de access_token
    // en el body para retrocompatibilidad total con Bearer headers y WebSocket.
    return {
      access_token: result.access_token,
      user: result.user,
    };
  }

  // C-01: Endpoint de logout que invalida la cookie en el cliente.
  // Sin guard estricto para permitir que sesiones expiradas también limpien la cookie.
  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
    });
    return { message: 'Sesión cerrada exitosamente' };
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
    @Body() dto: ToggleStatusDto,
  ) {
    return this.authService.toggleTeacherStatus(userId, dto.isActive);
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
