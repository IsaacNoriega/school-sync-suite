import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async scanAttendance(teacherId: string, subjectId: string, qrCode: string) {
    const student = await this.studentsService.findByQrCode(qrCode);
    if (student.teacher.toString() !== teacherId) {
      throw new ForbiddenException('This student does not belong to you');
    }

    const todayStr = new Date().toISOString().split('T')[0];

    let attendance = await this.attendanceModel.findOne({
      student: student._id,
      date: todayStr,
    }).populate('student', 'name').exec();

    if (attendance) {
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
      status: attendance.status,
      date: attendance.date,
      scannedAt: attendance.scannedAt,
    });

    return attendance;
  }

  async getDailyAttendance(teacherId: string, subjectId: string, date: string) {
    const students = await this.studentsService.findAll(teacherId);
    const studentIds = students.map(s => s._id);

    const records = await this.attendanceModel.find({
      student: { $in: studentIds },
      date,
    }).lean().exec();

    return students.map(student => {
      const record = records.find(r => r.student.toString() === student._id.toString());
      return {
        studentId: student._id,
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
        qrCode: student.qrCode,
        attendanceId: record?._id || null,
        status: record?.status || 'ABSENT',
        scannedAt: record?.scannedAt || null,
      };
    });
  }

  async manualCorrection(teacherId: string, studentId: string, subjectId: string, date: string, status: AttendanceStatus) {
    await this.studentsService.findOne(teacherId, studentId);

    let attendance = await this.attendanceModel.findOne({
      student: studentId,
      date,
    }).exec();

    if (attendance) {
      attendance.status = status;
      await attendance.save();
    } else {
      attendance = await this.attendanceModel.create({
        student: studentId,
        date,
        status,
        scannedAt: new Date(),
      });
    }

    return attendance;
  }

  async markAllPresent(teacherId: string, subjectId: string, date: string) {
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

