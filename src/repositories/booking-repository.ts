import { Booking } from '@prisma/client';
import { prisma } from '@/config';

export type CreateParams = Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateParams = Omit<Booking, 'createdAt' | 'updatedAt'>;

async function createBooking({ roomId, userId }: CreateParams): Promise<Booking> {
  return prisma.booking.create({
    data: {
      roomId,
      userId,
    },
  });
}

async function findByRoomId(roomId: number) {
  return prisma.booking.findMany({
    where: {
      roomId,
    },
    include: {
      Room: true,
    },
  });
}

async function findByUserId(userId: number) {
  return prisma.booking.findFirst({
    where: {
      userId,
    },
    include: {
      Room: true
    },
  });
}

async function upsertBooking({ id, roomId, userId }: UpdateParams) {
  return prisma.booking.upsert({
    where: {
      id,
    },
    create: {
      roomId,
      userId,
    },
    update: {
      roomId,
    },
  });
}

const bookingRepository = {
  createBooking,
  findByRoomId,
  findByUserId,
  upsertBooking,
};

export default bookingRepository;
