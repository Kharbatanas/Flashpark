import Link from 'next/link'

export const metadata = {
  title: 'Politique de confidentialite — Flashpark',
  description:
    'Politique de confidentialite et de protection des donnees personnelles de Flashpark, conformement au RGPD.',
}

export default function PrivacyPage() {
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

        <h1 className="text-3xl font-extrabold text-[#1A1A2E]">Politique de confidentialite</h1>
        <p className="mt-2 text-sm text-gray-500">Derniere mise a jour : avril 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-gray-600">
          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">1. Responsable du traitement</h2>
            <p>
              Le responsable du traitement des donnees personnelles collectees via la plateforme
              Flashpark est :
            </p>
            <ul className="mt-3 space-y-1 pl-4">
              <li>
                <strong>Flashpark SAS</strong>, societe par actions simplifiee de droit francais
              </li>
              <li>Siege social : Nice, France</li>
              <li>
                Responsable de la protection des donnees (DPO) :{' '}
                <a href="mailto:privacy@flashpark.fr" className="text-[#0540FF] hover:underline">
                  privacy@flashpark.fr
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">2. Donnees collectees</h2>
            <p>Nous collectons les categories de donnees suivantes :</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Donnees d&apos;identite :</strong> nom complet, adresse email, numero de
                telephone
              </li>
              <li>
                <strong>Donnees de localisation :</strong> adresse postale de la place de
                stationnement, geolocalisation lors de la navigation
              </li>
              <li>
                <strong>Donnees de paiement :</strong> traitees via Stripe (nous ne conservons pas
                les numeros de carte bancaire)
              </li>
              <li>
                <strong>Documents d&apos;identite :</strong> piece d&apos;identite, justificatif de
                domicile (dans le cadre du processus de verification KYC des hotes)
              </li>
              <li>
                <strong>Photos :</strong> photos de la place de stationnement publiees par les hotes
              </li>
              <li>
                <strong>Donnees de navigation :</strong> cookies, adresse IP, type de navigateur,
                pages visitees
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">3. Bases legales du traitement</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Execution du contrat</strong> (art. 6.1.b RGPD) : traitement des
                reservations, gestion du compte utilisateur, paiements
              </li>
              <li>
                <strong>Consentement</strong> (art. 6.1.a RGPD) : cookies analytiques et
                publicitaires, communications marketing
              </li>
              <li>
                <strong>Interet legitime</strong> (art. 6.1.f RGPD) : securite de la plateforme,
                prevention de la fraude, amelioration du service
              </li>
              <li>
                <strong>Obligation legale</strong> (art. 6.1.c RGPD) : conservation des donnees de
                facturation (Code general des impots)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">4. Destinataires des donnees</h2>
            <p>Vos donnees peuvent etre transmises aux sous-traitants suivants :</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Stripe</strong> (paiement en ligne) — traitement securise des transactions
              </li>
              <li>
                <strong>Supabase</strong> (hebergement et authentification) — stockage des donnees
                utilisateur
              </li>
              <li>
                <strong>Mapbox</strong> (cartographie) — affichage des cartes et geolocalisation
              </li>
              <li>
                <strong>Vercel</strong> (hebergement web) — diffusion de l&apos;application
              </li>
              <li>
                <strong>Resend</strong> (envoi d&apos;emails transactionnels)
              </li>
            </ul>
            <p className="mt-3">
              Nous ne vendons pas vos donnees personnelles a des tiers a des fins commerciales.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">
              5. Transferts hors Union europeenne
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Supabase :</strong> hebergement dans la region EU-West (Union europeenne)
              </li>
              <li>
                <strong>Stripe :</strong> infrastructure en Europe (donnees traitees dans
                l&apos;UE)
              </li>
              <li>
                <strong>Mapbox :</strong> base aux Etats-Unis — transfert encadre par des clauses
                contractuelles types (CCT) approuvees par la Commission europeenne
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">6. Duree de conservation</h2>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Comptes utilisateurs actifs :</strong> duree de la relation contractuelle
                puis 3 ans apres la derniere activite
              </li>
              <li>
                <strong>Documents KYC (verification d&apos;identite) :</strong> 5 ans a compter de
                la fin de la relation contractuelle (obligation legale)
              </li>
              <li>
                <strong>Donnees de facturation :</strong> 10 ans (obligation comptable)
              </li>
              <li>
                <strong>Donnees de cookies analytiques :</strong> 13 mois maximum
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">7. Vos droits</h2>
            <p>
              Conformement au RGPD et a la loi Informatique et Libertes, vous disposez des droits
              suivants :
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Droit d&apos;acces</strong> (art. 15 RGPD) : obtenir une copie de vos
                donnees
              </li>
              <li>
                <strong>Droit de rectification</strong> (art. 16 RGPD) : corriger des donnees
                inexactes
              </li>
              <li>
                <strong>Droit a l&apos;effacement</strong> (art. 17 RGPD) : demander la suppression
                de votre compte et de vos donnees
              </li>
              <li>
                <strong>Droit a la portabilite</strong> (art. 20 RGPD) : recevoir vos donnees dans
                un format structure
              </li>
              <li>
                <strong>Droit d&apos;opposition</strong> (art. 21 RGPD) : vous opposer au
                traitement fonde sur l&apos;interet legitime
              </li>
              <li>
                <strong>Droit a la limitation</strong> (art. 18 RGPD) : limiter temporairement le
                traitement
              </li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous a{' '}
              <a href="mailto:privacy@flashpark.fr" className="text-[#0540FF] hover:underline">
                privacy@flashpark.fr
              </a>
              . Nous repondrons dans un delai maximum de 30 jours. Vous pouvez egalement introduire
              une reclamation aupres de la CNIL (
              <span className="font-medium">www.cnil.fr</span>).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">8. Cookies</h2>
            <p>
              Flashpark utilise des cookies essentiels au fonctionnement du service (session
              d&apos;authentification) et des cookies analytiques (avec votre consentement) pour
              ameliorer l&apos;experience utilisateur. Vous pouvez gerer vos preferences via le
              bandeau de consentement affiche lors de votre premiere visite.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">9. Contact</h2>
            <p>
              Pour toute question relative a la protection de vos donnees personnelles :{' '}
              <a href="mailto:privacy@flashpark.fr" className="text-[#0540FF] hover:underline">
                privacy@flashpark.fr
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
