import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
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

    const assignmentQuery = Types.ObjectId.isValid(assignmentId)
      ? { $or: [{ assignment: assignmentId }, { assignment: new Types.ObjectId(assignmentId) }] }
      : { assignment: assignmentId };

    const studentQuery = Types.ObjectId.isValid(student._id.toString())
      ? { $or: [{ student: student._id }, { student: student._id.toString() }] }
      : { student: student._id };

    let grade = await this.gradeModel.findOne({
      $and: [studentQuery, assignmentQuery],
    }).populate('student', 'name').exec();

    const assignmentObjId = Types.ObjectId.isValid(assignmentId)
      ? new Types.ObjectId(assignmentId)
      : assignmentId;

    let alreadyGraded = false;
    if (grade) {
      alreadyGraded = true;
      grade.score = score;
      grade.gradedAt = new Date();
      grade.manualCorrection = false;
      await grade.save();
    } else {
      grade = await this.gradeModel.create({
        student: student._id,
        assignment: assignmentObjId,
        score,
        gradedAt: new Date(),
        manualCorrection: false,
      });
      await grade.populate('student', 'name');
    }

    this.appGateway.sendGradeScan(teacherId, {
      gradeId: grade._id,
      studentId: student._id,
      studentName: student.name,
      enrollmentNumber: student.enrollmentNumber,
      assignmentId,
      score: grade.score,
      gradedAt: grade.gradedAt,
      alreadyGraded,
    });

    const gradeObj = typeof (grade as any).toObject === 'function' ? (grade as any).toObject() : grade;
    return {
      ...gradeObj,
      alreadyGraded,
    };
  }

  async getGradesForAssignment(teacherId: string, assignmentId: string) {
    await this.assignmentsService.findOne(teacherId, assignmentId);

    const students = await this.studentsService.findAll(teacherId);

    const asgIdStr = assignmentId.toString();
    const asgIdObj = Types.ObjectId.isValid(asgIdStr) ? new Types.ObjectId(asgIdStr) : assignmentId;

    const assignmentQuery = {
      assignment: { $in: [assignmentId, asgIdStr, asgIdObj] }
    };

    const grades = await this.gradeModel.find(assignmentQuery).lean().exec();

    return students.map(student => {
      const studentIdStr = student._id.toString();
      const grade = grades.find(g => {
        const gStudent = typeof g.student === 'object' && g.student !== null ? (g.student as any)._id || g.student : g.student;
        return gStudent?.toString() === studentIdStr;
      });
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
    const student = await this.studentsService.findOne(teacherId, studentId);

    if (score < 0 || score > assignment.maxScore) {
      throw new ForbiddenException(`Score must be between 0 and ${assignment.maxScore}`);
    }

    const studentObjId = Types.ObjectId.isValid(studentId) ? new Types.ObjectId(studentId) : student._id;
    const assignmentObjId = Types.ObjectId.isValid(assignmentId) ? new Types.ObjectId(assignmentId) : assignmentId;

    let grade = await this.gradeModel.findOne({
      $and: [
        { $or: [{ student: student._id }, { student: studentId }, { student: studentObjId }] },
        { $or: [{ assignment: assignmentId }, { assignment: assignmentObjId }] }
      ]
    }).exec();

    if (grade) {
      grade.score = score;
      grade.manualCorrection = true;
      grade.gradedAt = new Date();
      await grade.save();
    } else {
      grade = await this.gradeModel.create({
        student: studentObjId,
        assignment: assignmentObjId,
        score,
        gradedAt: new Date(),
        manualCorrection: true,
      });
    }

    return grade;
  }
}
