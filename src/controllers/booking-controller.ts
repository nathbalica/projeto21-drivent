import { Response } from 'express';
import httpStatus from 'http-status';
import { AuthenticatedRequest } from '@/middlewares';
import bookingService from '@/services/booking-service';

export async function getBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;

  const booking = await bookingService.getBookingByUserId(userId);
  console.log(booking.Room)

  res.status(httpStatus.OK).send({
    id: booking.id,
    Room: booking.Room,
  });
}

export async function createBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  const { roomId } = req.body;

  const booking = await bookingService.createBookRoom(userId, Number(roomId));

  res.status(httpStatus.OK).send({
    bookingId: booking.id,
  });
}

export async function updateBooking(req: AuthenticatedRequest, res: Response) {
  const { userId } = req;
  // const { bookingId } = req.params;
  const { roomId } = req.body;
  // console.log(roomId)

  const booking = await bookingService.modifyBooking(userId, Number(roomId));

  res.status(httpStatus.OK).send({ bookingId: booking.id });
}
