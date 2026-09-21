import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';
import { GradesService } from './grades.service';
import { Grade } from '../../database/schemas/grade.schema';
import { StudentsService } from '../students/students.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { AppGateway } from '../gateway/app.gateway';

describe('GradesService (Unit)', () => {
  let service: GradesService;
  let mockGradeModel: any;
  let mockStudentsService: any;
  let mockAssignmentsService: any;
  let mockAppGateway: any;

  const mockTeacherId = new Types.ObjectId().toString();
  const mockAssignmentId = new Types.ObjectId().toString();
  const mockStudentId = new Types.ObjectId().toString();

  beforeEach(async () => {
    mockGradeModel = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      find: jest.fn(),
    };

    mockStudentsService = {
      findByQrCode: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };

    mockAssignmentsService = {
      findOne: jest.fn(),
    };

    mockAppGateway = {
      sendGradeScan: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        {
          provide: getModelToken(Grade.name),
          useValue: mockGradeModel,
        },
        {
          provide: StudentsService,
          useValue: mockStudentsService,
        },
        {
          provide: AssignmentsService,
          useValue: mockAssignmentsService,
        },
        {
          provide: AppGateway,
          useValue: mockAppGateway,
        },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('scanGrade', () => {
    it('debe rechazar una calificación fuera del rango máximo', async () => {
      mockAssignmentsService.findOne.mockResolvedValue({
        _id: mockAssignmentId,
        maxScore: 10,
      });

      await expect(
        service.scanGrade(mockTeacherId, mockAssignmentId, 'QR_001', 11)
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe rechazar si el estudiante no pertenece al docente', async () => {
      mockAssignmentsService.findOne.mockResolvedValue({
        _id: mockAssignmentId,
        maxScore: 10,
      });
      mockStudentsService.findByQrCode.mockResolvedValue({
        _id: mockStudentId,
        teacher: new Types.ObjectId().toString(), // Docente diferente
      });

      await expect(
        service.scanGrade(mockTeacherId, mockAssignmentId, 'QR_001', 9)
      ).rejects.toThrow(ForbiddenException);
    });

    it('debe registrar o actualizar la calificación atómicamente con findOneAndUpdate', async () => {
      mockAssignmentsService.findOne.mockResolvedValue({
        _id: mockAssignmentId,
        maxScore: 10,
      });
      mockStudentsService.findByQrCode.mockResolvedValue({
        _id: mockStudentId,
        name: 'Carlos Ruiz',
        enrollmentNumber: 'A123',
        teacher: mockTeacherId,
      });

      // No existe previamente
      mockGradeModel.findOne.mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(null) }),
      });

      const updatedDoc = {
        _id: new Types.ObjectId(),
        student: new Types.ObjectId(mockStudentId),
        assignment: new Types.ObjectId(mockAssignmentId),
        score: 9.5,
        gradedAt: new Date(),
      };

      mockGradeModel.findOneAndUpdate.mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(updatedDoc) }),
      });

      const result = await service.scanGrade(mockTeacherId, mockAssignmentId, 'QR_001', 9.5);

      expect(mockGradeModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          student: expect.any(Types.ObjectId),
          assignment: expect.any(Types.ObjectId),
        },
        expect.objectContaining({
          $set: expect.objectContaining({ score: 9.5, manualCorrection: false }),
        }),
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      expect(mockAppGateway.sendGradeScan).toHaveBeenCalledTimes(1);
      expect(result.alreadyGraded).toBe(false);
      expect(result.score).toBe(9.5);
    });
  });

  describe('manualCorrection', () => {
    it('debe aplicar corrección manual atómicamente', async () => {
      mockAssignmentsService.findOne.mockResolvedValue({
        _id: mockAssignmentId,
        maxScore: 10,
      });
      mockStudentsService.findOne.mockResolvedValue({
        _id: mockStudentId,
        teacher: mockTeacherId,
      });

      const updatedDoc = {
        _id: new Types.ObjectId(),
        student: new Types.ObjectId(mockStudentId),
        assignment: new Types.ObjectId(mockAssignmentId),
        score: 8,
        manualCorrection: true,
        gradedAt: new Date(),
      };

      mockGradeModel.findOneAndUpdate.mockReturnValue({
        lean: () => ({ exec: jest.fn().mockResolvedValue(updatedDoc) }),
      });

      const result = await service.manualCorrection(mockTeacherId, mockStudentId, mockAssignmentId, 8);

      expect(mockGradeModel.findOneAndUpdate).toHaveBeenCalledWith(
        {
          student: expect.any(Types.ObjectId),
          assignment: expect.any(Types.ObjectId),
        },
        expect.objectContaining({
          $set: expect.objectContaining({ score: 8, manualCorrection: true }),
        }),
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      expect(result.score).toBe(8);
      expect(result.manualCorrection).toBe(true);
    });
  });
});
