import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-6xl font-bold text-violet-600 mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">Page introuvable</p>
      <Link
        href="/"
        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
      >
        {"Retour a l'accueil"}
      </Link>
    </div>
  )
}
