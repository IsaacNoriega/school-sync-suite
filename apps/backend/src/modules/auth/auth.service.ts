import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../database/schemas/user.schema';
import { Teacher } from '../../database/schemas/teacher.schema';
import { LoginDto, RegisterTeacherDto, ChangePasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Teacher.name) private teacherModel: Model<Teacher>,
    private jwtService: JwtService,
  ) {}

  async seedAdmin() {
    const adminExists = await this.userModel.findOne({ role: 'SUPER_ADMIN' }).exec();
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await this.userModel.create({
        email: 'admin@schoolsync.com',
        passwordHash,
        role: 'SUPER_ADMIN',
        isActive: true,
      });
      console.log('--- ADMIN SEED CREATED --- admin@schoolsync.com / admin123');
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.userModel.findOne({ email: loginDto.email }).exec();
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
    if (user.role === 'TEACHER') {
      const teacher = await this.teacherModel.findOne({ user: user._id }).exec();
      if (teacher) {
        teacherDetails = {
          teacherId: teacher._id,
          name: teacher.name,
          schoolName: teacher.schoolName,
        };
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
    const userExists = await this.userModel.findOne({ email: registerDto.email }).exec();
    if (userExists) {
      throw new ConflictException('Email already registered');
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
    });

    return {
      id: user._id,
      email: user.email,
      role: user.role,
      teacherId: teacher._id,
      name: teacher.name,
      schoolName: teacher.schoolName,
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

    user.passwordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);
    await user.save();

    return { message: 'Contraseña actualizada correctamente' };
  }

  async listTeachers() {
    const teachers = await this.teacherModel.find().populate('user', 'email isActive').exec();
    return teachers;
  }
}
