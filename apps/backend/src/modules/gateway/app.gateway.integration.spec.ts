import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { io, Socket } from 'socket.io-client';
import { AppGateway } from './app.gateway';
import { Teacher } from '../../database/schemas/teacher.schema';

describe('AppGateway - Handshake Security (Integration)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let port: number;

  const mockTeacherModel = {
    findOne: jest.fn().mockReturnValue({
      lean: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 't_mock_123' }),
      }),
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      providers: [
        AppGateway,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: getModelToken(Teacher.name),
          useValue: mockTeacherModel,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0);
    const address = app.getHttpServer().address();
    port = typeof address === 'string' ? 3001 : address.port;
    jwtService = moduleFixture.get<JwtService>(JwtService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  const createClientSocket = (token?: string): Socket => {
    return io(`http://localhost:${port}`, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false,
      auth: token ? { token } : undefined,
    });
  };

  it('debe abortar la conexión en el handshake si no se envía ningún token', (done) => {
    const client = createClientSocket();

    client.on('connect_error', (err) => {
      expect(err.message).toBe('AUTH_TOKEN_REQUIRED');
      client.disconnect();
      done();
    });

    client.connect();
  });

  it('debe abortar la conexión si el token JWT es inválido o expiró', (done) => {
    jest.spyOn(jwtService, 'verify').mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const client = createClientSocket('expired_token_xyz');

    client.on('connect_error', (err) => {
      expect(err.message).toBe('UNAUTHORIZED_HANDSHAKE');
      client.disconnect();
      done();
    });

    client.connect();
  });

  it('debe autorizar el handshake y unir automáticamente al profesor a su canal', (done) => {
    const teacherPayload = {
      sub: 'user_prof_99',
      role: 'TEACHER',
      teacherId: 't_mock_123',
    };

    jest.spyOn(jwtService, 'verify').mockReturnValue(teacherPayload as any);

    const client = createClientSocket('valid_jwt_token');

    client.on('joined_room', (data) => {
      expect(data.room).toBe('teacher_t_mock_123');
      client.disconnect();
      done();
    });

    client.on('connect', () => {
      expect(client.connected).toBe(true);
    });

    client.connect();
  });
});
