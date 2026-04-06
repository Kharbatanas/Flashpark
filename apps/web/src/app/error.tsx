'use client'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Une erreur est survenue</h1>
      <p className="text-gray-600 mb-6">{error.message || "Quelque chose s'est mal passe."}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
      >
        Reessayer
      </button>
    </div>
  )
}
