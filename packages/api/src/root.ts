import { createTRPCRouter } from './trpc'
import { spotsRouter } from './routers/spots'
import { bookingsRouter } from './routers/bookings'
import { usersRouter } from './routers/users'
import { reviewsRouter } from './routers/reviews'
import { vehiclesRouter } from './routers/vehicles'

export const appRouter = createTRPCRouter({
  spots: spotsRouter,
  bookings: bookingsRouter,
  users: usersRouter,
  reviews: reviewsRouter,
  vehicles: vehiclesRouter,
})

export type AppRouter = typeof appRouter
