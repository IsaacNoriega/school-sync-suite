import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Attendance, AttendanceDocument } from '../../database/schemas/attendance.schema';
import { StudentsService } from '../students/students.service';
import { SubjectsService } from '../subjects/subjects.service';
import { AppGateway } from '../gateway/app.gateway';
import { AttendanceStatus } from '@school-sync/shared';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    private studentsService: StudentsService,
    private subjectsService: SubjectsService,
    private appGateway: AppGateway,
  ) {}

  async scanAttendance(teacherId: string, qrCode: string, date?: string) {
    const student = await this.studentsService.findByQrCode(qrCode);
    if (student.teacher.toString() !== teacherId) {
      throw new ForbiddenException('This student does not belong to you');
    }

    const todayStr = date && date.trim() ? date.trim() : new Date().toISOString().split('T')[0];

    let attendance = await this.attendanceModel.findOne({
      student: student._id,
      date: todayStr,
    }).populate('student', 'name').exec();

    let alreadyScanned = false;
    if (attendance) {
      alreadyScanned = true;
      attendance.status = 'PRESENT';
      attendance.scannedAt = new Date();
      await attendance.save();
    } else {
      attendance = await this.attendanceModel.create({
        student: student._id,
        date: todayStr,
        status: 'PRESENT',
        scannedAt: new Date(),
      });
      await attendance.populate('student', 'name');
    }

    this.appGateway.sendAttendanceScan(teacherId, {
      attendanceId: attendance._id,
      studentId: student._id,
      studentName: student.name,
      enrollmentNumber: student.enrollmentNumber,
      status: attendance.status,
      date: attendance.date,
      scannedAt: attendance.scannedAt,
      alreadyScanned,
    });

    const attObj = typeof (attendance as any).toObject === 'function' ? (attendance as any).toObject() : attendance;
    return {
      ...attObj,
      alreadyScanned,
    };
  }

  async getDailyAttendance(teacherId: string | undefined, date: string) {
    return this.studentsService.getDashboardMetrics(teacherId, date);
  }

  async manualCorrection(teacherId: string | undefined, studentId: string, date: string, status: AttendanceStatus) {
    const student = await this.studentsService.findOne(teacherId, studentId);

    const studentObjectId = Types.ObjectId.isValid(studentId)
      ? new Types.ObjectId(studentId)
      : (Types.ObjectId.isValid(student._id) ? new Types.ObjectId(student._id.toString()) : student._id);

    const studentIdStr = student._id.toString();

    // Eliminar cualquier duplicado huérfano con string o ObjectId para este alumno y fecha
    await this.attendanceModel.deleteMany({
      $or: [
        { student: studentObjectId },
        { student: studentIdStr },
      ],
      date,
    }).exec();

    // Crear el registro canónico único con Types.ObjectId consistente
    const attendance = await this.attendanceModel.create({
      student: studentObjectId,
      date,
      status,
      scannedAt: status !== 'ABSENT' ? new Date() : null,
    });

    const targetTeacherId = teacherId || student.teacher?.toString();
    if (targetTeacherId) {
      this.appGateway.sendAttendanceScan(targetTeacherId, {
        attendanceId: attendance._id,
        studentId: student._id,
        studentName: student.name,
        enrollmentNumber: student.enrollmentNumber,
        status: attendance.status,
        date: attendance.date,
        scannedAt: attendance.scannedAt,
      });
    }

    return attendance;
  }

  async markAllPresent(teacherId: string, date: string) {
    const students = await this.studentsService.findAll(teacherId);
    if (!students || students.length === 0) {
      return [];
    }

    const operations = students.map(student => ({
      updateOne: {
        filter: { student: student._id, date },
        update: {
          $set: {
            status: 'PRESENT',
            scannedAt: new Date(),
          }
        },
        upsert: true
      }
    }));

    await this.attendanceModel.bulkWrite(operations);

    const studentIds = students.map(s => s._id);
    return this.attendanceModel.find({
      student: { $in: studentIds },
      date,
    }).lean().exec();
  }
}

