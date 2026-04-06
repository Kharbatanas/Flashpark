'use client'

export default function MainError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Une erreur est survenue</h1>
      <p className="text-gray-500 mb-6 text-center max-w-sm">
        {error.message || "Quelque chose s'est mal passe. Veuillez reessayer."}
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-[#0540FF] text-white rounded-xl text-sm font-semibold hover:bg-[#0435D2] transition-colors"
      >
        Reessayer
      </button>
    </div>
  )
}
