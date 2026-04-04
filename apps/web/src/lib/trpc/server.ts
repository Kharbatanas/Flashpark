import 'server-only'
import { createCallerFactory, appRouter } from '@flashpark/api'
import { createContext } from '../../server/trpc'

const createCaller = createCallerFactory(appRouter)

/**
 * Server-side tRPC caller. Use as:
 *   const caller = await serverApi
 *   const data = await caller.spots.nearby(...)
 */
export const serverApi = createContext().then((ctx) => createCaller(ctx))
