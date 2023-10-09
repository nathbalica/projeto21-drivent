import { cannotBookingError, enrollmentNotFoundError, notFoundError } from '@/errors';
import roomRepository from '@/repositories/room-repository';
import bookingRepository from '@/repositories/booking-repository';
import { enrollmentRepository } from '@/repositories/enrollments-repository';
import { ticketsRepository } from '@/repositories/tickets-repository';
import { noEnrollmentOrInvalidTicketError } from '@/errors/not-enrollment-or-invalid-ticket-error';

async function getBookingByUserId(userId: number) {
  const booking = await bookingRepository.findByUserId(userId);

  if (!booking) throw notFoundError();

  return booking;
}

async function createBookRoom(userId: number, roomId: number) {
  await validateRoomCapacity(roomId); // Movido para o início
  await validateEnrollmentAndTicket(userId);
  return bookingRepository.createBooking({ roomId, userId });
}



async function modifyBooking(userId: number, roomId: number) {

  const existingBooking = await bookingRepository.findByUserId(userId);

  if (!existingBooking) {
    throw cannotBookingError();
  }

  if (existingBooking.userId !== userId) {
    throw cannotBookingError();
  }

  await validateRoomCapacity(roomId);

  return bookingRepository.upsertBooking({
    id: existingBooking.id,
    roomId,
    userId,
  });
}




async function validateEnrollmentAndTicket(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw noEnrollmentOrInvalidTicketError('error');

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket || ticket.status !== 'PAID' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw noEnrollmentOrInvalidTicketError('error');
  }
}

async function validateRoomCapacity(roomId: number) {
  const room = await roomRepository.findRoomById(roomId);
  if (!room) throw notFoundError();

  const currentBookings = await bookingRepository.findByRoomId(roomId);
  if (room.capacity <= currentBookings.length) {
    throw cannotBookingError();
  }
}



const bookingService = {
  getBookingByUserId,
  createBookRoom,
  modifyBooking,
};

export default bookingService;
