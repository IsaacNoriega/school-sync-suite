import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Student, StudentDocument } from '../../database/schemas/student.schema';
import { Attendance } from '../../database/schemas/attendance.schema';
import { Grade } from '../../database/schemas/grade.schema';
import { Assignment } from '../../database/schemas/assignment.schema';
import { Subject } from '../../database/schemas/subject.schema';

@Injectable()
export class StudentsService {
  constructor(
    @InjectModel(Student.name) private studentModel: Model<Student>,
    @InjectModel(Attendance.name) private attendanceModel: Model<Attendance>,
    @InjectModel(Grade.name) private gradeModel: Model<Grade>,
    @InjectModel(Assignment.name) private assignmentModel: Model<Assignment>,
    @InjectModel(Subject.name) private subjectModel: Model<Subject>,
  ) {}

  async create(
    teacherId: string,
    name: string,
    enrollmentNumber?: string,
    group?: string,
    shift?: string,
    tutor?: string,
    tutorPhone?: string,
    status?: string,
  ) {
    if (enrollmentNumber) {
      const existing = await this.studentModel.findOne({ enrollmentNumber }).lean().exec();
      if (existing) {
        throw new ConflictException('La matrícula ya está registrada para otro alumno.');
      }
    }

    const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const qrCode = `STUDENT-${teacherId.substring(18, 24).toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${suffix}`;

    return this.studentModel.create({
      teacher: teacherId,
      name,
      qrCode,
      enrollmentNumber,
      group: group || '3° B',
      shift: shift || 'Matutino',
      tutor: tutor || 'Tutor Registrado',
      tutorPhone: tutorPhone || '',
      status: status || 'EMITTED',
    });
  }

  async findAll(teacherId?: string, projection?: any) {
    if (!teacherId) {
      const q = this.studentModel.find();
      if (projection) {
        q.select(projection);
      }
      return q.sort({ createdAt: -1 }).lean().exec();
    }
    const query = Types.ObjectId.isValid(teacherId)
      ? { $or: [{ teacher: teacherId }, { teacher: new Types.ObjectId(teacherId) }] }
      : { teacher: teacherId };
    const q = this.studentModel.find(query);
    if (projection) {
      q.select(projection);
    }
    return q.sort({ createdAt: -1 }).lean().exec();
  }

  async findOne(teacherId: string | undefined, id: string) {
    const student = await this.studentModel.findById(id).lean().exec();
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (teacherId && student.teacher && student.teacher.toString() !== teacherId) {
      throw new ForbiddenException('You do not own this student');
    }
    return student;
  }

