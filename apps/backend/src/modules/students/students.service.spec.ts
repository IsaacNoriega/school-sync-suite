import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { StudentsService } from './students.service';
import { Student } from '../../database/schemas/student.schema';
import { Attendance } from '../../database/schemas/attendance.schema';
import { Grade } from '../../database/schemas/grade.schema';
import { Assignment } from '../../database/schemas/assignment.schema';
import { Subject } from '../../database/schemas/subject.schema';

describe('StudentsService (Unit)', () => {
  let service: StudentsService;
  let mockStudentModel: any;
  let mockAttendanceModel: any;
  let mockGradeModel: any;
  let mockAssignmentModel: any;
  let mockSubjectModel: any;

  const mockTeacherId = new Types.ObjectId().toString();
  const mockStudentId = new Types.ObjectId();

  beforeEach(async () => {
    mockStudentModel = {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
    };

    mockAttendanceModel = {
      find: jest.fn(),
      aggregate: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
    };

    mockGradeModel = {
      find: jest.fn(),
    };

    mockAssignmentModel = {
      find: jest.fn(),
    };

    mockSubjectModel = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: getModelToken(Student.name), useValue: mockStudentModel },
        { provide: getModelToken(Attendance.name), useValue: mockAttendanceModel },
        { provide: getModelToken(Grade.name), useValue: mockGradeModel },
        { provide: getModelToken(Assignment.name), useValue: mockAssignmentModel },
        { provide: getModelToken(Subject.name), useValue: mockSubjectModel },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardMetrics', () => {
    it('debe calcular métricas del dashboard utilizando el pipeline de agregación en MongoDB', async () => {
      const mockStudents = [
        {
          _id: mockStudentId,
          name: 'Ana Sofía',
          enrollmentNumber: 'A001',
          qrCode: 'QR_001',
          group: '3° A',
          shift: 'Matutino',
          tutor: 'Padre Familia',
          status: 'EMITTED',
        },
      ];

      // Mock findAll students
      mockStudentModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockStudents),
        }),
      });

      // Mock subjects find
      mockSubjectModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([{ _id: new Types.ObjectId() }]),
        }),
      });

      // Mock daily attendance record find
      mockAttendanceModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            {
              _id: new Types.ObjectId(),
              student: mockStudentId,
              status: 'PRESENT',
              scannedAt: new Date(),
            },
          ]),
        }),
      });

      // Mock monthly aggregate ($match + $group)
      mockAttendanceModel.aggregate.mockResolvedValue([
        {
          _id: mockStudentId,
          attendedDaysCount: 15,
        },
      ]);

      // Mock assignments find
      const mockAssignmentId = new Types.ObjectId();
      mockAssignmentModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            { _id: mockAssignmentId, maxScore: 10 },
          ]),
        }),
      });

      // Mock grades find
      mockGradeModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            { student: mockStudentId, assignment: mockAssignmentId, score: 9 },
          ]),
        }),
      });

      const metrics = await service.getDashboardMetrics(mockTeacherId, '2026-09-21');

      expect(mockAttendanceModel.aggregate).toHaveBeenCalledWith([
        expect.objectContaining({
          $match: expect.objectContaining({
            status: { $in: ['PRESENT', 'LATE'] },
            date: expect.objectContaining({
              $gte: '2026-09-01',
              $lte: '2026-09-30',
            }),
          }),
        }),
        expect.objectContaining({
          $group: {
            _id: '$student',
            attendedDaysCount: { $sum: 1 },
          },
        }),
      ]);

      expect(metrics).toHaveLength(1);
      expect(metrics[0].studentId).toBe(mockStudentId.toString());
      expect(metrics[0].status).toBe('PRESENT');
      expect(metrics[0].attendedDaysCount).toBe(15);
      expect(metrics[0].daysInMonth).toBe(30);
      expect(metrics[0].attendanceRatio).toBe('15 / 30');
      expect(metrics[0].homeworkScore).toBe(90); // (9 / 10) * 100
    });
  });
});
