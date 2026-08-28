import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Grade, GradeDocument } from '../../database/schemas/grade.schema';
import { StudentsService } from '../students/students.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { AppGateway } from '../gateway/app.gateway';

@Injectable()
export class GradesService {
  constructor(
    @InjectModel(Grade.name) private gradeModel: Model<Grade>,
    private studentsService: StudentsService,
    private assignmentsService: AssignmentsService,
    private appGateway: AppGateway,
  ) {}

  async scanGrade(teacherId: string, assignmentId: string, qrCode: string, score: number) {
    const assignment = await this.assignmentsService.findOne(teacherId, assignmentId);

    if (score < 0 || score > assignment.maxScore) {
      throw new ForbiddenException(`Score must be between 0 and ${assignment.maxScore}`);
    }

    const student = await this.studentsService.findByQrCode(qrCode);
    if (student.teacher.toString() !== teacherId) {
      throw new ForbiddenException('This student does not belong to you');
    }

    let grade = await this.gradeModel.findOne({
      student: student._id,
      assignment: assignmentId,
    }).populate('student').exec();

    if (grade) {
      grade.score = score;
      grade.gradedAt = new Date();
      grade.manualCorrection = false;
      await grade.save();
    } else {
      grade = await this.gradeModel.create({
        student: student._id,
        assignment: assignmentId,
        score,
        gradedAt: new Date(),
        manualCorrection: false,
      });
      grade = await grade.populate('student');
    }

    this.appGateway.sendGradeScan(teacherId, {
      gradeId: grade._id,
      studentId: student._id,
      studentName: student.name,
      assignmentId,
      score: grade.score,
      gradedAt: grade.gradedAt,
    });

    return grade;
  }

  async getGradesForAssignment(teacherId: string, assignmentId: string) {
    await this.assignmentsService.findOne(teacherId, assignmentId);

    const students = await this.studentsService.findAll(teacherId);

    const grades = await this.gradeModel.find({ assignment: assignmentId }).exec();

    return students.map(student => {
      const grade = grades.find(g => g.student.toString() === student._id.toString());
      return {
        studentId: student._id,
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
        qrCode: student.qrCode,
        gradeId: grade?._id || null,
        score: grade !== undefined && grade !== null ? grade.score : null,
        gradedAt: grade?.gradedAt || null,
        manualCorrection: grade?.manualCorrection || false,
      };
    });
  }

  async manualCorrection(teacherId: string, studentId: string, assignmentId: string, score: number) {
    const assignment = await this.assignmentsService.findOne(teacherId, assignmentId);
    await this.studentsService.findOne(teacherId, studentId);

    if (score < 0 || score > assignment.maxScore) {
      throw new ForbiddenException(`Score must be between 0 and ${assignment.maxScore}`);
    }

    let grade = await this.gradeModel.findOne({
      student: studentId,
      assignment: assignmentId,
    }).exec();

    if (grade) {
      grade.score = score;
      grade.manualCorrection = true;
      grade.gradedAt = new Date();
      await grade.save();
    } else {
      grade = await this.gradeModel.create({
        student: studentId,
        assignment: assignmentId,
        score,
        gradedAt: new Date(),
        manualCorrection: true,
      });
    }

    return grade;
  }
}
