import { createSupabaseServerClient } from '../../../../lib/supabase/server'
import { db, bookings, spots, users } from '@flashpark/db'
import { eq, and } from 'drizzle-orm'

/** Escape HTML special characters to prevent XSS in receipt template */
function esc(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

interface RouteParams {
  params: { bookingId: string }
}

export async function GET(_request: Request, { params }: RouteParams) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new Response('Non autorise', { status: 401 })
  }

  const dbUser = await db.query.users.findFirst({
    where: eq(users.supabaseId, user.id),
  })
  if (!dbUser) {
    return new Response('Utilisateur introuvable', { status: 404 })
  }

  const booking = await db.query.bookings.findFirst({
    where: and(eq(bookings.id, params.bookingId), eq(bookings.driverId, dbUser.id)),
  })
  if (!booking) {
    return new Response('Reservation introuvable', { status: 404 })
  }

  const spot = await db.query.spots.findFirst({
    where: eq(spots.id, booking.spotId),
  })

  const fmt = (d: Date) =>
    d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const totalPrice = parseFloat(booking.totalPrice)
  const platformFee = parseFloat(booking.platformFee)
  const hostPayout = parseFloat(booking.hostPayout)

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recu Flashpark — ${booking.id.slice(0, 8).toUpperCase()}</title>
  <style>
    body { font-family: sans-serif; max-width: 640px; margin: 40px auto; padding: 0 24px; color: #1A1A2E; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
    .brand { font-size: 24px; font-weight: 800; color: #0540FF; }
    .receipt-id { color: #6B7280; font-size: 14px; }
    h1 { font-size: 20px; font-weight: 700; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; }
    td { padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
    td:first-child { color: #6B7280; }
    td:last-child { font-weight: 500; text-align: right; }
    .total td { font-size: 16px; font-weight: 700; border-bottom: none; padding-top: 16px; }
    .total td:last-child { color: #0540FF; }
    .footer { margin-top: 40px; font-size: 12px; color: #9CA3AF; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Flashpark</div>
    <div class="receipt-id">Recu #${booking.id.slice(0, 8).toUpperCase()}</div>
  </div>

  <h1>Recu de paiement</h1>

  <table>
    <tr>
      <td>Place de stationnement</td>
      <td>${esc(spot?.title ?? 'Inconnue')}</td>
    </tr>
    <tr>
      <td>Adresse</td>
      <td>${esc(spot?.address ?? '\u2014')}</td>
    </tr>
    <tr>
      <td>Date de reservation</td>
      <td>${fmt(new Date(booking.createdAt))}</td>
    </tr>
    <tr>
      <td>Debut du stationnement</td>
      <td>${fmt(new Date(booking.startTime))}</td>
    </tr>
    <tr>
      <td>Fin du stationnement</td>
      <td>${fmt(new Date(booking.endTime))}</td>
    </tr>
    <tr>
      <td>Statut</td>
      <td>${esc(booking.status)}</td>
    </tr>
    <tr>
      <td>Conducteur</td>
      <td>${esc(dbUser.fullName ?? '')}</td>
    </tr>
    ${booking.stripePaymentIntentId ? `<tr><td>Reference paiement</td><td>${esc(booking.stripePaymentIntentId)}</td></tr>` : ''}
    <tr>
      <td>Sous-total (hote)</td>
      <td>${hostPayout.toFixed(2)} \u20ac</td>
    </tr>
    <tr>
      <td>Frais de service Flashpark (20 %)</td>
      <td>${platformFee.toFixed(2)} \u20ac</td>
    </tr>
    <tr class="total">
      <td>Total paye</td>
      <td>${totalPrice.toFixed(2)} \u20ac</td>
    </tr>
  </table>

  <div class="footer">
    <p>Flashpark SAS &mdash; Nice, France</p>
    <p>
      Pour toute question : <a href="mailto:contact@flashpark.fr">contact@flashpark.fr</a>
    </p>
  </div>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
