import { useState } from 'react'
import { Linking, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { HelpCircle, Mail, ChevronDown, ChevronUp } from 'lucide-react-native'
import { ScreenContainer } from '../../src/design-system/components/layout'
import { SectionHeader } from '../../src/design-system/components/layout/SectionHeader'
import { AppText } from '../../src/design-system/components/atoms/AppText'
import { AppButton } from '../../src/design-system/components/atoms/AppButton'
import { MenuCard } from '../../src/design-system/components/molecules/MenuCard'
import { useTheme } from '../../src/design-system/theme/useTheme'
import { spacing } from '../../src/design-system/tokens/spacing'
import { radii } from '../../src/design-system/tokens/radii'
import { shadows } from '../../src/design-system/tokens/shadows'

interface FAQItem { question: string; answer: string }

const FAQ: FAQItem[] = [
  { question: 'Comment reserver une place ?', answer: 'Recherchez une place via Recherche ou la carte. Selectionnez une place, choisissez vos dates et heures, puis confirmez. Vous recevrez une confirmation par notification et email.' },
  { question: 'Comment fonctionne le paiement ?', answer: 'Le paiement est securise par Stripe. Vos coordonnees bancaires ne sont jamais stockees sur nos serveurs. Une commission de 20 % est prelevee sur chaque transaction.' },
  { question: 'Comment annuler une reservation ?', answer: 'Accedez a Reservations, selectionnez la reservation concernee, puis appuyez sur Annuler. Les conditions dependent de la politique choisie.' },
  { question: 'Comment devenir hote ?', answer: 'Rendez-vous dans votre profil et appuyez sur Devenir hote. Vous devrez renseigner les details de votre place, puis soumettre votre annonce pour validation sous 24h.' },
  { question: 'Comment fonctionne le Smart Gate ?', answer: 'Le Smart Gate est une barriere connectee qui s ouvre automatiquement via un QR code unique genere dans l application.' },
  { question: 'Comment contacter le support ?', answer: 'Notre equipe support est disponible du lundi au vendredi de 9h a 18h. Ecrivez-nous a support@flashpark.fr. Nous repondons sous 24h.' },
]

function AccordionItem({ item }: { item: FAQItem }) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  return (
    <TouchableOpacity
      style={[styles.accordion, { backgroundColor: colors.surface, borderColor: open ? colors.primary : colors.border }]}
      onPress={() => setOpen((p) => !p)}
      activeOpacity={0.75}
      accessibilityLabel={item.question}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
    >
      <View style={styles.accordionHeader}>
        <AppText variant="callout" color={open ? colors.primary : colors.text} style={{ flex: 1 }}>{item.question}</AppText>
        {open
          ? <ChevronUp size={18} color={colors.primary} strokeWidth={2.5} />
          : <ChevronDown size={18} color={colors.textSecondary} strokeWidth={2.5} />
        }
      </View>
      {open && (
        <AppText variant="callout" color={colors.textSecondary} style={styles.accordionAnswer}>{item.answer}</AppText>
      )}
    </TouchableOpacity>
  )
}

export default function HelpScreen() {
  const { colors } = useTheme()

  return (
    <ScreenContainer edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Retour">
          <AppText variant="callout" color={colors.primary}>Retour</AppText>
        </TouchableOpacity>
        <AppText variant="headline" color={colors.text}>Centre d aide</AppText>
        <View style={styles.spacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: colors.primaryMuted, borderColor: colors.primary + '20' }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.surface }]}>
            <HelpCircle size={28} color={colors.primary} strokeWidth={2} />
          </View>
          <AppText variant="title3" color={colors.text} style={styles.centered}>Comment pouvons-nous vous aider ?</AppText>
          <AppText variant="callout" color={colors.textSecondary} style={styles.centered}>Trouvez des reponses aux questions frequentes ci-dessous</AppText>
        </View>

        <SectionHeader title="Questions frequentes" />
        <View style={styles.faqList}>
          {FAQ.map((item, i) => <AccordionItem key={i} item={item} />)}
        </View>

        <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border, ...shadows.sm }]}>
          <View style={styles.contactHeader}>
            <Mail size={20} color={colors.primary} strokeWidth={2} />
            <AppText variant="title3" color={colors.text}>Besoin d aide ?</AppText>
          </View>
          <AppText variant="callout" color={colors.textSecondary}>
            Vous ne trouvez pas la reponse ? Notre equipe est la pour vous.
          </AppText>
          <AppButton
            title="support@flashpark.fr"
            onPress={() => Linking.openURL('mailto:support@flashpark.fr')}
            variant="primary"
            size="md"
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[4], paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  spacer: { minWidth: 60 },
  content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
  hero: { borderWidth: 1, borderRadius: radii.xl, padding: spacing[6], alignItems: 'center', gap: spacing[2] },
  heroIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[1] },
  centered: { textAlign: 'center' },
  faqList: { gap: spacing[3] },
  accordion: { borderWidth: 1.5, borderRadius: radii.lg, padding: spacing[4] },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[3] },
  accordionAnswer: { marginTop: spacing[3], paddingTop: spacing[3], borderTopWidth: 1, borderTopColor: 'rgba(5,64,255,0.15)', lineHeight: 22 },
  contactCard: { borderWidth: 1, borderRadius: radii.xl, padding: spacing[5], gap: spacing[3] },
  contactHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
})
