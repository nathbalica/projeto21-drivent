// bookingRoutes.ts

import { Router } from 'express';
import { getBooking, createBooking, updateBooking } from '@/controllers/booking-controller';
import { authenticateToken } from '@/middlewares';

const bookingRouter = Router();

bookingRouter
  .all('/*', authenticateToken)
  .get('/', getBooking)
  .post('/', createBooking)
  .put('/:bookingId', updateBooking);

export { bookingRouter };
