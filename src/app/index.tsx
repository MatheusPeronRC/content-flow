import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { colors, radius, spacing, typography } from "../constants/theme";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá 👋</Text>
            <Text style={styles.subtitle}>
              Vamos tirar suas ideias do papel?
            </Text>
          </View>

          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>●</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Hoje</Text>
            <Text style={styles.sectionSubtitle}>21 de setembro</Text>
          </View>

          <TouchableOpacity>
            <Text style={styles.link}>Ver semana</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.taskCard}>
          <View style={[styles.taskIcon, styles.reelIcon]}>
            <Text>🎥</Text>
          </View>

          <View style={styles.taskContent}>
            <Text style={styles.taskAction}>Gravar</Text>
            <Text style={styles.taskTitle}>Creatina engorda?</Text>
            <Text style={styles.taskType}>Reel</Text>
          </View>

          <TouchableOpacity style={styles.checkCircle} />
        </View>

        <View style={styles.taskCard}>
          <View style={[styles.taskIcon, styles.carouselIcon]}>
            <Text>✏️</Text>
          </View>

          <View style={styles.taskContent}>
            <Text style={styles.taskAction}>Finalizar roteiro</Text>
            <Text style={styles.taskTitle}>3 erros no café da manhã</Text>
            <Text style={styles.taskType}>Carrossel</Text>
          </View>

          <TouchableOpacity style={styles.checkCircle} />
        </View>

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Ver conteúdos de hoje</Text>
        </TouchableOpacity>

        <View style={styles.weekSection}>
          <Text style={styles.sectionTitle}>Sua semana</Text>
          <Text style={styles.sectionSubtitle}>
            3 de 5 conteúdos planejados
          </Text>

          <View style={styles.weekDays}>
            {[
              ["SEG", "21", true],
              ["TER", "22", true],
              ["QUA", "23", false],
              ["QUI", "24", true],
              ["SEX", "25", false],
            ].map(([day, date, completed]) => (
              <View style={styles.dayCard} key={String(day)}>
                <Text style={styles.dayName}>{day}</Text>
                <Text style={styles.dayNumber}>{date}</Text>

                <View
                  style={[
                    styles.dayStatus,
                    completed && styles.dayStatusCompleted,
                  ]}
                >
                  {completed && <Text style={styles.dayCheck}>✓</Text>}
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              Planejar minha semana ✨
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.inspirationCard}>
          <View>
            <Text style={styles.inspirationTitle}>💡 Inspirações</Text>
            <Text style={styles.inspirationSubtitle}>
              7 novas inspirações salvas
            </Text>
          </View>

          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
  },

  content: {
    padding: spacing.lg,
    paddingBottom: 60,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xl,
  },

  greeting: {
    fontSize: typography.title,
    fontWeight: "700",
    color: colors.text,
  },

  subtitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  notificationButton: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  notificationIcon: {
    color: colors.primary,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.heading,
    fontWeight: "700",
    color: colors.text,
  },

  sectionSubtitle: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },

  link: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "600",
  },

  taskCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  taskIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  reelIcon: {
    backgroundColor: colors.reel,
  },

  carouselIcon: {
    backgroundColor: colors.carousel,
  },

  taskContent: {
    flex: 1,
  },

  taskAction: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },

  taskTitle: {
    fontSize: typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },

  taskType: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.textMuted,
  },

  primaryButton: {
    backgroundColor: colors.text,
    borderRadius: radius.md,
    padding: 15,
    alignItems: "center",
    marginTop: spacing.sm,
  },

  primaryButtonText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: typography.body,
  },

  weekSection: {
    marginTop: spacing.xl,
  },

  weekDays: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },

  dayCard: {
    width: "18%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },

  dayName: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  dayNumber: {
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.text,
    marginTop: 3,
  },

  dayStatus: {
    width: 20,
    height: 20,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },

  dayStatusCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  dayCheck: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },

  secondaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: 15,
    alignItems: "center",
  },

  secondaryButtonText: {
    color: colors.surface,
    fontWeight: "700",
  },

  inspirationCard: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
  },

  inspirationTitle: {
    fontWeight: "700",
    fontSize: typography.subheading,
    color: colors.text,
  },

  inspirationSubtitle: {
    color: colors.textSecondary,
    fontSize: typography.caption,
    marginTop: spacing.xs,
  },

  arrow: {
    fontSize: 28,
    color: colors.textSecondary,
  },
});
