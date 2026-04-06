import { redirect } from 'next/navigation'

export async function GET() {
  redirect('/host/stripe?success=true')
}
