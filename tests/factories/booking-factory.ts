import faker from "@faker-js/faker";
import { Booking } from "@prisma/client";
import { prisma } from "@/config";


type ParamsCreateBooking = {
    roomId: number,
    userId: number,
}

export function createBookingFactory({roomId, userId}: ParamsCreateBooking){
    return prisma.booking.create({
        data: {
            userId,
            roomId
        }
    })
}