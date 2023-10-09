import bookingRepository from '@/repositories/booking-repository';
import roomRepository from '@/repositories/room-repository';
import { enrollmentRepository } from '@/repositories';
import { ticketsRepository } from '@/repositories';
import bookingService from '@/services/booking-service';
import faker from '@faker-js/faker';
import { createHotel, createRoomWithHotelId } from '../factories/hotels-factory';
import { createBookingFactory, createUser } from '../factories';
import { prisma } from '@/config';
import { TicketStatus } from '@prisma/client';
import { ticketsService } from '../../src/services/tickets-service';


describe("Booking Service Tests", () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("GET tests", () => {
        it("should throw an error if user doesn't have a booking", async () => {
            jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce(null);

            await expect(bookingService.getBookingByUserId(1)).rejects.toEqual({
                name: "NotFoundError",
                message: "No result for this search!"
            });
        });

    });


    describe("POST tests", () => {
        it("should throw an error if roomId does not exist", async () => {
            jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce(null);

            await expect(bookingService.createBookRoom(1, 1)).rejects.toEqual({
                name: "NotFoundError",
                message: "No result for this search!"
            });
        });

        it("should throw an error if room capacity is full", async () => {
            const mockRoom = {
                id: 1,
                name: 'qualquer',
                capacity: 3,
                hotelId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
        
            const mockBooking = {
                id: 1,
                userId: 1,
                roomId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                Room: mockRoom
            };
        
            jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce(mockRoom);
            jest.spyOn(bookingRepository, 'findByRoomId').mockResolvedValueOnce([mockBooking, mockBooking, mockBooking]);
        
            await expect(bookingService.createBookRoom(1, 1)).rejects.toEqual({
                name: "CannotBookingError",
                message: "Cannot booking this room! Overcapacity!"
            });
        });
        


    });


    describe("PUT tests", () => {
            it("should throw an error if roomId does not exist for modifying booking", async () => {
                jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce(null);

                await expect(bookingService.modifyBooking(1, 1)).rejects.toEqual({
                    name: "NotFoundError",
                    message: "No result for this search!"
                });
            });


            // it("should throw an error if bookingId doesn't have a reservation", async () => {
            //     jest.spyOn(bookingRepository, 'findByUserId').mockResolvedValueOnce(null);
              
            //     await expect(bookingService.modifyBooking(1, 1)).rejects.toEqual({
            //         name: "CannotBookingError",
            //         message: "Cannot booking this room! Overcapacity!"
            //       });
            //   });
              

            it("should throw an error if no vacancy in the new room", async () => {
                const mockRoom = {
                    id: 2,
                    name: 'outro',
                    capacity: 3,
                    hotelId: 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            
                const mockBooking = {
                    id: 1,
                    userId: 1,
                    roomId: 2,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    Room: mockRoom
                };

                const mockBooking2 = {
                    id: 1,
                    userId: 2,
                    roomId: 2,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    Room: mockRoom
                };

                const mockBooking3 = {
                    id: 1,
                    userId: 3,
                    roomId: 2,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    Room: mockRoom
                };
            
                jest.spyOn(roomRepository, 'findRoomById').mockResolvedValueOnce(mockRoom);

                jest.spyOn(bookingRepository, 'findByRoomId').mockResolvedValueOnce([mockBooking, mockBooking2, mockBooking3]);
            
                await expect(bookingService.modifyBooking(1, 2)).rejects.toEqual({
                    name: "CannotBookingError",
                    message: "Cannot booking this room! Overcapacity!"
                });
            });
            
    });

});
