import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject, SubjectDocument } from '../../database/schemas/subject.schema';
import { Assignment } from '../../database/schemas/assignment.schema';

@Injectable()
export class SubjectsService {
  constructor(
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
    @InjectModel(Assignment.name) private assignmentModel: Model<Assignment>,
  ) {}

  async create(teacherId: string, name: string, description?: string, color?: string, iconKey?: string) {
    const teacherQuery = Types.ObjectId.isValid(teacherId)
      ? { $or: [{ teacher: teacherId }, { teacher: new Types.ObjectId(teacherId) }] }
      : { teacher: teacherId };

    const existingSubject = await this.subjectModel.findOne({ ...teacherQuery, name }).lean().exec();
    if (existingSubject) {
      throw new ConflictException('Ya tienes una asignatura registrada con este nombre.');
    }

    const prefix = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim()
      .toUpperCase()
      .split(' ')
      .filter(Boolean)
      .slice(0, 3)
      .map(w => w.slice(0, 3))
      .join('')
      .slice(0, 3);
    const suffix = Math.floor(100 + Math.random() * 900);
    const code = `${prefix}-${suffix}`;
    return this.subjectModel.create({
      teacher: teacherId,
      name,
      code,
      description,
      color: color || 'sky',
      iconKey: iconKey || 'book',
    });
  }

  async findAll(teacherId: string) {
    const teacherQuery = Types.ObjectId.isValid(teacherId)
      ? { $or: [{ teacher: teacherId }, { teacher: new Types.ObjectId(teacherId) }] }
      : { teacher: teacherId };

    const subjects = await this.subjectModel.find(teacherQuery).sort({ createdAt: 1 }).lean().exec();
    const enriched = await Promise.all(
      subjects.map(async (s) => {
        const subIdStr = s._id.toString();
        const activeTasksCount = await this.assignmentModel.countDocuments({
          $or: [
            { subject: s._id },
            { subject: subIdStr },
            ...(Types.ObjectId.isValid(subIdStr) ? [{ subject: new Types.ObjectId(subIdStr) }] : []),
          ],
        });
        return {
          ...s,
          activeTasksCount,
        };
      })
    );
    return enriched;
  }

  async findOne(teacherId: string, id: string) {
    const subject = await this.subjectModel.findById(id).lean().exec();
    if (!subject) {
      throw new NotFoundException('Subject not found');
    }
    if (subject.teacher.toString() !== teacherId) {
      throw new ForbiddenException('You do not own this subject');
    }
    return subject;
  }

  async update(teacherId: string, id: string, name?: string, code?: string, description?: string, color?: string, iconKey?: string) {
    await this.findOne(teacherId, id);
    if (name) {
      const existingSubject = await this.subjectModel.findOne({
        teacher: teacherId,
        name,
        _id: { $ne: id }
      }).lean().exec();
      if (existingSubject) {
        throw new ConflictException('Ya tienes una asignatura registrada con este nombre.');
      }
    }

    const updatePayload: any = { name, code, description };
    if (color !== undefined) updatePayload.color = color;
    if (iconKey !== undefined) updatePayload.iconKey = iconKey;

    return this.subjectModel.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true },
    ).exec();
  }

  async remove(teacherId: string, id: string) {
    await this.findOne(teacherId, id);
    await this.assignmentModel.deleteMany({ subject: id }).exec();
    return this.subjectModel.findByIdAndDelete(id).exec();
  }
}
