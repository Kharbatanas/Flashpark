'use client'

import { useState } from 'react'
import Link from 'next/link'
import { api } from '../../../../lib/trpc/client'
import { createSupabaseBrowserClient } from '../../../../lib/supabase/client'
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../../../../components/motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const DOC_TYPES = [
  { value: 'id_card', label: "Carte d'identite", description: 'Recto/verso de votre CNI' },
  { value: 'passport', label: 'Passeport', description: 'Page photo de votre passeport' },
  { value: 'drivers_license', label: 'Permis de conduire', description: 'Recto de votre permis' },
  { value: 'proof_of_address', label: 'Justificatif de domicile', description: 'Facture ou attestation < 3 mois' },
  { value: 'property_proof', label: 'Justificatif de propriete', description: 'Titre de propriete ou bail du parking' },
] as const

const STATUS_LABELS: Record<string, { label: string; variant: 'pending' | 'success' | 'cancelled' }> = {
  pending: { label: 'En cours de verification', variant: 'pending' },
  approved: { label: 'Approuve', variant: 'success' },
  rejected: { label: 'Refuse', variant: 'cancelled' },
}

export default function VerificationPage() {
  const { data: docs, refetch } = api.verification.myDocuments.useQuery()
  const submitDoc = api.verification.submit.useMutation({ onSuccess: () => refetch() })
  const [uploading, setUploading] = useState<string | null>(null)

  async function handleUpload(type: string) {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*,.pdf'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      setUploading(type)
      try {
        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        const MAX_SIZE = 5 * 1024 * 1024 // 5MB
        if (!ALLOWED_TYPES.includes(file.type)) {
          alert('Type de fichier non supporte. Utilisez JPG, PNG, WebP ou PDF.')
          return
        }
        if (file.size > MAX_SIZE) {
          alert('Fichier trop volumineux. Taille maximale : 5 Mo.')
          return
        }

        const supabase = createSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        const userId = user?.id ?? 'unknown'
        const ext = file.name.split('.').pop()
        const filePath = `verification/${userId}/${Date.now()}-${type}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Store just the storage path — admin uses createSignedUrl() to view docs
        await submitDoc.mutateAsync({
          type: type as typeof DOC_TYPES[number]['value'],
          fileUrl: filePath,
        })
      } catch (err) {
        console.error('Upload failed:', err)
      } finally {
        setUploading(null)
      }
    }
    input.click()
  }

  const uploadedTypes = new Set(docs?.map((d) => d.type) ?? [])

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F8FAFC] px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <FadeIn>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-[#1A1A2E]">Verification d&apos;identite</h1>
                <p className="mt-1 text-sm text-gray-500">Soumettez vos documents pour verifier votre compte</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/host">Retour</Link>
              </Button>
            </div>
          </FadeIn>

          {/* Already uploaded docs */}
          {docs && docs.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="border-b border-gray-100 px-6 py-4">
                <CardTitle className="text-base">Documents soumis</CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-gray-50">
                {docs.map((doc) => {
                  const info = STATUS_LABELS[doc.status] ?? STATUS_LABELS.pending
                  const typeLabel = DOC_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type
                  return (
                    <div key={doc.id} className="flex items-center justify-between px-6 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{typeLabel}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <Badge variant={info.variant}>{info.label}</Badge>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}

          {/* Upload document cards */}
          <StaggerContainer className="space-y-3">
            {DOC_TYPES.map((dt) => {
              const alreadyUploaded = uploadedTypes.has(dt.value)
              return (
                <StaggerItem key={dt.value}>
                  <Card className={`p-5 ${alreadyUploaded ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{dt.label}</p>
                        <p className="text-xs text-gray-500">{dt.description}</p>
                      </div>
                      <Button
                        variant={alreadyUploaded ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => handleUpload(dt.value)}
                        disabled={uploading === dt.value}
                        loading={uploading === dt.value}
                      >
                        {alreadyUploaded ? 'Re-envoyer' : 'Telecharger'}
                      </Button>
                    </div>
                  </Card>
                </StaggerItem>
              )
            })}
          </StaggerContainer>
        </div>
      </div>
    </PageTransition>
  )
}
