import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WS_EVENTS } from '@school-sync/shared';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Teacher } from '../../database/schemas/teacher.schema';

export interface ScanBroadcastPayload {
  type: 'attendance' | 'grade';
  attendanceId?: string;
  gradeId?: string;
  studentId: string;
  studentName: string;
  studentEnrollment: string;
  enrollmentNumber?: string;
  subjectId: string;
  timestamp: string | Date;
  scannedAt?: string | Date;
  gradedAt?: string | Date;
  status?: string;
  score?: number;
}

@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => {
      const allowed = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:3000')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS Socket blocked'), false);
      }
    },
    credentials: true,
  },
})
export class AppGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(Teacher.name) private readonly teacherModel: Model<Teacher>,
  ) {}

  @WebSocketServer()
  server: Server;

  /**
   * Middleware de seguridad en el Handshake inicial de Socket.io
   * Aborta conexiones no autenticadas antes de establecer el túnel WebSocket.
   */
  afterInit(server: Server) {
    server.use(async (socket: Socket, next) => {
      const token =
        socket.handshake.auth?.token ||
        (socket.handshake.headers['authorization'] as string)?.replace('Bearer ', '');

      if (!token) {
        this.logger.warn(`[Socket Security] Handshake rechazado (${socket.id}): Token ausente.`);
        return next(new Error('AUTH_TOKEN_REQUIRED'));
      }

      try {
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET,
        });

        let tokenTeacherId = payload.teacherId;
        // Fallback: solo si el token no incluye teacherId y el rol es TEACHER
        if (!tokenTeacherId && payload.role === 'TEACHER') {
          const teacher = await this.teacherModel.findOne({ user: payload.sub }).lean().exec();
          if (teacher) {
            tokenTeacherId = (teacher as any)._id.toString();
          }
        }

        // Inyectar datos de sesión autenticada en el socket
        socket.data = {
          user: {
            ...payload,
            teacherId: tokenTeacherId,
          },
        };

        next();
      } catch (err: any) {
        this.logger.warn(`[Socket Security] Handshake inválido (${socket.id}): ${err.message}`);
        return next(new Error('UNAUTHORIZED_HANDSHAKE'));
      }
    });
  }

  /**
   * Conexión autorizada: se suscribe automáticamente a los canales del docente
   */
  async handleConnection(client: Socket) {
    const user = client.data?.user;
    if (!user) {
      client.disconnect(true);
      return;
    }

    if (user.role === 'TEACHER' && user.teacherId) {
      const roomName = `teacher_${user.teacherId}`;
      client.join(roomName);
      this.logger.log(`[Socket Security] Socket ${client.id} autenticado en handshake. Unido a: ${roomName}`);
      client.emit('joined_room', { room: roomName });
    }
  }

  /**
   * Limpieza y trazabilidad al desconectar sockets
   */
  handleDisconnect(client: Socket) {
    const user = client.data?.user;
    this.logger.log(`Socket ${client.id} desconectado ${user ? `(Usuario: ${user.sub})` : ''}`);
  }

  @SubscribeMessage(WS_EVENTS.JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody() data: { teacherId: string; token?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const sessionUser = client.data?.user;
    if (!sessionUser) {
      throw new WsException('No autenticado en handshake');
    }

    // El handshake ya validó el token; validamos coherencia con el teacherId
    if (
      sessionUser.role !== 'SUPER_ADMIN' &&
      sessionUser.sub !== data.teacherId &&
      sessionUser.teacherId !== data.teacherId
    ) {
      throw new WsException('Unauthorized room subscription');
    }

    const roomName = `teacher_${data.teacherId}`;
    client.join(roomName);
    client.emit('joined_room', { room: roomName });
  }

  /**
   * Broadcast seguro y sanitizado de asistencia
   */
  sendAttendanceScan(teacherId: string, attendanceData: any) {
    const roomName = `teacher_${teacherId}`;
    const studentEnrollment =
      attendanceData.studentEnrollment ||
      attendanceData.enrollmentNumber ||
      attendanceData.student?.enrollmentNumber ||
      attendanceData.student?.enrollment ||
      '';
    const scannedTimestamp =
      attendanceData.scannedAt ||
      attendanceData.timestamp ||
      attendanceData.date ||
      new Date().toISOString();

    const payload: ScanBroadcastPayload = {
      type: 'attendance',
      attendanceId: attendanceData._id?.toString() || attendanceData.attendanceId?.toString() || '',
      studentId:
        attendanceData.studentId?._id?.toString() ||
        attendanceData.studentId?.toString() ||
        attendanceData.student?._id?.toString() ||
        attendanceData.student?.toString() ||
        '',
      studentName:
        attendanceData.studentName || attendanceData.name || attendanceData.student?.name || 'Estudiante',
      studentEnrollment,
      enrollmentNumber: studentEnrollment,
      subjectId: attendanceData.subjectId?.toString() || '',
      timestamp: scannedTimestamp,
      scannedAt: scannedTimestamp,
      status: attendanceData.status || 'PRESENT',
    };

    this.server.to(roomName).emit('newScanRecord', payload);
    this.logger.log(`Broadcasted attendance scan to room: ${roomName}`);
  }

  /**
   * Broadcast seguro y sanitizado de calificación
   */
  sendGradeScan(teacherId: string, gradeData: any) {
    const roomName = `teacher_${teacherId}`;
    const studentEnrollment =
      gradeData.studentEnrollment ||
      gradeData.enrollmentNumber ||
      gradeData.student?.enrollmentNumber ||
      gradeData.student?.enrollment ||
      '';
    const gradedTimestamp =
      gradeData.gradedAt || gradeData.timestamp || new Date().toISOString();

    const payload: ScanBroadcastPayload = {
      type: 'grade',
      gradeId: gradeData._id?.toString() || gradeData.gradeId?.toString() || '',
      studentId:
        gradeData.studentId?._id?.toString() ||
        gradeData.studentId?.toString() ||
        gradeData.student?._id?.toString() ||
        gradeData.student?.toString() ||
        '',
      studentName: gradeData.studentName || gradeData.name || gradeData.student?.name || 'Estudiante',
      studentEnrollment,
      enrollmentNumber: studentEnrollment,
      subjectId: gradeData.subjectId?.toString() || '',
      timestamp: gradedTimestamp,
      gradedAt: gradedTimestamp,
      score: gradeData.score,
    };

    this.server.to(roomName).emit('newScanRecord', payload);
    this.logger.log(`Broadcasted grade scan to room: ${roomName}`);
  }
}

