import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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

  async create(teacherId: string, name: string, enrollmentNumber?: string) {
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
    });
  }

  async findAll(teacherId: string) {
    return this.studentModel.find({ teacher: teacherId }).lean().exec();
  }

  async findOne(teacherId: string, id: string) {
    const student = await this.studentModel.findById(id).lean().exec();
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    if (student.teacher.toString() !== teacherId) {
      throw new ForbiddenException('You do not own this student');
    }
    return student;
  }

  async findByQrCode(qrCode: string) {
    const student = await this.studentModel.findOne({ qrCode }).lean().exec();
    if (!student) {
      throw new NotFoundException(`Student with QR code ${qrCode} not found`);
    }
    return student;
  }

  async update(teacherId: string, id: string, name?: string, enrollmentNumber?: string) {
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

    return this.studentModel.findByIdAndUpdate(
      id,
      { name, enrollmentNumber },
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
      }
    };
  }
}

