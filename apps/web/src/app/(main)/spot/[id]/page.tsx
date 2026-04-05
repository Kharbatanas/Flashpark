import { notFound } from 'next/navigation'
import { serverApi } from '../../../../lib/trpc/server'
import { SpotContent } from './spot-content'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export default async function SpotPage({ params }: Props) {
  try {
    const caller = await serverApi
    const spot = await caller.spots.byId({ id: params.id })
    if (!spot) notFound()

    return <SpotContent spot={spot as any} />
  } catch {
    notFound()
  }
}
