import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, AnyBulkWriteOperation } from 'mongoose';
import { Attendance } from '../../database/schemas/attendance.schema';
import { StudentsService } from '../students/students.service';
import { AppGateway } from '../gateway/app.gateway';
import { AttendanceStatus } from '@school-sync/shared';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<Attendance>,
    private readonly studentsService: StudentsService,
    private readonly appGateway: AppGateway,
  ) {}

  async scanAttendance(teacherId: string, qrCode: string, date?: string) {
    const student = await this.studentsService.findByQrCode(qrCode);
    if (student.teacher?.toString() !== teacherId) {
      throw new ForbiddenException('Este estudiante no está asignado a tu grupo');
    }

    // Cálculo resiliente de fecha local en formato YYYY-MM-DD
    const todayStr = date && date.trim() ? date.trim() : new Date().toLocaleDateString('en-CA');

    const existingAttendance = await this.attendanceModel.findOne({
      student: student._id,
      date: todayStr,
    }).lean().exec();

    const alreadyScanned = !!existingAttendance;
    const now = new Date();

    // Actualización atómica idempotente: previene colisiones y excepciones E11000 en escaneos en ráfaga
    const attendance = await this.attendanceModel.findOneAndUpdate(
      { student: student._id, date: todayStr },
      {
        $set: {
          status: 'PRESENT',
          scannedAt: existingAttendance ? existingAttendance.scannedAt || now : now,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean().exec();

    this.appGateway.sendAttendanceScan(teacherId, {
      attendanceId: attendance._id,
      studentId: student._id,
      studentName: student.name,
      studentEnrollment: student.enrollmentNumber,
      status: attendance.status,
      date: attendance.date,
      scannedAt: attendance.scannedAt,
      alreadyScanned,
    });

    return {
      ...attendance,
      student: {
        _id: student._id,
        name: student.name,
        enrollmentNumber: student.enrollmentNumber,
      },
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

    // Corrección atómica sin borrado destructivo: previene pérdida de datos ante caídas de red o fallos
    const attendance = await this.attendanceModel.findOneAndUpdate(
      { student: studentObjectId, date },
      {
        $set: {
          status,
          scannedAt: status !== 'ABSENT' ? new Date() : null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean().exec();

    const targetTeacherId = teacherId || student.teacher?.toString();
    if (targetTeacherId) {
      this.appGateway.sendAttendanceScan(targetTeacherId, {
        attendanceId: attendance._id,
        studentId: student._id,
        studentName: student.name,
        studentEnrollment: student.enrollmentNumber,
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

    const operations: AnyBulkWriteOperation<Attendance>[] = students.map(student => ({
      updateOne: {
        filter: { student: student._id, date },
        update: {
          $set: {
            status: 'PRESENT' as AttendanceStatus,
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

  async getMonthlyReport(teacherId: string | undefined, monthStr?: string) {
    const targetMonth = monthStr && /^\d{4}-\d{2}$/.test(monthStr.trim())
      ? monthStr.trim()
      : new Date().toLocaleDateString('en-CA').substring(0, 7);

    const [yearStr, mStr] = targetMonth.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(mStr, 10);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const startOfMonth = `${targetMonth}-01`;
    const endOfMonth = `${targetMonth}-${String(daysInMonth).padStart(2, '0')}`;

    const students = await this.studentsService.findAll(teacherId, '_id name enrollmentNumber qrCode tutor status');
    if (!students || students.length === 0) {
      return {
        month: targetMonth,
        year,
        monthNum,
        daysInMonth,
        students: [],
        records: {},
        summaries: {},
      };
    }

    const studentIds = students.map((s) => s._id);
    const studentObjectIds = studentIds.map((s) => (Types.ObjectId.isValid(s) ? new Types.ObjectId(s.toString()) : s));
    const studentStringIds = studentIds.map((s) => s.toString());
    const allStudentIdsForQuery = Array.from(new Set([...studentObjectIds, ...studentStringIds]));

    const attendanceRecords = await this.attendanceModel
      .find({
        student: { $in: allStudentIdsForQuery },
        date: { $gte: startOfMonth, $lte: endOfMonth },
      })
      .select('_id student date status scannedAt')
      .lean()
      .exec();

    // Map: studentId -> date (YYYY-MM-DD) -> { status, scannedAt }
    const recordsByStudent: Record<string, Record<string, { status: string; scannedAt?: Date }>> = {};
    for (const s of students) {
      recordsByStudent[s._id.toString()] = {};
    }

    for (const record of attendanceRecords) {
      const sId = record.student.toString();
      if (!recordsByStudent[sId]) {
        recordsByStudent[sId] = {};
      }
      recordsByStudent[sId][record.date] = {
        status: record.status,
        scannedAt: record.scannedAt,
      };
    }

    // Calcular resúmenes por estudiante
    const summaries: Record<
      string,
      { presents: number; lates: number; absents: number; totalRecords: number; attendanceRate: number }
    > = {};

    for (const s of students) {
      const sId = s._id.toString();
      const recs = recordsByStudent[sId] || {};
      let presents = 0;
      let lates = 0;
      let absents = 0;
      for (const d in recs) {
        const st = recs[d].status;
        if (st === 'PRESENT') presents++;
        else if (st === 'LATE') lates++;
        else if (st === 'ABSENT') absents++;
      }
      const totalRecords = presents + lates + absents;
      const attendanceRate = totalRecords > 0 ? Math.round(((presents + lates) / totalRecords) * 100) : 0;
      summaries[sId] = {
        presents,
        lates,
        absents,
        totalRecords,
        attendanceRate,
      };
    }

    return {
      month: targetMonth,
      year,
      monthNum,
      daysInMonth,
      students: students.map((s) => ({
        _id: s._id.toString(),
        name: s.name,
        enrollmentNumber: s.enrollmentNumber || '#EQR-0000',
        tutor: s.tutor,
      })),
      records: recordsByStudent,
      summaries,
    };
  }
}


