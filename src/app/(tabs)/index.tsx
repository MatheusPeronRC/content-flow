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

import { SafeAreaView } from "react-native-safe-area-context";

import { SectionHeader } from "../../components/SectionHeader";
import { TaskCard } from "../../components/TaskCard";

import { getContents } from "../../services/contentStorage";
import { getInspirations } from "../../services/inspirationStorage";

import { ContentItem } from "../../types/content";

import {
  colors,
  radius,
  shadows,
  spacing,
  statusColors,
  typography,
} from "../../constants/theme";

export default function HomeScreen() {
  const [contents, setContents] = useState<ContentItem[]>([]);

  const [inspirationCount, setInspirationCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadHome() {
        try {
          const [savedContents, savedInspirations] = await Promise.all([
            getContents(),
            getInspirations(),
          ]);

          if (!active) {
            return;
          }

          setContents(savedContents);

          setInspirationCount(savedInspirations.length);
        } catch (error) {
          console.error("Erro ao carregar a Home:", error);
        }
      }

      loadHome();

      return () => {
        active = false;
      };
    }, []),
  );

  const today = new Date();

  const todayKey = toDateKey(today);

  const monday = getMonday(today);

  const sunday = new Date(monday);

  sunday.setDate(monday.getDate() + 6);

  const weekStart = toDateKey(monday);

  const weekEnd = toDateKey(sunday);

  const weeklyContents = contents.filter(
    (content) =>
      content.plannedDate &&
      content.plannedDate >= weekStart &&
      content.plannedDate <= weekEnd,
  );

  const todayContents = contents.filter(
    (content) =>
      content.plannedDate === todayKey && content.status !== "publicado",
  );

  const completedThisWeek = weeklyContents.filter(
    (content) => content.status === "pronto" || content.status === "publicado",
  ).length;

  const weekProgress =
    weeklyContents.length === 0
      ? 0
      : Math.round((completedThisWeek / weeklyContents.length) * 100);

  const homeWeekDays = Array.from({
    length: 7,
  }).map((_, index) => {
    const date = new Date(monday);

    date.setDate(monday.getDate() + index);

    const key = toDateKey(date);

    const dayContents = weeklyContents.filter(
      (content) => content.plannedDate === key,
    );

    const completed =
      dayContents.length > 0 &&
      dayContents.every(
        (content) =>
          content.status === "pronto" || content.status === "publicado",
      );

    return {
      key,

      day: ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"][index],

      date: date.getDate(),

      planned: dayContents.length > 0,

      completed,
    };
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => router.push("/perfil")}
          >
            <Ionicons name="person-outline" size={21} color={colors.blue} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroLabel}>SEU FOCO DE HOJE</Text>

          <Text style={styles.heroTitle}>
            Transforme suas ideias em conteúdo.
          </Text>

          <Text style={styles.heroDescription}>
            Organize o que precisa ser produzido e avance um passo de cada vez.
          </Text>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <View>
              <Text style={styles.progressLabel}>Ritmo da semana</Text>

              <Text style={styles.progressValue}>
                {weeklyContents.length === 0
                  ? "Nada planejado ainda"
                  : `${completedThisWeek} de ${weeklyContents.length} concluídos`}
              </Text>
            </View>

            <View style={styles.progressIcon}>
              <Ionicons
                name="trending-up-outline"
                size={21}
                color={colors.blue}
              />
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${weekProgress}%` as `${number}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.progressHint}>
            {weeklyContents.length === 0
              ? "Planeje seus conteúdos para começar a organizar a semana."
              : completedThisWeek === weeklyContents.length
                ? "Tudo concluído nesta semana."
                : `${weeklyContents.length - completedThisWeek} ${
                    weeklyContents.length - completedThisWeek === 1
                      ? "conteúdo ainda está"
                      : "conteúdos ainda estão"
                  } em andamento.`}
          </Text>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title="Hoje"
            subtitle={
              todayContents.length === 0
                ? "Nenhum conteúdo planejado para hoje"
                : todayContents.length === 1
                  ? "1 conteúdo precisa da sua atenção"
                  : `${todayContents.length} conteúdos precisam da sua atenção`
            }
            actionLabel="Ver semana"
            onActionPress={() => router.push("/planejar")}
          />

          {todayContents.length === 0 ? (
            <View style={styles.emptyTasks}>
              <View style={styles.emptyTasksIcon}>
                <Ionicons name="sunny-outline" size={24} color={colors.amber} />
              </View>

              <View style={styles.emptyTasksContent}>
                <Text style={styles.emptyTasksTitle}>
                  Nada planejado para hoje
                </Text>

                <Text style={styles.emptyTasksText}>
                  Aproveite o dia ou adicione um conteúdo ao planejamento.
                </Text>
              </View>
            </View>
          ) : (
            todayContents.slice(0, 3).map((content) => {
              const task = getTaskInfo(content);

              return (
                <TaskCard
                  key={content.id}
                  action={task.action}
                  title={content.idea}
                  type={content.format ?? "Conteúdo"}
                  icon={task.icon}
                  iconBackground={task.background}
                  iconColor={task.foreground}
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

        <View style={styles.section}>
          <SectionHeader
            title="Sua semana"
            subtitle={
              weeklyContents.length === 0
                ? "Nenhum conteúdo planejado"
                : weeklyContents.length === 1
                  ? "1 conteúdo planejado"
                  : `${weeklyContents.length} conteúdos planejados`
            }
          />

          <View style={styles.weekCard}>
            <View style={styles.weekDays}>
              {homeWeekDays.map((item) => (
                <View style={styles.day} key={item.key}>
                  <Text style={styles.dayName}>{item.day}</Text>

                  <View
                    style={[
                      styles.dayCircle,

                      item.planned && styles.dayCirclePlanned,

                      item.completed && styles.dayCircleCompleted,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayNumber,

                        item.planned && styles.dayNumberPlanned,

                        item.completed && styles.dayNumberCompleted,
                      ]}
                    >
                      {item.date}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusDot,

                      item.planned && styles.statusDotPlanned,

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

        <TouchableOpacity
          style={styles.inspirationCard}
          activeOpacity={0.8}
          onPress={() => router.push("/inspiracoes")}
        >
          <View style={styles.inspirationIcon}>
            <Ionicons name="bulb-outline" size={23} color={colors.rose} />
          </View>

          <View style={styles.inspirationContent}>
            <Text style={styles.inspirationTitle}>Suas inspirações</Text>

            <Text style={styles.inspirationSubtitle}>
              {inspirationCount === 0
                ? "Nenhuma referência salva ainda"
                : inspirationCount === 1
                  ? "1 referência esperando para virar conteúdo"
                  : `${inspirationCount} referências esperando para virar conteúdo`}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.rose} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function getTaskInfo(content: ContentItem) {
  switch (content.status) {
    case "ideia":
      return {
        action: "Desenvolver ideia",

        icon: "bulb-outline" as const,

        background: statusColors.ideia.background,

        foreground: statusColors.ideia.foreground,
      };

    case "roteiro":
      return {
        action: "Finalizar roteiro",

        icon: "create-outline" as const,

        background: statusColors.roteiro.background,

        foreground: statusColors.roteiro.foreground,
      };

    case "gravar":
      return {
        action: "Produzir conteúdo",

        icon: "videocam-outline" as const,

        background: statusColors.gravar.background,

        foreground: statusColors.gravar.foreground,
      };

    case "editar":
      return {
        action: "Editar",

        icon: "cut-outline" as const,

        background: statusColors.editar.background,

        foreground: statusColors.editar.foreground,
      };

    case "pronto":
      return {
        action: "Publicar",

        icon: "paper-plane-outline" as const,

        background: statusColors.pronto.background,

        foreground: statusColors.pronto.foreground,
      };

    default:
      return {
        action: "Continuar",

        icon: "document-text-outline" as const,

        background: colors.blueLight,

        foreground: colors.blue,
      };
  }
}

function getMonday(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const day = result.getDay();

  const difference = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + difference);

  return result;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

    backgroundColor: colors.blueLight,

    alignItems: "center",
    justifyContent: "center",
  },

  hero: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  heroLabel: {
    fontSize: typography.tiny,

    fontWeight: "800",
    letterSpacing: 1.3,

    color: colors.terracotta,

    marginBottom: spacing.sm,
  },

  heroTitle: {
    fontSize: 30,
    lineHeight: 36,

    fontWeight: "700",

    color: colors.text,

    maxWidth: 330,
  },

  heroDescription: {
    marginTop: 10,

    fontSize: typography.body,

    lineHeight: 21,

    color: colors.textSecondary,

    maxWidth: 340,
  },

  progressCard: {
    backgroundColor: colors.primaryDark,

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

    backgroundColor: colors.blueLight,

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
    height: "100%",

    backgroundColor: colors.terracotta,

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

  emptyTasks: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: colors.amberLight,

    borderRadius: radius.lg,

    padding: spacing.md,

    borderWidth: 1,
    borderColor: colors.border,
  },

  emptyTasksIcon: {
    width: 44,
    height: 44,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

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

    lineHeight: 17,
  },

  weekCard: {
    backgroundColor: colors.surfaceSoft,

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

    backgroundColor: colors.surface,

    alignItems: "center",
    justifyContent: "center",
  },

  dayCirclePlanned: {
    backgroundColor: colors.blueLight,
  },

  dayCircleCompleted: {
    backgroundColor: colors.sage,
  },

  dayNumber: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.textSecondary,
  },

  dayNumberPlanned: {
    color: colors.blue,
  },

  dayNumberCompleted: {
    color: colors.surface,
  },

  statusDot: {
    width: 5,
    height: 5,

    borderRadius: radius.round,

    backgroundColor: colors.border,

    marginTop: spacing.sm,
  },

  statusDotPlanned: {
    backgroundColor: colors.blue,
  },

  statusDotCompleted: {
    backgroundColor: colors.sage,
  },

  planButton: {
    height: 46,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: spacing.sm,

    backgroundColor: colors.blue,

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

    backgroundColor: colors.roseLight,

    borderRadius: radius.lg,

    padding: spacing.md,

    marginBottom: spacing.xl,

    borderWidth: 1,
    borderColor: "#E3CDD2",
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
});
