import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../../database/schemas/user.schema';
import { Teacher } from '../../../database/schemas/teacher.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Teacher.name) private teacherModel: Model<Teacher>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'super-secret-key-change-me-in-production',
    });
  }

  async validate(payload: any) {
    const user = await this.userModel.findById(payload.sub).select('-passwordHash').exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive or not found');
    }

    const result: any = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    if (user.role === 'TEACHER') {
      const teacher = await this.teacherModel.findOne({ user: user._id }).exec();
      if (!teacher) {
        throw new UnauthorizedException('Teacher profile not found for user');
      }
      result.teacherId = teacher._id.toString();
    }

    return result;
  }
}
