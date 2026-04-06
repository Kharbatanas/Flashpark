import { notifications } from '@flashpark/db'
import type { Database } from '@flashpark/db'

interface NotifyInput {
  userId: string
  type: string
  title: string
  body: string
  data?: Record<string, string>
}

export async function createNotification(db: Database, input: NotifyInput): Promise<void> {
  await db.insert(notifications).values({
    userId: input.userId,
    type: input.type,
    title: input.title,
    body: input.body,
    data: input.data ?? {},
  })
}
