import Link from 'next/link'

export const metadata = {
  title: "Conditions d'utilisation — Flashpark",
  description: "Conditions generales d'utilisation et de vente de Flashpark.",
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

        <h1 className="text-3xl font-extrabold text-[#1A1A2E]">
          Conditions generales d&apos;utilisation
        </h1>
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
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">
              5. Droit de retractation
            </h2>
            <p>
              Conformement aux articles L221-1 et suivants du Code de la consommation, vous
              disposez d&apos;un droit de retractation de 14 jours a compter de la conclusion du
              contrat.
            </p>
            <p className="mt-3">
              Toutefois, conformement a l&apos;article L221-28 12° du Code de la consommation,{' '}
              <strong>
                ce droit de retractation ne s&apos;applique pas aux reservations dont
                l&apos;execution a commence avec votre accord expres avant l&apos;expiration du
                delai de retractation.
              </strong>{' '}
              En validant une reservation dont la date de debut est anterieure a 14 jours, vous
              reconnaissez renoncer expressement a votre droit de retractation pour cette
              reservation specifique.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">
              6. Role de la plateforme et responsabilite
            </h2>
            <p>
              Flashpark agit en qualite d&apos;intermediaire technique mettant en relation des hotes
              (proprietaires ou gestionnaires de places de stationnement) et des conducteurs. Flashpark{' '}
              <strong>n&apos;est pas partie au contrat</strong> conclu entre l&apos;hote et le
              conducteur.
            </p>
            <p className="mt-3">
              La responsabilite de l&apos;etat et de la conformite des places de stationnement
              incombe exclusivement aux hotes. Flashpark ne saurait etre tenue responsable des
              dommages directs ou indirects resultant de l&apos;utilisation des places, des litiges
              entre hotes et conducteurs, ou de toute indisponibilite de la plateforme.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">7. Protection des donnees</h2>
            <p>
              Flashpark collecte et traite les donnees personnelles conformement au RGPD. Les
              donnees sont utilisees uniquement pour le fonctionnement du service. Pour plus
              d&apos;informations, consultez notre{' '}
              <Link href="/privacy" className="text-[#0540FF] hover:underline">
                politique de confidentialite
              </Link>
              . Vous pouvez exercer vos droits en contactant{' '}
              <a href="mailto:privacy@flashpark.fr" className="text-[#0540FF] hover:underline">
                privacy@flashpark.fr
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">8. Propriete intellectuelle</h2>
            <p>
              L&apos;ensemble des elements de la plateforme Flashpark (marque, logo, textes,
              interfaces, code source) est protege par le droit de la propriete intellectuelle.
              Toute reproduction ou utilisation sans autorisation ecrite prealable de Flashpark SAS
              est interdite.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">9. Mediation de la consommation</h2>
            <p>
              Conformement aux articles L616-1 et R616-1 du Code de la consommation (ordonnance
              n° 2015-1033 du 20 aout 2015), Flashpark propose un dispositif de mediation de la
              consommation.
            </p>
            <p className="mt-3">
              En cas de litige non resolu avec notre service client, vous pouvez saisir
              gratuitement un mediateur de la consommation agree. Vous pouvez egalement utiliser la
              plateforme europeenne de reglement en ligne des litiges (RLL) accessible a{' '}
              <span className="font-medium">https://ec.europa.eu/consumers/odr</span>.
            </p>
            <p className="mt-3">
              Le recours a la mediation est facultatif. Les parties restent libres d&apos;accepter
              ou de refuser la proposition du mediateur.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">
              10. Droit applicable et juridiction
            </h2>
            <p>
              Les presentes CGU sont regies par le droit francais. En cas de litige, et apres
              recherche d&apos;une solution amiable, les tribunaux competents sont ceux du ressort
              de <strong>Nice, France</strong>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">11. Contact</h2>
            <p>
              Pour toute question relative aux presentes CGU, vous pouvez nous contacter a{' '}
              <a href="mailto:contact@flashpark.fr" className="text-[#0540FF] hover:underline">
                contact@flashpark.fr
              </a>
              .
            </p>
          </section>
        </div>

        {/* CGV Section */}
        <div className="mt-16 border-t border-gray-200 pt-12">
          <h1 className="text-3xl font-extrabold text-[#1A1A2E]">
            Conditions generales de vente
          </h1>
          <p className="mt-2 text-sm text-gray-500">Derniere mise a jour : avril 2026</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-gray-600">
            <section>
              <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">1. Prix et tarification</h2>
              <p>
                Les prix des places de stationnement sont fixes librement par les hotes et
                exprimes en euros TTC. Flashpark preleve une commission de service de{' '}
                <strong>20 % du montant total</strong> de chaque reservation. Ce montant est
                clairement affiche avant la confirmation de la reservation.
              </p>
              <p className="mt-3">
                Flashpark se reserve le droit de modifier sa commission. Tout changement sera
                notifie aux utilisateurs avec un preavis de 30 jours.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">2. Modalites de paiement</h2>
              <p>
                Le paiement s&apos;effectue integralement au moment de la reservation, par carte
                bancaire via notre prestataire de paiement securise <strong>Stripe</strong>. Les
                cartes acceptees sont : Visa, Mastercard, American Express. Flashpark ne stocke
                aucune donnee bancaire sur ses serveurs.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">3. Execution du service</h2>
              <p>
                Le service consiste en la mise a disposition d&apos;une place de stationnement
                pendant le creneau horaire reserve. Le conducteur recoit une confirmation de
                reservation par email ainsi qu&apos;un QR code d&apos;acces. Le service est
                considere comme execute a la fin du creneau de stationnement.
              </p>
              <p className="mt-3">
                En cas d&apos;indisponibilite de la place au moment de la reservation (force
                majeure, defaillance de l&apos;hote), Flashpark s&apos;engage a proposer une
                solution alternative ou a rembourser integralement le conducteur.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">
                4. Remboursements et politique d&apos;annulation
              </h2>
              <ul className="mt-3 list-disc space-y-2 pl-6">
                <li>
                  <strong>Annulation plus de 1 heure avant :</strong> remboursement integral du
                  conducteur
                </li>
                <li>
                  <strong>Annulation moins de 1 heure avant :</strong> des frais d&apos;annulation
                  peuvent etre retenus (voir detail dans les CGU, section 4)
                </li>
                <li>
                  <strong>Annulation par l&apos;hote :</strong> remboursement integral du
                  conducteur dans un delai de 5 a 10 jours ouvrables selon l&apos;etablissement
                  bancaire
                </li>
                <li>
                  <strong>Non-presentation du conducteur :</strong> aucun remboursement
                </li>
              </ul>
              <p className="mt-3">
                Les remboursements sont effectues sur le moyen de paiement utilise lors de la
                reservation, dans un delai de 5 a 10 jours ouvrables.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">5. Garanties</h2>
              <p>
                Flashpark garantit la conformite du service de mise en relation avec sa description.
                En tant qu&apos;intermediaire, Flashpark ne peut garantir la qualite physique des
                places de stationnement, qui releve de la responsabilite des hotes. En cas de
                litige sur la qualite d&apos;une place, le conducteur peut contacter notre service
                client dans les 24 heures suivant la fin de la reservation.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold text-[#1A1A2E]">
                6. Droit applicable et juridiction
              </h2>
              <p>
                Les presentes CGV sont regies par le droit francais. En cas de litige, et apres
                recherche d&apos;une solution amiable, les tribunaux competents sont ceux du
                ressort de <strong>Nice, France</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
