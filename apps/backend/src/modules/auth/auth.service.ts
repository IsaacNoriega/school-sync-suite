import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../database/schemas/user.schema';
import { Teacher } from '../../database/schemas/teacher.schema';
import { Subject } from '../../database/schemas/subject.schema';
import { LoginDto, RegisterTeacherDto, ChangePasswordDto, UpdateProfileDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Teacher.name) private teacherModel: Model<Teacher>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    private jwtService: JwtService,
  ) {}

  async seedAdmin() {
    const adminExists = await this.userModel.findOne({ role: 'SUPER_ADMIN' }).exec();
    if (!adminExists) {
      const adminEmail = process.env.ADMIN_EMAIL;
      const adminPassword = process.env.ADMIN_PASSWORD;
      if (!adminEmail || !adminPassword) {
        console.warn('ADMIN_EMAIL or ADMIN_PASSWORD env vars not set. Skipping SUPER_ADMIN seed.');
        return;
      }
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await this.userModel.create({
        email: adminEmail,
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      });
      console.log(`--- ADMIN SEED CREATED --- ${adminEmail}`);
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ email: loginDto.email }).lean().exec();
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is suspended');
    }

    const payload = { sub: user._id, role: user.role, email: user.email };
    
    let teacherDetails = null;
    if (user.role === 'TEACHER' || user.role === 'SUPER_ADMIN') {
      const teacher = await this.teacherModel.findOne({ user: user._id }).lean().exec();
      if (teacher) {
        teacherDetails = {
          teacherId: teacher._id.toString(),
          name: teacher.name,
          schoolName: teacher.schoolName,
          schoolCycle: teacher.schoolCycle || '2025-2026',
          entryTime: teacher.entryTime || '07:30',
          shift: teacher.shift || 'Matutino',
        };
        payload['teacherId'] = teacher._id.toString();
      }
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        ...teacherDetails,
      },
    };
  }

  async registerTeacher(registerDto: RegisterTeacherDto) {
    const userExists = await this.userModel.findOne({ email: registerDto.email }).lean().exec();
    if (userExists) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    const user = await this.userModel.create({
      email: registerDto.email,
      passwordHash,
      role: 'TEACHER',
      isActive: true,
    });

    const teacher = await this.teacherModel.create({
      user: user._id,
      name: registerDto.name,
      schoolName: registerDto.schoolName,
      schoolCycle: registerDto.schoolCycle || '2025-2026',
      entryTime: registerDto.entryTime || '07:30',
      shift: registerDto.shift || 'Matutino',
    });

    return {
      id: user._id,
      email: user.email,
      role: user.role,
      teacherId: teacher._id,
      name: teacher.name,
      schoolName: teacher.schoolName,
      schoolCycle: teacher.schoolCycle,
      entryTime: teacher.entryTime,
      shift: teacher.shift,
    };
  }

  async toggleTeacherStatus(userId: string, isActive: boolean) {
    const user = await this.userModel.findById(userId).exec();
    if (!user || user.role !== 'TEACHER') {
      throw new UnauthorizedException('Teacher user not found');
    }
    user.isActive = isActive;
    await user.save();
    return { userId: user._id, email: user.email, isActive: user.isActive };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(changePasswordDto.oldPassword, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Contraseña actual incorrecta');
    }

    user.passwordHash = await bcrypt.hash(changePasswordDto.newPassword, 12);
    await user.save();

    return { message: 'Contraseña actualizada correctamente' };
  }

  async listTeachers() {
    const teachers = await this.teacherModel.find().populate('user', 'email isActive').lean().exec();
    
    // Enrich with subjects for each teacher
    const teacherIds = teachers.map((t: any) => t._id);
    const subjects = await this.subjectModel.find({ teacher: { $in: teacherIds } }).select('_id teacher name code').lean().exec();

    const subjectsByTeacher = subjects.reduce((acc: Record<string, any[]>, sub: any) => {
      const tId = sub.teacher.toString();
      if (!acc[tId]) acc[tId] = [];
      acc[tId].push(sub);
      return acc;
    }, {});

    return teachers.map((t: any) => ({
      ...t,
      subjects: subjectsByTeacher[t._id.toString()] || [],
    }));
  }

  async adminResetTeacherPassword(userId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new ConflictException('La nueva contraseña debe tener al menos 6 caracteres');
    }
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    return { message: 'Contraseña restablecida exitosamente por el administrador' };
  }

  async updateTeacher(
    teacherId: string,
    updateDto: { name?: string; schoolName?: string; schoolCycle?: string; entryTime?: string; shift?: string },
  ) {
    const teacher = await this.teacherModel.findById(teacherId).exec();
    if (!teacher) {
      throw new ConflictException('Docente no encontrado');
    }
    if (updateDto.name && updateDto.name.trim()) {
      teacher.name = updateDto.name.trim();
    }
    if (updateDto.schoolName && updateDto.schoolName.trim()) {
      teacher.schoolName = updateDto.schoolName.trim();
    }
    if (updateDto.schoolCycle && updateDto.schoolCycle.trim()) {
      teacher.schoolCycle = updateDto.schoolCycle.trim();
    }
    if (updateDto.entryTime && updateDto.entryTime.trim()) {
      teacher.entryTime = updateDto.entryTime.trim();
    }
    if (updateDto.shift && updateDto.shift.trim()) {
      teacher.shift = updateDto.shift.trim();
    }
    await teacher.save();
    return teacher;
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    let teacherDetails = null;
    if (user.role === 'TEACHER' || user.role === 'SUPER_ADMIN') {
      const teacher = await this.teacherModel.findOne({ user: user._id }).lean().exec();
      if (teacher) {
        teacherDetails = {
          teacherId: teacher._id.toString(),
          name: teacher.name,
          schoolName: teacher.schoolName,
          schoolCycle: teacher.schoolCycle || '2025-2026',
          entryTime: teacher.entryTime || '07:30',
          shift: teacher.shift || 'Matutino',
        };
      }
    }

    return {
      id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      ...teacherDetails,
    };
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    let teacherDetails = null;
    if (user.role === 'TEACHER' || user.role === 'SUPER_ADMIN') {
      const teacher = await this.teacherModel.findOne({ user: user._id }).exec();
      if (teacher) {
        if (updateDto.name && updateDto.name.trim()) teacher.name = updateDto.name.trim();
        if (updateDto.schoolName && updateDto.schoolName.trim()) teacher.schoolName = updateDto.schoolName.trim();
        if (updateDto.schoolCycle && updateDto.schoolCycle.trim()) teacher.schoolCycle = updateDto.schoolCycle.trim();
        if (updateDto.entryTime && updateDto.entryTime.trim()) teacher.entryTime = updateDto.entryTime.trim();
        if (updateDto.shift && updateDto.shift.trim()) teacher.shift = updateDto.shift.trim();
        await teacher.save();

        teacherDetails = {
          teacherId: teacher._id.toString(),
          name: teacher.name,
          schoolName: teacher.schoolName,
          schoolCycle: teacher.schoolCycle,
          entryTime: teacher.entryTime,
          shift: teacher.shift,
        };
      }
    }

    return {
      id: user._id,
      email: user.email,
      role: user.role,
      ...teacherDetails,
    };
  }
}
