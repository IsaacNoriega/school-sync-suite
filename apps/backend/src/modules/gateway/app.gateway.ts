import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WS_EVENTS } from '@school-sync/shared';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AppGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage(WS_EVENTS.JOIN_ROOM)
  handleJoinRoom(
    @MessageBody() data: { teacherId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (data && data.teacherId) {
      const roomName = `teacher_${data.teacherId}`;
      client.join(roomName);
      console.log(`Socket Client ${client.id} joined room: ${roomName}`);
      client.emit('joined_room', { room: roomName });
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
