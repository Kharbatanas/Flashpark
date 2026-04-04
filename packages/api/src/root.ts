import { createTRPCRouter } from './trpc'
import { spotsRouter } from './routers/spots'
import { bookingsRouter } from './routers/bookings'
import { usersRouter } from './routers/users'
import { reviewsRouter } from './routers/reviews'
import { vehiclesRouter } from './routers/vehicles'
import { messagesRouter } from './routers/messages'
import { availabilityRouter } from './routers/availability'
import { verificationRouter } from './routers/verification'
import { notificationsRouter } from './routers/notifications'

export const appRouter = createTRPCRouter({
  spots: spotsRouter,
  bookings: bookingsRouter,
  users: usersRouter,
  reviews: reviewsRouter,
  vehicles: vehiclesRouter,
  messages: messagesRouter,
  availability: availabilityRouter,
  verification: verificationRouter,
  notifications: notificationsRouter,
})

export type AppRouter = typeof appRouter
