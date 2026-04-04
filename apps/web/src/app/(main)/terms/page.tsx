import Link from 'next/link'

export const metadata = {
  title: 'Conditions d\'utilisation — Flashpark',
}

export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] px-4 py-16">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0540FF]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Accueil
        </Link>

        <h1 className="text-3xl font-extrabold text-[#1A1A2E]">Conditions d&apos;utilisation</h1>
        <p className="mt-2 text-sm text-gray-500">Derniere mise a jour : avril 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">1. Objet</h2>
            <p>
              Les presentes conditions generales d&apos;utilisation (CGU) regissent l&apos;acces et
              l&apos;utilisation de la plateforme Flashpark, accessible a l&apos;adresse flashpark.fr
              et via les applications mobiles associees. Flashpark est une marketplace de parking
              pair-a-pair permettant aux conducteurs de reserver des places de stationnement privees
              proposees par des hotes.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">2. Inscription</h2>
            <p>
              L&apos;inscription est gratuite et ouverte a toute personne physique agee d&apos;au
              moins 18 ans. L&apos;utilisateur s&apos;engage a fournir des informations exactes et a
              maintenir ses identifiants de connexion confidentiels.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">3. Reservations et paiements</h2>
            <p>
              Les paiements sont securises via Stripe. Flashpark preleve une commission de 20 % sur
              chaque transaction. Le conducteur est debite au moment de la reservation. L&apos;hote
              recoit le paiement sous 48 heures apres la fin du stationnement.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">4. Annulations</h2>
            <p>
              Le conducteur peut annuler gratuitement jusqu&apos;a 1 heure avant le debut de la
              reservation. Passe ce delai, des frais d&apos;annulation peuvent s&apos;appliquer.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">5. Responsabilites</h2>
            <p>
              Flashpark agit en qualite d&apos;intermediaire technique. La responsabilite de
              l&apos;etat des places de stationnement incombe aux hotes. Flashpark ne saurait etre
              tenue responsable des dommages directs ou indirects resultant de l&apos;utilisation de
              la plateforme.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">6. Protection des donnees</h2>
            <p>
              Flashpark collecte et traite les donnees personnelles conformement au RGPD. Les donnees
              sont utilisees uniquement pour le fonctionnement du service. L&apos;utilisateur peut
              exercer ses droits d&apos;acces, de rectification et de suppression en contactant{' '}
              <a href="mailto:contact@flashpark.fr" className="text-[#0540FF] hover:underline">
                contact@flashpark.fr
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">7. Contact</h2>
            <p>
              Pour toute question relative aux presentes CGU, vous pouvez nous contacter a{' '}
              <a href="mailto:contact@flashpark.fr" className="text-[#0540FF] hover:underline">
                contact@flashpark.fr
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
