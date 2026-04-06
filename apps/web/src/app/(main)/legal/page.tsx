import Link from 'next/link'

export const metadata = {
  title: 'Mentions legales — Flashpark',
  description:
    'Mentions legales de Flashpark conformement a la loi pour la confiance dans l\'economie numerique (LCEN).',
}

export default function LegalPage() {
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

        <h1 className="text-3xl font-extrabold text-[#1A1A2E]">Mentions legales</h1>
        <p className="mt-2 text-sm text-gray-500">Derniere mise a jour : avril 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">1. Editeur du site</h2>
            <p>
              Conformement a l&apos;article 6 de la loi n° 2004-575 du 21 juin 2004 pour la
              confiance dans l&apos;economie numerique (LCEN), le site flashpark.fr est edite par :
            </p>
            <ul className="mt-3 space-y-1.5 pl-4">
              <li>
                <strong>Denomination sociale :</strong> Flashpark SAS
              </li>
              <li>
                <strong>Forme juridique :</strong> Societe par actions simplifiee (SAS)
              </li>
              <li>
                <strong>Siege social :</strong> Nice, France{' '}
                <span className="text-gray-400">[A completer]</span>
              </li>
              <li>
                <strong>SIRET :</strong>{' '}
                <span className="text-gray-400">[A completer]</span>
              </li>
              <li>
                <strong>Capital social :</strong>{' '}
                <span className="text-gray-400">[A completer]</span>
              </li>
              <li>
                <strong>Numero TVA intracommunautaire :</strong>{' '}
                <span className="text-gray-400">[A completer]</span>
              </li>
              <li>
                <strong>Directeur de la publication :</strong>{' '}
                <span className="text-gray-400">[A completer]</span>
              </li>
              <li>
                <strong>Contact :</strong>{' '}
                <a href="mailto:contact@flashpark.fr" className="text-[#0540FF] hover:underline">
                  contact@flashpark.fr
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">2. Hebergement</h2>
            <p>Le site flashpark.fr est heberge par :</p>
            <div className="mt-3 space-y-4">
              <div>
                <p className="font-semibold text-gray-700">Vercel Inc.</p>
                <p>440 N Barranca Ave #4133, Covina, CA 91723, Etats-Unis</p>
                <p>
                  Site :{' '}
                  <span className="font-medium">vercel.com</span>
                </p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Supabase Inc.</p>
                <p>970 Toa Payoh North, Singapour (infrastructure EU-West)</p>
                <p>
                  Site :{' '}
                  <span className="font-medium">supabase.com</span>
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">3. Propriete intellectuelle</h2>
            <p>
              L&apos;ensemble des elements constituant le site flashpark.fr (textes, graphismes,
              logotypes, icones, images, sons, logiciels) est la propriete exclusive de Flashpark SAS
              ou de ses partenaires. Toute reproduction, representation, modification, publication ou
              adaptation de tout ou partie de ces elements, quel que soit le moyen ou le procede
              utilise, est interdite sauf autorisation ecrite prealable de Flashpark SAS.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">
              4. Limitation de responsabilite
            </h2>
            <p>
              Flashpark SAS s&apos;efforce d&apos;assurer l&apos;exactitude et la mise a jour des
              informations publiees sur ce site. Toutefois, Flashpark SAS ne peut garantir
              l&apos;exactitude, la precision ou l&apos;exhaustivite des informations mises a
              disposition. En consequence, Flashpark SAS decline toute responsabilite pour toute
              imprecision, inexactitude ou omission portant sur des informations disponibles sur ce
              site.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">
              5. Donnees personnelles
            </h2>
            <p>
              Les informations relatives au traitement de vos donnees personnelles sont disponibles
              dans notre{' '}
              <Link href="/privacy" className="text-[#0540FF] hover:underline">
                politique de confidentialite
              </Link>
              . Conformement au RGPD, vous pouvez exercer vos droits en contactant{' '}
              <a href="mailto:privacy@flashpark.fr" className="text-[#0540FF] hover:underline">
                privacy@flashpark.fr
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">6. Droit applicable</h2>
            <p>
              Les presentes mentions legales sont regies par le droit francais. En cas de litige,
              et apres recherche d&apos;une solution amiable, les tribunaux competents sont ceux du
              ressort de Nice, France.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
