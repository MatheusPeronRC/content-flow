import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getContents } from "../../services/contentStorage";
import { ContentItem } from "../../types/content";

import { SafeAreaView } from "react-native-safe-area-context";

import { SectionHeader } from "../../components/SectionHeader";
import { TaskCard } from "../../components/TaskCard";

import {
  colors,
  radius,
  shadows,
  spacing,
  typography,
} from "../../constants/theme";

const weekDays = [
  {
    day: "SEG",
    date: "21",
    completed: true,
  },
  {
    day: "TER",
    date: "22",
    completed: true,
  },
  {
    day: "QUA",
    date: "23",
    completed: false,
  },
  {
    day: "QUI",
    date: "24",
    completed: true,
  },
  {
    day: "SEX",
    date: "25",
    completed: false,
  },
];
function getTaskInfo(content: ContentItem) {
  switch (content.status) {
    case "ideia":
      return {
        action: "Desenvolver ideia",
        icon: "bulb-outline" as const,
        color: colors.primaryLight,
      };

    case "roteiro":
      return {
        action: "Finalizar roteiro",
        icon: "create-outline" as const,
        color: colors.carousel,
      };

    case "gravar":
      return {
        action: "Gravar",
        icon: "videocam-outline" as const,
        color: colors.reel,
      };

    case "editar":
      return {
        action: "Editar",
        icon: "cut-outline" as const,
        color: colors.story,
      };

    case "pronto":
      return {
        action: "Publicar",
        icon: "paper-plane-outline" as const,
        color: colors.inspiration,
      };

    default:
      return {
        action: "Continuar",
        icon: "document-text-outline" as const,
        color: colors.primaryLight,
      };
  }
}
export default function HomeScreen() {
  const [contents, setContents] = useState<ContentItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadContents() {
        try {
          const data = await getContents();

          if (active) {
            setContents(data);
          }
        } catch (error) {
          console.error("Erro ao carregar conteúdos:", error);
        }
      }

      loadContents();

      return () => {
        active = false;
      };
    }, []),
  );

  const pendingContents = contents
    .filter((content) => content.status !== "publicado")
    .slice(0, 3);
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <Ionicons
                name="sparkles-outline"
                size={20}
                color={colors.surface}
              />
            </View>

            <Text style={styles.brandName}>ContentFlow</Text>
          </View>

          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons
              name="notifications-outline"
              size={21}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* INTRO */}

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>SEU FOCO DE HOJE</Text>

          <Text style={styles.heroTitle}>
            Transforme suas ideias em conteúdo.
          </Text>

          <Text style={styles.heroDescription}>
            Você já sabe o que precisa produzir hoje. Agora é só colocar em
            movimento.
          </Text>
        </View>

        {/* PROGRESSO */}

        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressLabel}>Ritmo da semana</Text>

              <Text style={styles.progressValue}>3 de 5 conteúdos</Text>
            </View>

            <View style={styles.progressIcon}>
              <Ionicons
                name="trending-up-outline"
                size={21}
                color={colors.primary}
              />
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.progressHint}>
            Você está a 2 conteúdos de completar sua semana.
          </Text>
        </View>

        {/* HOJE */}

        <View style={styles.section}>
          <SectionHeader
            title="Hoje"
            subtitle="Conteúdos que precisam da sua atenção"
          />

          {pendingContents.length === 0 ? (
            <View style={styles.emptyTasks}>
              <View style={styles.emptyTasksIcon}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={25}
                  color={colors.primary}
                />
              </View>

              <View style={styles.emptyTasksContent}>
                <Text style={styles.emptyTasksTitle}>
                  Tudo tranquilo por aqui
                </Text>

                <Text style={styles.emptyTasksText}>
                  Crie um conteúdo para começar seu fluxo.
                </Text>
              </View>
            </View>
          ) : (
            pendingContents.map((content) => {
              const task = getTaskInfo(content);

              return (
                <TaskCard
                  key={content.id}
                  action={task.action}
                  title={content.idea}
                  type={content.format ?? "Conteúdo"}
                  icon={task.icon}
                  iconBackground={task.color}
                  onPress={() =>
                    router.push({
                      pathname: "/conteudo/roteiro",
                      params: {
                        contentId: content.id,
                      },
                    })
                  }
                />
              );
            })
          )}
        </View>

        {/* SEMANA */}

        <View style={styles.section}>
          <SectionHeader
            title="Sua semana"
            subtitle="3 de 5 conteúdos planejados"
          />

          <View style={styles.weekCard}>
            <View style={styles.weekDays}>
              {weekDays.map((item) => (
                <View key={item.day} style={styles.day}>
                  <Text style={styles.dayName}>{item.day}</Text>

                  <View
                    style={[
                      styles.dayCircle,
                      item.completed && styles.dayCircleCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,
                        item.completed && styles.dayNumberCompleted,
                      ]}
                    >
                      {item.date}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusDot,
                      item.completed && styles.statusDotCompleted,
                    ]}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.planButton}
              onPress={() => router.push("/planejar")}
            >
              <Text style={styles.planButtonText}>Planejar minha semana</Text>

              <Ionicons name="arrow-forward" size={17} color={colors.surface} />
            </TouchableOpacity>
          </View>
        </View>

        {/* INSPIRAÇÕES */}

        <TouchableOpacity
          style={styles.inspirationCard}
          activeOpacity={0.8}
          onPress={() => router.push("/inspiracoes")}
        >
          <View style={styles.inspirationIcon}>
            <Ionicons name="bulb-outline" size={23} color={colors.primary} />
          </View>

          <View style={styles.inspirationContent}>
            <Text style={styles.inspirationTitle}>Suas inspirações</Text>

            <Text style={styles.inspirationSubtitle}>
              7 referências esperando para virar conteúdo
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
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

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 110,
  },

  header: {
    height: 68,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  brandIcon: {
    width: 36,
    height: 36,

    borderRadius: 12,

    backgroundColor: colors.primary,

    alignItems: "center",
    justifyContent: "center",
  },

  brandName: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },

  notificationButton: {
    width: 42,
    height: 42,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: colors.border,
  },

  hero: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  heroLabel: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1.3,

    color: colors.primary,

    marginBottom: spacing.sm,
  },

  heroTitle: {
    fontSize: 30,
    lineHeight: 36,

    fontWeight: "700",

    color: colors.text,

    maxWidth: 320,
  },

  heroDescription: {
    marginTop: 10,

    fontSize: typography.body,
    lineHeight: 21,

    color: colors.textSecondary,

    maxWidth: 330,
  },

  progressCard: {
    backgroundColor: colors.primary,

    borderRadius: radius.xl,

    padding: spacing.lg,

    marginBottom: spacing.xl,
  },

  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  progressLabel: {
    fontSize: typography.caption,
    color: "#D7E3DE",
  },

  progressValue: {
    fontSize: typography.heading,
    fontWeight: "700",

    color: colors.surface,

    marginTop: 3,
  },

  progressIcon: {
    width: 42,
    height: 42,

    borderRadius: radius.round,

    backgroundColor: colors.primaryLight,

    alignItems: "center",
    justifyContent: "center",
  },

  progressTrack: {
    height: 6,

    backgroundColor: "#456C61",

    borderRadius: radius.round,

    marginTop: spacing.lg,

    overflow: "hidden",
  },

  progressFill: {
    width: "60%",
    height: "100%",

    backgroundColor: colors.surface,

    borderRadius: radius.round,
  },

  progressHint: {
    marginTop: spacing.sm,

    fontSize: typography.caption,

    color: "#D7E3DE",
  },

  section: {
    marginBottom: spacing.xl,
  },

  weekCard: {
    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    padding: spacing.md,

    borderWidth: 1,
    borderColor: colors.border,

    ...shadows.card,
  },

  weekDays: {
    flexDirection: "row",
    justifyContent: "space-between",

    marginBottom: spacing.md,
  },

  day: {
    alignItems: "center",
  },

  dayName: {
    fontSize: typography.tiny,
    fontWeight: "700",

    color: colors.textMuted,

    marginBottom: spacing.sm,
  },

  dayCircle: {
    width: 38,
    height: 38,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceSoft,

    alignItems: "center",
    justifyContent: "center",
  },

  dayCircleCompleted: {
    backgroundColor: colors.primaryLight,
  },

  dayNumber: {
    fontSize: typography.body,
    fontWeight: "700",

    color: colors.textSecondary,
  },

  dayNumberCompleted: {
    color: colors.primary,
  },

  statusDot: {
    width: 5,
    height: 5,

    borderRadius: radius.round,

    backgroundColor: colors.border,

    marginTop: spacing.sm,
  },

  statusDotCompleted: {
    backgroundColor: colors.primary,
  },

  planButton: {
    height: 46,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: spacing.sm,

    backgroundColor: colors.primary,

    borderRadius: radius.md,
  },

  planButtonText: {
    fontSize: typography.body,
    fontWeight: "700",

    color: colors.surface,
  },

  inspirationCard: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: colors.inspiration,

    borderRadius: radius.lg,

    padding: spacing.md,

    marginBottom: spacing.xl,
  },

  inspirationIcon: {
    width: 46,
    height: 46,

    borderRadius: radius.md,

    backgroundColor: colors.surface,

    alignItems: "center",
    justifyContent: "center",

    marginRight: spacing.md,
  },

  inspirationContent: {
    flex: 1,
  },

  inspirationTitle: {
    fontSize: typography.subheading,
    fontWeight: "700",

    color: colors.text,
  },

  inspirationSubtitle: {
    fontSize: typography.caption,
    lineHeight: 17,

    color: colors.textSecondary,

    marginTop: 3,
  },
  emptyTasks: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    borderWidth: 1,
    borderColor: colors.border,

    padding: spacing.md,
  },

  emptyTasksIcon: {
    width: 44,
    height: 44,

    borderRadius: radius.round,

    backgroundColor: colors.primaryLight,

    alignItems: "center",
    justifyContent: "center",

    marginRight: spacing.md,
  },

  emptyTasksContent: {
    flex: 1,
  },

  emptyTasksTitle: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },

  emptyTasksText: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: 3,
  },
});
