import supertest from 'supertest';
import httpStatus from 'http-status';
import faker from '@faker-js/faker';
import * as jwt from 'jsonwebtoken';
import { createEnrollmentWithAddress, createTicketType, createUser, createTicket, createPayment } from '../factories';
import { cleanDb, generateValidToken } from '../helpers';

import app, { init } from '@/app';
import { TicketStatus } from '@prisma/client';
import { createHotel, createRoomWithHotelId } from '../factories/hotels-factory';
import { createBookingFactory } from '../factories/booking-factory';

beforeAll(async () => {
    await init();
});

beforeEach(async () => {
    await cleanDb();
});

const server = supertest(app);

describe('GET /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
        const response = await server.get('/booking');

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();

        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);

        const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe('when token is valid', () => {
        it("should respond with status 404 when user has not a booking", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            const payment = await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            await createRoomWithHotelId(hotel.id)

            const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        })

        it("should respond with status 200 when user has a booking", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            const payment = await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id)

            const createdBooking = await createBookingFactory({
                userId: user.id,
                roomId: room.id
            })

            const response = await server.get('/booking').set('Authorization', `Bearer ${token}`);
            expect(response.status).toEqual(httpStatus.OK);
            expect(response.body).toEqual({
                id: createdBooking.id,
                Room: {
                    id: expect.any(Number),
                    name: expect.any(String),
                    capacity: expect.any(Number),
                    hotelId: expect.any(Number),
                    createdAt: expect.any(String),
                    updatedAt: expect.any(String)
                }
            })
        })

    });
});


describe('POST /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
        const validateBody = {
            roomId: 1
        }
        const response = await server.post('/booking').send(validateBody);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();
        const validateBody = {
            roomId: 1
        }
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(validateBody);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
        const validateBody = {
            roomId: 1
        }
        const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send(validateBody);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe('when token is valid', () => {
        it("should respond with status 400 with invalid body", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            await createRoomWithHotelId(hotel.id);

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: 0 });
            expect(response.status).toEqual(httpStatus.BAD_REQUEST);
        })

        it("should respond with status 404 when there's not roomId", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id);

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id + 2 });
            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        })

        it("should respond with status 403 when there's not VACANCY", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id);

            await createBookingFactory({ userId: user.id, roomId: room.id })
            await createBookingFactory({ userId: user.id, roomId: room.id })
            await createBookingFactory({ userId: user.id, roomId: room.id })

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
            expect(response.status).toEqual(httpStatus.FORBIDDEN);
        })

        it("should respond with status 403 when user has not enrollment", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            await createTicketType(false, true)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id);

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
            expect(response.status).toEqual(httpStatus.FORBIDDEN);
        })

        it("should respond with status 403 when user has not payment ticket", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.RESERVED)
            await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id);

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
            expect(response.status).toEqual(httpStatus.FORBIDDEN);
        })

        it("should respond with status 200 with valid body", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id);

            const response = await server.post('/booking').set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
            expect(response.status).toEqual(httpStatus.OK);
        })

    });
});


describe('PUT /booking', () => {
    it('should respond with status 401 if no token is given', async () => {
        const validateBody = {
            roomId: 1
        }
        const response = await server.put('/booking/1').send(validateBody);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if given token is not valid', async () => {
        const token = faker.lorem.word();
        const validateBody = {
            roomId: 1
        }
        const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`).send(validateBody);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    it('should respond with status 401 if there is no session for given token', async () => {
        const userWithoutSession = await createUser();
        const token = jwt.sign({ userId: userWithoutSession.id }, process.env.JWT_SECRET);
        const validateBody = {
            roomId: 1
        }
        const response = await server.put('/booking/1').set('Authorization', `Bearer ${token}`).send(validateBody);

        expect(response.status).toBe(httpStatus.UNAUTHORIZED);
    });

    describe('when token is valid', () => {
        it("should respond with status 200 with valid body", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id);

            const booking = await createBookingFactory({
                roomId: room.id,
                userId: user.id,
            })

            const updateRoom = await createRoomWithHotelId(hotel.id)

            const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({ roomId: updateRoom.id });
            expect(response.status).toEqual(httpStatus.OK);
        })

        it("should respond with status 400 with invalid bookingId", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id);

            await createBookingFactory({
                roomId: room.id,
                userId: user.id,
            })

            const updateRoom = await createRoomWithHotelId(hotel.id)

            const response = await server.put('/booking/00').set('Authorization', `Bearer ${token}`).send({ roomId: updateRoom.id });
            expect(response.status).toEqual(httpStatus.BAD_REQUEST);
        })

        it("should respond with status 400 with invalid body", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id);

            const booking = await createBookingFactory({
                roomId: room.id,
                userId: user.id,
            })

            const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({ roomId: 1000 });
            expect(response.status).toEqual(httpStatus.BAD_REQUEST);
        })

        it("should respond with status 404 when there's not roomId", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id);

            const booking = await createBookingFactory({
                roomId: room.id,
                userId: user.id,
            })

            const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({ roomId: room.id + 2 });
            expect(response.status).toEqual(httpStatus.NOT_FOUND);
        })

        it("should respond with status 403 when there's not VACANCY", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id);
            const moreRoom = await createRoomWithHotelId(hotel.id);

            const booking = await createBookingFactory({
                roomId: moreRoom.id,
                userId: user.id,
            })
            await createBookingFactory({ userId: user.id, roomId: moreRoom.id })
            await createBookingFactory({ userId: user.id, roomId: moreRoom.id })


            const response = await server.put(`/booking/${booking.id}`).set('Authorization', `Bearer ${token}`).send({ roomId: moreRoom.id });
            expect(response.status).toEqual(httpStatus.FORBIDDEN);
        })

        it("should respond with status 403 when user has not booking", async () => {
            const user = await createUser();
            const token = await generateValidToken(user);
            const enrollment = await createEnrollmentWithAddress(user)
            const ticketType = await createTicketType(false, true)
            const ticket = await createTicket(enrollment.id, ticketType.id, TicketStatus.PAID)
            await createPayment(ticket.id, ticketType.price)

            const hotel = await createHotel()
            const room = await createRoomWithHotelId(hotel.id);

            const moreUser = await createUser();
            const moreUserBooking = await createBookingFactory({
                userId: moreUser.id,
                roomId: room.id,
            });

            const response = await server.put(`/booking/${moreUserBooking.id}`).set('Authorization', `Bearer ${token}`).send({ roomId: room.id });
            expect(response.status).toEqual(httpStatus.FORBIDDEN);
        })

    });
});





