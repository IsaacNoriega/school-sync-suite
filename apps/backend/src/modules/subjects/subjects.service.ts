import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subject, SubjectDocument } from '../../database/schemas/subject.schema';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
  ) {}

  async create(teacherId: string, name: string, code: string, description?: string) {
    return this.subjectModel.create({
      teacher: teacherId,
      name,
      code,
      description,
    });
  }

  async findAll(teacherId: string) {
    return this.subjectModel.find({ teacher: teacherId }).exec();
  }

  async findOne(teacherId: string, id: string) {
    const subject = await this.subjectModel.findById(id).exec();
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    if (subject.teacher.toString() !== teacherId) {
      throw new ForbiddenException('You do not own this subject');
    }
    return subject;
  }

  async update(teacherId: string, id: string, name?: string, code?: string, description?: string) {
    await this.findOne(teacherId, id);
    return this.subjectModel.findByIdAndUpdate(
      id,
      { name, code, description },
      { new: true },
    ).exec();
  }

  async remove(teacherId: string, id: string) {
    await this.findOne(teacherId, id);
    return this.subjectModel.findByIdAndDelete(id).exec();
  }
}
