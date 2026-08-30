import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Assignment, AssignmentDocument } from '../../database/schemas/assignment.schema';
import { SubjectsService } from '../subjects/subjects.service';

@Injectable()
export class AssignmentsService {
  constructor(
    @InjectModel(Assignment.name) private assignmentModel: Model<Assignment>,
    private subjectsService: SubjectsService,
  ) {}

  async create(teacherId: string, subjectId: string, title: string, description?: string, maxScore = 10, dueDate?: Date) {
    await this.subjectsService.findOne(teacherId, subjectId);

    const existingAssignment = await this.assignmentModel.findOne({ subject: subjectId, title }).lean().exec();
    if (existingAssignment) {
      throw new ConflictException('Ya existe una tarea con este título en esta asignatura.');
    }

    return this.assignmentModel.create({
      subject: subjectId,
      title,
      description,
      maxScore,
      dueDate,
    });
  }

  async findAllBySubject(teacherId: string, subjectId: string) {
    await this.subjectsService.findOne(teacherId, subjectId);

    return this.assignmentModel.find({ subject: subjectId }).lean().exec();
  }

  async findOne(teacherId: string, id: string) {
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

  async update(teacherId: string, id: string, title?: string, description?: string, maxScore?: number, dueDate?: Date) {
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

    return this.assignmentModel.findByIdAndUpdate(
      id,
      { title, description, maxScore, dueDate },
      { new: true },
    ).exec();
  }

  async remove(teacherId: string, id: string) {
    await this.findOne(teacherId, id);
    return this.assignmentModel.findByIdAndDelete(id).exec();
  }
}
