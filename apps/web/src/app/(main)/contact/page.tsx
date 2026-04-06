import Link from 'next/link'

export const metadata = {
  title: 'Contact — Flashpark',
  description: "Contactez l'equipe Flashpark pour toute question ou suggestion.",
}

export default function ContactPage() {
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

        <h1 className="text-3xl font-extrabold text-[#1A1A2E]">Contactez-nous</h1>
        <p className="mt-2 text-sm text-gray-500">
          Une question, une suggestion ou un probleme ? Nous sommes la pour vous aider.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0540FF]/5 text-[#0540FF]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="font-bold text-[#1A1A2E]">Email</h2>
            <p className="mt-1 text-sm text-gray-500">Reponse sous 24 heures</p>
            <a
              href="mailto:contact@flashpark.fr"
              className="mt-3 inline-block text-sm font-semibold text-[#0540FF] hover:underline"
            >
              contact@flashpark.fr
            </a>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0540FF]/5 text-[#0540FF]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="font-bold text-[#1A1A2E]">Adresse</h2>
            <p className="mt-1 text-sm text-gray-500">Flashpark SAS</p>
            <p className="mt-1 text-sm text-gray-600">Nice, France</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0540FF]/5 text-[#0540FF]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="font-bold text-[#1A1A2E]">Reseaux sociaux</h2>
            <p className="mt-1 text-sm text-gray-500">Suivez-nous pour les dernieres actualites</p>
            <p className="mt-3 text-sm text-gray-600">@flashpark sur Twitter, Instagram, LinkedIn</p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#0540FF]/5 text-[#0540FF]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="font-bold text-[#1A1A2E]">FAQ</h2>
            <p className="mt-1 text-sm text-gray-500">Consultez nos questions frequentes</p>
            <Link
              href="/#how"
              className="mt-3 inline-block text-sm font-semibold text-[#0540FF] hover:underline"
            >
              Comment ca marche
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
