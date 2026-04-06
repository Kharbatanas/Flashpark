import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBookingConfirmation(
  to: string,
  booking: {
    id: string
    spotTitle: string
    startTime: string
    endTime: string
    totalPrice: string
  }
) {
  await resend.emails.send({
    from: 'Flashpark <noreply@flashpark.fr>',
    to,
    subject: `Reservation confirmee \u2014 ${booking.spotTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #1A1A2E;">Votre reservation est confirmee !</h1>
        <p style="color: #4B5563;">Voici le recapitulatif de votre reservation :</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <td style="padding: 8px 0; color: #6B7280;">Place</td>
            <td style="padding: 8px 0; font-weight: 600; color: #1A1A2E;">${booking.spotTitle}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6B7280;">Debut</td>
            <td style="padding: 8px 0; color: #1A1A2E;">${booking.startTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6B7280;">Fin</td>
            <td style="padding: 8px 0; color: #1A1A2E;">${booking.endTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6B7280;">Total</td>
            <td style="padding: 8px 0; font-weight: 600; color: #0540FF;">${booking.totalPrice} \u20ac</td>
          </tr>
        </table>
        <a href="https://flashpark.fr/booking/${booking.id}"
           style="display: inline-block; background: #0540FF; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
          Voir ma reservation
        </a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          Flashpark SAS &mdash; Nice, France
        </p>
      </div>
    `,
  })
}

export async function sendBookingCancellation(
  to: string,
  booking: { id: string; spotTitle: string }
) {
  await resend.emails.send({
    from: 'Flashpark <noreply@flashpark.fr>',
    to,
    subject: `Reservation annulee \u2014 ${booking.spotTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #1A1A2E;">Votre reservation a ete annulee</h1>
        <p style="color: #4B5563;">Place : <strong>${booking.spotTitle}</strong></p>
        <p style="color: #4B5563;">
          Si vous pensez qu'il s'agit d'une erreur, contactez-nous a
          <a href="mailto:contact@flashpark.fr" style="color: #0540FF;">contact@flashpark.fr</a>.
        </p>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          Flashpark SAS &mdash; Nice, France
        </p>
      </div>
    `,
  })
}

export async function sendWelcome(to: string, name: string) {
  await resend.emails.send({
    from: 'Flashpark <noreply@flashpark.fr>',
    to,
    subject: 'Bienvenue sur Flashpark !',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <h1 style="color: #1A1A2E;">Bienvenue ${name} !</h1>
        <p style="color: #4B5563;">
          Flashpark vous permet de trouver et reserver des places de parking entre particuliers
          a Nice et dans toute la France.
        </p>
        <a href="https://flashpark.fr"
           style="display: inline-block; background: #0540FF; color: white; padding: 12px 24px;
                  border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px;">
          Decouvrir les places
        </a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 32px;">
          Flashpark SAS &mdash; Nice, France &mdash;
          <a href="https://flashpark.fr/privacy" style="color: #9CA3AF;">Confidentialite</a>
        </p>
      </div>
    `,
  })
}
