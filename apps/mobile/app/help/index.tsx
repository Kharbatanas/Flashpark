import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Mail,
  HelpCircle,
} from 'lucide-react-native'
import { COLORS } from '../../lib/constants'

interface FAQItem {
  question: string
  answer: string
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'Comment réserver une place ?',
    answer:
      'Recherchez une place disponible via l\'onglet Recherche ou la carte. Sélectionnez une place, choisissez vos dates et heures, puis confirmez votre réservation. Vous recevrez une confirmation par notification et email.',
  },
  {
    question: 'Comment fonctionne le paiement ?',
    answer:
      'Le paiement est sécurisé par Stripe, leader mondial des paiements en ligne. Vos coordonnées bancaires ne sont jamais stockées sur nos serveurs. Une commission de 20 % est prélevée sur chaque transaction pour couvrir les frais de service.',
  },
  {
    question: 'Comment annuler une réservation ?',
    answer:
      'Accédez à l\'onglet Réservations, sélectionnez la réservation concernée, puis appuyez sur "Annuler". Les conditions d\'annulation dépendent de la politique choisie lors de la réservation. Un remboursement partiel ou total peut s\'appliquer.',
  },
  {
    question: 'Comment devenir hôte ?',
    answer:
      'Pour proposer votre place de parking, rendez-vous dans votre profil et appuyez sur "Ajouter une annonce". Vous devrez vérifier votre identité, renseigner les détails de votre place (adresse, type, prix), puis soumettre votre annonce pour validation sous 24h.',
  },
  {
    question: 'Comment fonctionne le Smart Gate ?',
    answer:
      'Le Smart Gate est une barrière connectée qui s\'ouvre automatiquement via un QR code unique généré dans l\'application. À l\'arrivée, appuyez sur "Ouvrir le portail" dans votre réservation active, puis scannez ou affichez le code QR devant le lecteur.',
  },
  {
    question: 'Comment contacter le support ?',
    answer:
      'Notre équipe support est disponible du lundi au vendredi de 9h à 18h. Vous pouvez nous écrire à support@flashpark.fr. Nous répondons sous 24h ouvrées.',
  },
]

function AccordionItem({ item }: { item: FAQItem }) {
  const [open, setOpen] = useState(false)

  return (
    <TouchableOpacity
      style={[styles.accordionItem, open && styles.accordionItemOpen]}
      onPress={() => setOpen((p) => !p)}
      activeOpacity={0.75}
    >
      <View style={styles.accordionHeader}>
        <Text style={[styles.accordionQuestion, open && styles.accordionQuestionOpen]}>
          {item.question}
        </Text>
        {open ? (
          <ChevronUp color={COLORS.primary} size={18} strokeWidth={2.5} />
        ) : (
          <ChevronDown color={COLORS.gray400} size={18} strokeWidth={2.5} />
        )}
      </View>
      {open && (
        <Text style={styles.accordionAnswer}>{item.answer}</Text>
      )}
    </TouchableOpacity>
  )
}

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft color={COLORS.dark} size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Centre d&apos;aide</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <HelpCircle color={COLORS.primary} size={32} strokeWidth={2} />
          </View>
          <Text style={styles.heroTitle}>Comment pouvons-nous vous aider ?</Text>
          <Text style={styles.heroSubtitle}>
            Trouvez des réponses aux questions fréquentes ci-dessous
          </Text>
        </View>

        {/* FAQ Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questions fréquentes</Text>
          <View style={styles.accordionList}>
            {FAQ_DATA.map((item, index) => (
              <AccordionItem key={index} item={item} />
            ))}
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <Mail color={COLORS.primary} size={22} strokeWidth={2} />
            <Text style={styles.contactTitle}>Besoin d&apos;aide ?</Text>
          </View>
          <Text style={styles.contactSubtitle}>
            Vous ne trouvez pas la réponse à votre question ? Notre équipe est là pour vous.
          </Text>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL('mailto:support@flashpark.fr')}
            activeOpacity={0.85}
          >
            <Mail color={COLORS.white} size={16} strokeWidth={2} />
            <Text style={styles.contactBtnText}>support@flashpark.fr</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: COLORS.gray100,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.dark,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
  },
  hero: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.dark,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: 18,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.dark,
    paddingHorizontal: 4,
  },
  accordionList: {
    gap: 8,
  },
  accordionItem: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    padding: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
      android: { elevation: 1 },
    }),
  },
  accordionItemOpen: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  accordionQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
    flex: 1,
    lineHeight: 20,
  },
  accordionQuestionOpen: {
    color: COLORS.primary,
  },
  accordionAnswer: {
    fontSize: 13,
    color: COLORS.gray700,
    lineHeight: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary + '30',
  },
  contactCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
  },
  contactSubtitle: {
    fontSize: 13,
    color: COLORS.gray500,
    lineHeight: 18,
  },
  contactBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    ...Platform.select({
      ios: { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10 },
      android: { elevation: 4 },
    }),
  },
  contactBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
})
