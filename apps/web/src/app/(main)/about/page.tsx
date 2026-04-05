import Link from 'next/link'

export const metadata = {
  title: 'A propos — Flashpark',
}

export default function AboutPage() {
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

        <h1 className="text-3xl font-extrabold text-[#1A1A2E]">A propos de Flashpark</h1>
        <p className="mt-2 text-sm text-gray-500">La marketplace du parking prive en France</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">Notre mission</h2>
            <p>
              Flashpark est ne d&apos;un constat simple : dans les grandes villes francaises, trouver
              une place de parking releve du parcours du combattant, alors que des milliers de places
              privees restent vides chaque jour. Notre mission est de connecter conducteurs et
              proprietaires pour rendre le stationnement plus simple, plus abordable et plus intelligent.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">Comment ca marche</h2>
            <p>
              Les proprietaires publient leurs places disponibles sur Flashpark. Les conducteurs
              recherchent, reservent et paient en ligne en quelques secondes. Grace a notre
              technologie Smart Gate, l&apos;acces aux places equipees se fait automatiquement par
              QR code — plus besoin de cle ni de badge.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">Disponible partout en France</h2>
            <p>
              Flashpark est disponible dans toutes les grandes villes francaises : Paris, Lyon,
              Marseille, Montpellier, Nice, Toulouse, Bordeaux et bien d&apos;autres. Notre ambition :
              transformer le stationnement urbain en France des 2026, en commencant par les villes
              ou la pression de stationnement est la plus forte.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">Nos valeurs</h2>
            <ul className="mt-3 space-y-3">
              {[
                { title: 'Simplicite', desc: 'Reserver une place doit etre aussi simple que commander un VTC.' },
                { title: 'Confiance', desc: 'Profils verifies, paiements securises, assurance incluse.' },
                { title: 'Innovation', desc: 'Smart Gate IoT, acces automatique, experience sans friction.' },
                { title: 'Communaute', desc: 'Hotes et conducteurs forment un ecosysteme de confiance mutuelle.' },
              ].map(({ title, desc }) => (
                <li key={title} className="flex items-start gap-3">
                  <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#0540FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <div>
                    <span className="font-semibold text-[#1A1A2E]">{title}</span> — {desc}
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">Contact</h2>
            <p>
              Une question ? Ecrivez-nous a{' '}
              <a href="mailto:contact@flashpark.fr" className="text-[#0540FF] hover:underline">
                contact@flashpark.fr
              </a>{' '}
              ou rendez-vous sur notre{' '}
              <Link href="/contact" className="text-[#0540FF] hover:underline">
                page de contact
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