  async findByQrCode(qrCode: string) {
    if (!qrCode || typeof qrCode !== 'string' || !qrCode.trim()) {
      throw new NotFoundException('Código QR no proporcionado o inválido');
    }

    const cleanCode = qrCode.trim();
    const cleanNoHash = cleanCode.replace(/^#/, '');
    const cleanWithHash = `#${cleanNoHash}`;
    const cleanNoPrefix = cleanCode.replace(/^QR-/, '');

    const orConditions: any[] = [
      { qrCode: cleanCode },
      { qrCode: cleanNoHash },
      { enrollmentNumber: cleanCode },
      { enrollmentNumber: cleanWithHash },
      { enrollmentNumber: cleanNoHash },
    ];

    if (Types.ObjectId.isValid(cleanCode)) {
      orConditions.push({ _id: cleanCode });
    }
    if (Types.ObjectId.isValid(cleanNoPrefix)) {
      orConditions.push({ _id: cleanNoPrefix });
    }

    const student = await this.studentModel.findOne({ $or: orConditions }).lean().exec();
    if (!student) {
      throw new NotFoundException(`No se encontró ningún estudiante con el código ${qrCode}`);
    }
    return student;
  }

  async update(teacherId: string, id: string, name?: string, enrollmentNumber?: string, tutor?: string, tutorPhone?: string, group?: string, shift?: string) {
    await this.findOne(teacherId, id);
    if (enrollmentNumber) {
      const existing = await this.studentModel.findOne({
        enrollmentNumber,
        _id: { $ne: id }
      }).lean().exec();
      if (existing) {
        throw new ConflictException('La matrícula ya está registrada para otro alumno.');
      }
    }

    const updateFields: any = {};
    if (name !== undefined) updateFields.name = name;
    if (enrollmentNumber !== undefined) updateFields.enrollmentNumber = enrollmentNumber;
    if (tutor !== undefined) updateFields.tutor = tutor;
    if (tutorPhone !== undefined) updateFields.tutorPhone = tutorPhone;
    if (group !== undefined) updateFields.group = group;
    if (shift !== undefined) updateFields.shift = shift;

    return this.studentModel.findByIdAndUpdate(
      id,
      updateFields,
      { new: true },
    ).exec();
  }

  async remove(teacherId: string, id: string) {
    await this.findOne(teacherId, id);
    return this.studentModel.findByIdAndDelete(id).exec();
  }

  async getStudentSummary(teacherId: string, studentId: string) {
    // 1. Verify student ownership
    const student = await this.findOne(teacherId, studentId);

    // 2. Fetch all subjects for this teacher
    const subjects = await this.subjectModel.find({ teacher: teacherId }).select('_id name').lean().exec();
    const subjectIds = subjects.map(s => s._id);

    // 3. Fetch all assignments for these subjects
    const assignments = await this.assignmentModel.find({ subject: { $in: subjectIds } }).select('_id').lean().exec();
    const assignmentIds = assignments.map(a => a._id);

    // 4. Fetch grades for this student for these assignments
    const grades = await this.gradeModel.find({
      student: studentId,
      assignment: { $in: assignmentIds },
    })
    .select('_id score gradedAt manualCorrection assignment')
    .populate('assignment', '_id title maxScore dueDate subject')
    .lean()
    .exec();

    // 5. Fetch attendance records for this student
    const attendances = await this.attendanceModel.find({
      student: studentId,
    })
    .select('_id date status scannedAt')
    .lean()
    .exec();

    // 6. Compute summary metrics
    const totalAssignments = assignments.length;
    const gradedAssignments = grades.length;
    const pendingAssignments = Math.max(0, totalAssignments - gradedAssignments);

    let averageGradePercent = 0;
    if (gradedAssignments > 0) {
      let totalPercentSum = 0;
      for (const grade of grades) {
        const assignmentObj = grade.assignment as any;
        const maxScore = assignmentObj?.maxScore || 10;
        const percent = (grade.score / maxScore) * 100;
        totalPercentSum += percent;
      }
      averageGradePercent = Math.round(totalPercentSum / gradedAssignments);
    }

    const totalAttendanceDays = attendances.length;
    const presents = attendances.filter(a => a.status === 'PRESENT').length;
    const lates = attendances.filter(a => a.status === 'LATE').length;
    const absents = attendances.filter(a => a.status === 'ABSENT').length;
    const attendanceRate = totalAttendanceDays > 0 
      ? Math.round(((presents + lates) / totalAttendanceDays) * 100) 
      : 100;

    return {
      student,
      grades: grades.map(g => {
        const assignmentObj = g.assignment as any;
        const sub = subjects.find(s => s._id.toString() === assignmentObj?.subject?.toString());
        return {
          _id: g._id,
          score: g.score,
          gradedAt: g.gradedAt,
          manualCorrection: g.manualCorrection,
          assignment: {
            _id: assignmentObj?._id,
            title: assignmentObj?.title,
            maxScore: assignmentObj?.maxScore,
            dueDate: assignmentObj?.dueDate,
          },
          subjectName: sub ? sub.name : 'Asignatura Desconocida',
        };
      }),
      attendance: attendances.map(a => {
        return {
          _id: a._id,
          date: a.date,
          status: a.status,
          scannedAt: a.scannedAt,
        };
      }),
      summary: {
        totalAssignments,
        gradedAssignments,
        pendingAssignments,
        averageGradePercent,
        totalAttendanceDays,
        presents,
        lates,
        absents,
        attendanceRate,
      },
    };
  }

  async getDashboardMetrics(teacherId: string | undefined, date: string) {
    const dateToUse = date || new Date().toISOString().split('T')[0];
    const [yearStr, monthStr] = dateToUse.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    const monthPrefix = `${yearStr}-${monthStr.padStart(2, '0')}`;
    const startOfMonth = `${monthPrefix}-01`;
    const endOfMonth = `${monthPrefix}-${String(daysInMonth).padStart(2, '0')}`;

    let subjectQuery: any = {};
    if (teacherId) {
      subjectQuery = Types.ObjectId.isValid(teacherId)
        ? { $or: [{ teacher: teacherId }, { teacher: new Types.ObjectId(teacherId) }] }
        : { teacher: teacherId };
    }

    // 1. Ejecución paralela de consulta inicial: alumnos y asignaturas con proyección estricta
    const [students, subjects] = await Promise.all([
      this.findAll(teacherId, '_id name enrollmentNumber qrCode group shift tutor tutorPhone status'),
      this.subjectModel.find(subjectQuery).select('_id').lean().exec(),
    ]);

    if (!students || students.length === 0) {
      return [];
    }

    const studentIds = students.map((s) => s._id);
    const subjectIds = subjects.map((s) => s._id);
    const studentObjectIds = studentIds.map((s) => (Types.ObjectId.isValid(s) ? new Types.ObjectId(s.toString()) : s));
    const studentStringIds = studentIds.map((s) => s.toString());
    const allStudentIdsForQuery = Array.from(new Set([...studentObjectIds, ...studentStringIds]));

    // 2. Ejecución paralela: asistencia diaria, rango de mes (index scan) y tareas
    const [dailyRecords, monthlyRecords, assignments] = await Promise.all([
      this.attendanceModel
        .find({
          student: { $in: allStudentIdsForQuery },
          date: dateToUse,
        })
        .select('_id student status scannedAt updatedAt')
        .sort({ updatedAt: -1, _id: -1 })
        .lean()
        .exec(),

      // B-Tree range scan en vez de regex lento para usar índices compuestos en MongoDB
      this.attendanceModel
        .find({
          student: { $in: allStudentIdsForQuery },
          date: { $gte: startOfMonth, $lte: endOfMonth },
          status: { $in: ['PRESENT', 'LATE'] },
        })
        .select('student date status')
        .lean()
        .exec(),

      this.assignmentModel
        .find({
          subject: { $in: subjectIds },
        })
        .select('_id maxScore')
        .lean()
        .exec(),
    ]);

    const assignmentIds = assignments.map((a) => a._id);
    const assignmentMap = new Map<string, number>();
    for (const a of assignments) {
      assignmentMap.set(a._id.toString(), a.maxScore || 100);
    }

    // 3. Consulta de calificaciones con proyección select solo si hay tareas
    let grades: any[] = [];
    if (assignmentIds.length > 0) {
      grades = await this.gradeModel
        .find({
          student: { $in: studentIds },
          assignment: { $in: assignmentIds },
        })
        .select('student assignment score')
        .lean()
        .exec();
    }

    // 4. Indexación en Hash Maps en memoria para resolución O(1) eliminando bucles anidados N*M
    const dailyMap = new Map<string, { _id: any; status: string; scannedAt: Date }>();
    for (const r of dailyRecords) {
      const sId = r.student.toString();
      // Al ordenar por updatedAt: -1, el primer registro procesado es el más reciente
      if (!dailyMap.has(sId)) {
        dailyMap.set(sId, {
          _id: r._id,
          status: r.status,
          scannedAt: r.scannedAt,
        });
      }
    }

    const monthlyCountMap = new Map<string, number>();
    const distinctDates = new Set<string>();
    for (const r of monthlyRecords) {
      const sId = r.student.toString();
      monthlyCountMap.set(sId, (monthlyCountMap.get(sId) || 0) + 1);
      if (r.date) {
        distinctDates.add(r.date);
      }
    }

    const studentScoreTotals = new Map<string, { totalPercent: number; validCount: number }>();
    for (const g of grades) {
      const sId = g.student.toString();
      const maxScore = assignmentMap.get(g.assignment.toString()) || 100;
      if (maxScore > 0 && typeof g.score === 'number') {
        const item = studentScoreTotals.get(sId) || { totalPercent: 0, validCount: 0 };
        item.totalPercent += (g.score / maxScore) * 100;
        item.validCount += 1;
        studentScoreTotals.set(sId, item);
      }
    }

    const activeDaysCount = Math.max(1, distinctDates.size);

    // 5. Mapeo final en una sola pasada lineal O(N)
    return students.map((student) => {
      const studentIdStr = student._id.toString();
      const dailyRecord = dailyMap.get(studentIdStr);
      const status = dailyRecord?.status || 'ABSENT';

      const attendedDaysCount = monthlyCountMap.get(studentIdStr) || 0;
      const attendanceRatio = `${attendedDaysCount} / ${daysInMonth}`;

      const scoreInfo = studentScoreTotals.get(studentIdStr);
      const homeworkScore =
        scoreInfo && scoreInfo.validCount > 0
          ? Math.round(scoreInfo.totalPercent / scoreInfo.validCount)
          : 0;

      return {
        studentId: student._id,
        name: student.name,
        enrollmentNumber: student.enrollmentNumber || '',
        qrCode: student.qrCode || '',
        tutor: student.tutor || '',
        tutorPhone: student.tutorPhone || '',
        group: student.group || '3° B',
        shift: student.shift || 'Matutino',
        badgeStatus: student.status || 'EMITTED',
        attendanceId: dailyRecord?._id || null,
        status,
        scannedAt: dailyRecord?.scannedAt || null,
        attendedDaysCount,
        daysInMonth,
        attendanceRatio,
        homeworkScore,
      };
    });
  }
}

