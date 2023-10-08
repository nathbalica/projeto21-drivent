import { cannotBookingError, notFoundError } from '@/errors';
import roomRepository from '@/repositories/room-repository';
import bookingRepository from '@/repositories/booking-repository';
import { enrollmentRepository } from '@/repositories/enrollments-repository';
import { ticketsRepository } from '@/repositories/tickets-repository';

async function getBookingByUserId(userId: number) {
  const booking = await bookingRepository.findByUserId(userId);

  if (!booking) throw notFoundError();

  return booking;
}

async function createBookRoom(userId: number, roomId: number) {
  await validateEnrollmentAndTicket(userId);
  await validateRoomCapacity(roomId);

  return bookingRepository.createBooking({ roomId, userId });
}

async function modifyBooking(userId: number, roomId: number) {
  await validateRoomCapacity(roomId);

  const existingBooking = await bookingRepository.findByUserId(userId);
  if (!existingBooking || existingBooking.userId !== userId) {
    throw cannotBookingError();
  }

  return bookingRepository.upsertBooking({
    id: existingBooking.id,
    roomId,
    userId,
  });
}

async function validateEnrollmentAndTicket(userId: number) {
  const enrollment = await enrollmentRepository.findWithAddressByUserId(userId);
  if (!enrollment) throw cannotBookingError();

  const ticket = await ticketsRepository.findTicketByEnrollmentId(enrollment.id);
  if (!ticket || ticket.status !== 'PAID' || ticket.TicketType.isRemote || !ticket.TicketType.includesHotel) {
    throw cannotBookingError();
  }
}

async function validateRoomCapacity(roomId: number) {
  const room = await roomRepository.findRoomById(roomId);
  const currentBookings = await bookingRepository.findByRoomId(roomId);

  if (!room) throw notFoundError();
  if (room.capacity <= currentBookings.length) throw cannotBookingError();
}

const bookingService = {
  getBookingByUserId,
  createBookRoom,
  modifyBooking,
};

export default bookingService;
