import { prisma } from '@/config';

async function findAllRoomsByHotelId(hotelId: number) {
  return prisma.room.findMany({
    where: {
      hotelId,
    },
  });
}

async function findRoomById(roomId: number) {
  return prisma.room.findFirst({
    where: {
      id: roomId,
    },
  });
}

const roomRepository = {
  findAllRoomsByHotelId,
  findRoomById,
};

export default roomRepository;
