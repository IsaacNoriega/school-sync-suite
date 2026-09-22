import { Injectable, ForbiddenException, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Assignment, AssignmentDocument } from '../../database/schemas/assignment.schema';
import { Grade } from '../../database/schemas/grade.schema';
import { Student } from '../../database/schemas/student.schema';
import { SubjectsService } from '../subjects/subjects.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<Assignment>,
    @InjectModel(Grade.name) private gradeModel: Model<Grade>,
    @InjectModel(Student.name) private studentModel: Model<Student>,
    private subjectsService: SubjectsService,
  ) {}

  async create(
    teacherId: string,
    rawSubjectId: any,
    title: string,
    description?: string,
    maxScore = 10,
    dueDate?: Date,
    code?: string,
    color?: string,
    iconKey?: string,
  ) {
    const subjectId = typeof rawSubjectId === 'object' && rawSubjectId !== null
      ? (rawSubjectId._id || rawSubjectId.id || String(rawSubjectId))
      : String(rawSubjectId || '');

    if (!subjectId || subjectId === '[object Object]' || !Types.ObjectId.isValid(subjectId)) {
      throw new BadRequestException('El identificador de la asignatura no es válido.');
    }

    const subject = await this.subjectsService.findOne(teacherId, subjectId);

    const existingAssignment = await this.assignmentModel.findOne({ subject: subjectId, title }).lean().exec();
    if (existingAssignment) {
      throw new ConflictException('Ya existe una tarea con este título en esta asignatura.');
    }

    let finalCode = code;
    if (!finalCode) {
      const count = await this.assignmentModel.countDocuments({ subject: subjectId });
      const subCode = (subject.code || 'MAT').replace(/[^a-zA-Z0-9]/g, '').slice(0, 3).toUpperCase();
      finalCode = `QR-${subCode}-${String(count + 1).padStart(2, '0')}`;
    }

    return this.assignmentModel.create({
      subject: subjectId,
      title,
      description,
      maxScore,
      dueDate,
      code: finalCode,
      color: color || (subject as any).color || 'sky',
      iconKey: iconKey || (subject as any).iconKey || 'book',
    });
  }

  async findAllBySubject(teacherId: string, rawSubjectId?: any) {
    const subjectId = typeof rawSubjectId === 'object' && rawSubjectId !== null
      ? (rawSubjectId._id || rawSubjectId.id || String(rawSubjectId))
      : (rawSubjectId ? String(rawSubjectId) : '');

    let query: any = {};
    if (subjectId && subjectId !== 'all' && subjectId !== '[object Object]' && Types.ObjectId.isValid(subjectId)) {
      await this.subjectsService.findOne(teacherId, subjectId);
      query = { $or: [{ subject: subjectId }, { subject: new Types.ObjectId(subjectId) }] };
    } else {
      const subjects = await this.subjectsService.findAll(teacherId);
      const subjectIds = subjects.map((s: any) => s._id);
      const allSubjectIds = subjectIds.flatMap((id: any) => [
        id,
        id.toString(),
        Types.ObjectId.isValid(id) ? new Types.ObjectId(id.toString()) : null
      ]).filter(Boolean);
      query = { subject: { $in: allSubjectIds } };
    }

    const assignments = await this.assignmentModel.find(query)
      .populate('subject')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    const teacherQuery = Types.ObjectId.isValid(teacherId)
      ? { $or: [{ teacher: teacherId }, { teacher: new Types.ObjectId(teacherId) }] }
      : { teacher: teacherId };

    const totalStudents = await this.studentModel.countDocuments({
      ...teacherQuery,
      status: { $ne: 'inactive' },
    });

    const enriched = await Promise.all(
      assignments.map(async (asg) => {
        const asgIdStr = asg._id.toString();
        const asgIdObj = Types.ObjectId.isValid(asgIdStr) ? new Types.ObjectId(asgIdStr) : asg._id;
        const deliveredCount = await this.gradeModel.countDocuments({
          assignment: { $in: [asg._id, asgIdStr, asgIdObj] },
          score: { $ne: null }
        });
        let status: 'active' | 'completed' | 'pending' = 'active';
        if (totalStudents > 0 && deliveredCount >= totalStudents) {
          status = 'completed';
        } else if (deliveredCount === 0) {
          status = 'pending';
        }
        return {
          ...asg,
          deliveredCount,
          totalStudents,
          status,
        };
      })
    );

    return enriched;
  }

  async findOne(teacherId: string, rawId: any) {
    const id = typeof rawId === 'object' && rawId !== null
      ? (rawId._id || rawId.id || String(rawId))
      : String(rawId || '');

    if (!id || id === '[object Object]' || !Types.ObjectId.isValid(id)) {
      throw new BadRequestException('El identificador de la tarea no es válido.');
    }

    const assignment = await this.assignmentModel.findById(id).populate('subject').lean().exec();
    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }
    const subject = assignment.subject as any;
    if (subject.teacher.toString() !== teacherId) {
      throw new ForbiddenException('You do not own this assignment');
    }
    return assignment;
  }

  async update(teacherId: string, id: string, title?: string, description?: string, maxScore?: number, dueDate?: Date, color?: string, iconKey?: string) {
    const assignment = await this.findOne(teacherId, id);
    if (title) {
      const existingAssignment = await this.assignmentModel.findOne({
        subject: assignment.subject._id,
        title,
        _id: { $ne: id }
      }).lean().exec();
      if (existingAssignment) {
        throw new ConflictException('Ya existe una tarea con este título en esta asignatura.');
      }
    }

    const updatePayload: any = { title, description, maxScore, dueDate };
    if (color !== undefined) updatePayload.color = color;
    if (iconKey !== undefined) updatePayload.iconKey = iconKey;

    return this.assignmentModel.findByIdAndUpdate(
      id,
      updatePayload,
      { new: true },
    ).exec();
  }

  async remove(teacherId: string, id: string) {
    await this.findOne(teacherId, id);
    await this.gradeModel.deleteMany({ assignment: id }).exec();
    return this.assignmentModel.findByIdAndDelete(id).exec();
  }
}
