import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
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
    if (student.teacher?.toString() !== teacherId) {
      throw new ForbiddenException('Este estudiante no está asignado a tu grupo');
    }

    const studentObjId = Types.ObjectId.isValid(student._id)
      ? new Types.ObjectId(student._id.toString())
      : student._id;

    const asgIdStr = assignment._id ? assignment._id.toString() : assignmentId;
    if (!Types.ObjectId.isValid(asgIdStr)) {
      throw new BadRequestException('Identificador de tarea inválido');
    }
    const assignmentObjId = new Types.ObjectId(asgIdStr);

    // Consulta previa para determinar si ya existía calificación registrada
    const existingGrade = await this.gradeModel.findOne({
      student: studentObjId,
      assignment: assignmentObjId,
    }).lean().exec();

    const alreadyGraded = !!existingGrade;
    const now = new Date();

    // Actualización atómica idempotente: previene condiciones de carrera y colisiones E11000
    const grade = await this.gradeModel.findOneAndUpdate(
      { student: studentObjId, assignment: assignmentObjId },
      {
        $set: {
          score,
          gradedAt: now,
          manualCorrection: false,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean().exec();

    this.appGateway.sendGradeScan(teacherId, {
      gradeId: grade._id?.toString(),
      studentId: student._id?.toString(),
      studentName: student.name,
      studentEnrollment: student.enrollmentNumber || '',
      enrollmentNumber: student.enrollmentNumber || '',
      assignmentId: asgIdStr,
      score: grade.score,
      gradedAt: grade.gradedAt,
      alreadyGraded,
    });

    return {
      ...grade,
      _id: grade._id?.toString(),
      student: {
        _id: student._id?.toString(),
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
      },
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
        studentId: student._id.toString(),
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
        qrCode: student.qrCode,
        gradeId: grade?._id ? grade._id.toString() : null,
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

    const studentObjId = Types.ObjectId.isValid(studentId)
      ? new Types.ObjectId(studentId)
      : (Types.ObjectId.isValid(student._id) ? new Types.ObjectId(student._id.toString()) : student._id);

    const asgIdStr = assignment._id ? assignment._id.toString() : assignmentId;
    const assignmentObjId = Types.ObjectId.isValid(asgIdStr) ? new Types.ObjectId(asgIdStr) : assignmentId;

    // Actualización atómica consistente
    const grade = await this.gradeModel.findOneAndUpdate(
      { student: studentObjId, assignment: assignmentObjId },
      {
        $set: {
          score,
          manualCorrection: true,
          gradedAt: new Date(),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean().exec();

    return grade;
  }
}

