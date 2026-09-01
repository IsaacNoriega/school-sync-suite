import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WS_EVENTS } from '@school-sync/shared';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Teacher } from '../../database/schemas/teacher.schema';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class AppGateway {
  constructor(
    private jwtService: JwtService,
    @InjectModel(Teacher.name) private teacherModel: Model<Teacher>,
  ) {}

  @WebSocketServer()
  server: Server;

  @SubscribeMessage(WS_EVENTS.JOIN_ROOM)
  async handleJoinRoom(
    @MessageBody() data: { teacherId: string; token: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data || !data.token || !data.teacherId) {
      throw new WsException('Missing token or teacherId');
    }
    try {
      const payload = this.jwtService.verify(data.token, {
        secret: process.env.JWT_SECRET
      });
      
      let tokenTeacherId = payload.teacherId;
      if (!tokenTeacherId && payload.role === 'TEACHER') {
        // Fallback for older tokens that don't have teacherId in payload
        const teacher = await this.teacherModel.findOne({ user: payload.sub }).lean().exec();
        if (teacher) {
          tokenTeacherId = teacher._id.toString();
        }
      }

      // Allow if SUPER_ADMIN or if it's the teacher themself
      if (payload.role !== 'SUPER_ADMIN' && payload.sub !== data.teacherId && tokenTeacherId !== data.teacherId) {
        throw new WsException('Unauthorized');
      }
      
      const roomName = `teacher_${data.teacherId}`;
      client.join(roomName);
      console.log(`Socket Client ${client.id} joined room: ${roomName}`);
      client.emit('joined_room', { room: roomName });
    } catch (err: any) {
      console.error('Socket join room auth failed:', err.message);
      throw new WsException('Unauthorized or invalid token');
    }
  }

  sendAttendanceScan(teacherId: string, attendanceData: any) {
    const roomName = `teacher_${teacherId}`;
    this.server.to(roomName).emit(WS_EVENTS.STUDENT_SCANNED_ATTENDANCE, attendanceData);
    console.log(`Broadcasted attendance scan to room: ${roomName}`);
  }

  sendGradeScan(teacherId: string, gradeData: any) {
    const roomName = `teacher_${teacherId}`;
    this.server.to(roomName).emit(WS_EVENTS.STUDENT_SCANNED_GRADE, gradeData);
    console.log(`Broadcasted grade scan to room: ${roomName}`);
  }
}
