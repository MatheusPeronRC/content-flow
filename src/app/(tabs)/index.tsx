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

import { getContents } from "../../services/contentStorage";
import { getInspirations } from "../../services/inspirationStorage";
import { getCreatorProfile } from "../../services/profileStorage";

import { ContentItem, ContentStatus } from "../../types/content";

import { CreatorProfile } from "../../types/creatorProfile";

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

  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadHome() {
        try {
          const [savedContents, savedInspirations, savedProfile] =
            await Promise.all([
              getContents(),
              getInspirations(),
              getCreatorProfile(),
            ]);

          if (!active) {
            return;
          }

          setContents(savedContents);

          setInspirationCount(savedInspirations.length);

          setProfile(savedProfile);
        } catch (error) {
          console.error("Erro ao carregar Home:", error);
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

  const weeklyTarget = profile?.postsPerWeek ?? 0;

  const plannedThisWeek = weeklyContents.length;

  const remainingToPlan = Math.max(weeklyTarget - plannedThisWeek, 0);

  const completedThisWeek = weeklyContents.filter(
    (content) => content.status === "pronto" || content.status === "publicado",
  ).length;

  const progress =
    weeklyTarget === 0
      ? 0
      : Math.min(Math.round((plannedThisWeek / weeklyTarget) * 100), 100);

  const weekDays = Array.from({
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

      label: ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"][index],

      number: date.getDate(),

      isToday: key === todayKey,

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
            <View style={styles.brandMark}>
              <Ionicons name="sparkles" size={17} color={colors.surface} />
            </View>

            <Text style={styles.brandName}>ContentFlow</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.8}
            onPress={() => router.push("/perfil")}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>

          <Text style={styles.heroTitle}>
            O que você vai{"\n"}
            criar hoje?
          </Text>

          <Text style={styles.heroText}>
            Suas ideias, referências e próximos conteúdos estão organizados por
            aqui.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.weekGoal}
          activeOpacity={0.92}
          onPress={() => router.push("/planejar")}
        >
          <View style={styles.weekGoalHeader}>
            <View>
              <Text style={styles.weekGoalLabel}>SUA SEMANA</Text>

              <Text style={styles.weekGoalTitle}>
                {weeklyTarget > 0
                  ? `${plannedThisWeek} de ${weeklyTarget} planejados`
                  : "Defina sua meta semanal"}
              </Text>
            </View>

            <View style={styles.weekGoalArrow}>
              <Ionicons name="arrow-forward" size={18} color={colors.ink} />
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,

                {
                  width: `${progress}%` as `${number}%`,
                },
              ]}
            />
          </View>

          <View style={styles.goalFooter}>
            <Text style={styles.goalHint}>
              {weeklyTarget === 0
                ? "Escolha sua frequência no perfil"
                : remainingToPlan > 0
                  ? `Falta${
                      remainingToPlan === 1 ? "" : "m"
                    } ${remainingToPlan} ${
                      remainingToPlan === 1 ? "conteúdo" : "conteúdos"
                    } para planejar`
                  : "Semana planejada ✓"}
            </Text>

            {completedThisWeek > 0 && (
              <Text style={styles.completedText}>
                {completedThisWeek} concluído
                {completedThisWeek > 1 ? "s" : ""}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Hoje</Text>

            <Text style={styles.sectionSubtitle}>
              {todayContents.length === 0
                ? "Sua agenda está livre."
                : todayContents.length === 1
                  ? "1 conteúdo para continuar."
                  : `${todayContents.length} conteúdos para continuar.`}
            </Text>
          </View>

          <TouchableOpacity onPress={() => router.push("/planejar")}>
            <Text style={styles.textAction}>Ver semana</Text>
          </TouchableOpacity>
        </View>

        {todayContents.length === 0 ? (
          <View style={styles.emptyToday}>
            <View style={styles.emptyTodayIcon}>
              <Ionicons name="sunny-outline" size={22} color={colors.amber} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.emptyTodayTitle}>Nada urgente por aqui</Text>

              <Text style={styles.emptyTodayText}>
                Que tal transformar uma inspiração em algo seu?
              </Text>
            </View>

            <TouchableOpacity
              style={styles.emptyTodayAction}
              onPress={() => router.push("/inspiracoes")}
            >
              <Ionicons name="arrow-forward" size={17} color={colors.ink} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.todayList}>
            {todayContents.slice(0, 3).map((content) => (
              <HomeContentRow key={content.id} content={content} />
            ))}
          </View>
        )}

        <View style={[styles.sectionHeader, styles.weekSectionHeader]}>
          <View>
            <Text style={styles.sectionTitle}>Sua semana</Text>

            <Text style={styles.sectionSubtitle}>
              {plannedThisWeek === 0
                ? "Nada planejado ainda."
                : plannedThisWeek === 1
                  ? "1 conteúdo planejado."
                  : `${plannedThisWeek} conteúdos planejados.`}
            </Text>
          </View>
        </View>

        <View style={styles.weekSurface}>
          <View style={styles.weekDays}>
            {weekDays.map((day) => (
              <View key={day.key} style={styles.day}>
                <Text style={styles.dayLabel}>{day.label}</Text>

                <View
                  style={[
                    styles.dayCircle,

                    day.isToday && styles.dayToday,

                    day.planned && styles.dayPlanned,

                    day.completed && styles.dayCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,

                      day.isToday && styles.dayNumberToday,

                      day.planned && styles.dayNumberPlanned,

                      day.completed && styles.dayNumberCompleted,
                    ]}
                  >
                    {day.number}
                  </Text>
                </View>

                <View
                  style={[
                    styles.dayDot,

                    day.planned && styles.dayDotPlanned,

                    day.completed && styles.dayDotCompleted,
                  ]}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.weekAction}
            activeOpacity={0.85}
            onPress={() => router.push("/planejar")}
          >
            <Text style={styles.weekActionText}>Planejar minha semana</Text>

            <Ionicons name="arrow-forward" size={17} color={colors.blue} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.inspirationCard}
          activeOpacity={0.85}
          onPress={() => router.push("/inspiracoes")}
        >
          <View style={styles.inspirationMark}>
            <Ionicons name="bulb-outline" size={21} color={colors.rose} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inspirationTitle}>Suas inspirações</Text>

            <Text style={styles.inspirationText}>
              {inspirationCount === 0
                ? "Comece salvando uma referência."
                : inspirationCount === 1
                  ? "1 referência esperando para virar conteúdo."
                  : `${inspirationCount} referências esperando para virar conteúdo.`}
            </Text>
          </View>

          <Ionicons name="arrow-forward" size={18} color={colors.rose} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeContentRow({ content }: { content: ContentItem }) {
  const meta = getStatusMeta(content.status);

  return (
    <TouchableOpacity
      style={styles.todayContent}
      activeOpacity={0.8}
      onPress={() => router.push(`/conteudo/${content.id}`)}
    >
      <View
        style={[
          styles.todayContentIcon,

          {
            backgroundColor: meta.background,
          },
        ]}
      >
        <Ionicons name={meta.icon} size={19} color={meta.foreground} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.todayStatus,

            {
              color: meta.foreground,
            },
          ]}
        >
          {meta.label}
        </Text>

        <Text style={styles.todayContentTitle} numberOfLines={2}>
          {content.idea}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function getStatusMeta(status: ContentStatus) {
  switch (status) {
    case "ideia":
      return {
        label: "IDEIA",
        icon: "bulb-outline" as const,
        ...statusColors.ideia,
      };

    case "roteiro":
      return {
        label: "ROTEIRO",
        icon: "create-outline" as const,
        ...statusColors.roteiro,
      };

    case "gravar":
      return {
        label: "PRODUZIR",
        icon: "videocam-outline" as const,
        ...statusColors.gravar,
      };

    case "editar":
      return {
        label: "EDITAR",
        icon: "cut-outline" as const,
        ...statusColors.editar,
      };

    case "pronto":
      return {
        label: "PRONTO",
        icon: "checkmark-circle-outline" as const,
        ...statusColors.pronto,
      };

    case "publicado":
      return {
        label: "PUBLICADO",
        icon: "paper-plane-outline" as const,
        ...statusColors.publicado,
      };
  }
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Bom dia";
  }

  if (hour < 18) {
    return "Boa tarde";
  }

  return "Boa noite";
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

    paddingBottom: 135,
  },

  header: {
    height: 66,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  brand: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  brandMark: {
    width: 34,
    height: 34,

    borderRadius: 11,

    backgroundColor: colors.brand,

    alignItems: "center",

    justifyContent: "center",
  },

  brandName: {
    fontSize: 16,

    fontWeight: "700",

    color: colors.text,

    letterSpacing: -0.2,
  },

  profileButton: {
    width: 40,
    height: 40,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: "center",

    justifyContent: "center",
  },

  hero: {
    paddingTop: spacing.lg,

    paddingBottom: spacing.xl,
  },

  greeting: {
    marginBottom: spacing.sm,

    fontSize: typography.body,

    fontWeight: "600",

    color: colors.terracotta,
  },

  heroTitle: {
    fontSize: 34,

    lineHeight: 39,

    letterSpacing: -1.1,

    fontWeight: "700",

    color: colors.text,
  },

  heroText: {
    maxWidth: 320,

    marginTop: 12,

    fontSize: 14,

    lineHeight: 21,

    color: colors.textSecondary,
  },

  weekGoal: {
    padding: spacing.lg,

    marginBottom: 32,

    borderRadius: radius.xl,

    backgroundColor: colors.ink,

    ...shadows.hero,
  },

  weekGoalHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: spacing.md,
  },

  weekGoalLabel: {
    fontSize: 9,

    letterSpacing: 1.2,

    fontWeight: "700",

    color: colors.terracotta,
  },

  weekGoalTitle: {
    marginTop: 5,

    fontSize: 22,

    letterSpacing: -0.4,

    fontWeight: "700",

    color: colors.surface,
  },

  weekGoalArrow: {
    width: 38,
    height: 38,

    borderRadius: radius.round,

    backgroundColor: colors.terracotta,

    alignItems: "center",

    justifyContent: "center",
  },

  progressTrack: {
    height: 6,

    marginTop: spacing.lg,

    overflow: "hidden",

    borderRadius: radius.round,

    backgroundColor: "#47423E",
  },

  progressFill: {
    height: "100%",

    borderRadius: radius.round,

    backgroundColor: colors.terracotta,
  },

  goalFooter: {
    marginTop: spacing.md,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: spacing.sm,
  },

  goalHint: {
    flex: 1,

    fontSize: 11,

    lineHeight: 16,

    color: "#CFC8C1",
  },

  completedText: {
    fontSize: 10,

    fontWeight: "600",

    color: colors.sageLight,
  },

  sectionHeader: {
    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "space-between",

    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: 22,

    letterSpacing: -0.5,

    fontWeight: "700",

    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: 3,

    fontSize: 12,

    color: colors.textSecondary,
  },

  textAction: {
    fontSize: 12,

    fontWeight: "700",

    color: colors.primary,
  },

  emptyToday: {
    minHeight: 88,

    padding: spacing.md,

    flexDirection: "row",

    alignItems: "center",

    borderRadius: radius.lg,

    backgroundColor: colors.amberLight,
  },

  emptyTodayIcon: {
    width: 42,
    height: 42,

    marginRight: spacing.md,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyTodayTitle: {
    fontSize: 14,

    fontWeight: "700",

    color: colors.text,
  },

  emptyTodayText: {
    marginTop: 3,

    fontSize: 11,

    lineHeight: 16,

    color: colors.textSecondary,
  },

  emptyTodayAction: {
    width: 34,
    height: 34,

    marginLeft: spacing.sm,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  todayList: {
    gap: spacing.sm,
  },

  todayContent: {
    minHeight: 72,

    paddingVertical: 12,

    flexDirection: "row",

    alignItems: "center",

    borderBottomWidth: 1,

    borderBottomColor: colors.divider,
  },

  todayContentIcon: {
    width: 42,
    height: 42,

    marginRight: spacing.md,

    borderRadius: 14,

    alignItems: "center",

    justifyContent: "center",
  },

  todayStatus: {
    fontSize: 9,

    fontWeight: "700",

    letterSpacing: 0.5,
  },

  todayContentTitle: {
    marginTop: 3,

    fontSize: 14,

    lineHeight: 19,

    fontWeight: "600",

    color: colors.text,
  },

  weekSectionHeader: {
    marginTop: 32,
  },

  weekSurface: {
    padding: spacing.md,

    borderRadius: radius.xl,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  weekDays: {
    flexDirection: "row",

    justifyContent: "space-between",
  },

  day: {
    alignItems: "center",
  },

  dayLabel: {
    marginBottom: 8,

    fontSize: 8,

    fontWeight: "700",

    color: colors.textMuted,
  },

  dayCircle: {
    width: 36,
    height: 36,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: colors.surfaceSoft,
  },

  dayToday: {
    borderWidth: 1.5,

    borderColor: colors.primary,
  },

  dayPlanned: {
    backgroundColor: colors.terracottaLight,

    borderWidth: 0,
  },

  dayCompleted: {
    backgroundColor: colors.sage,
  },

  dayNumber: {
    fontSize: 13,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  dayNumberToday: {
    color: colors.primary,

    fontWeight: "700",
  },

  dayNumberPlanned: {
    color: colors.terracotta,

    fontWeight: "700",
  },

  dayNumberCompleted: {
    color: colors.surface,

    fontWeight: "700",
  },

  dayDot: {
    width: 4,
    height: 4,

    marginTop: 7,

    borderRadius: radius.round,

    backgroundColor: "transparent",
  },

  dayDotPlanned: {
    backgroundColor: colors.terracotta,
  },

  dayDotCompleted: {
    backgroundColor: colors.sage,
  },

  weekAction: {
    minHeight: 44,

    marginTop: spacing.md,

    paddingHorizontal: 4,

    borderTopWidth: 1,

    borderTopColor: colors.divider,

    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "space-between",
  },

  weekActionText: {
    fontSize: 13,

    fontWeight: "700",

    color: colors.blue,
  },

  inspirationCard: {
    minHeight: 82,

    marginTop: spacing.xl,

    padding: spacing.md,

    flexDirection: "row",

    alignItems: "center",

    borderRadius: radius.xl,

    backgroundColor: colors.roseLight,
  },

  inspirationMark: {
    width: 44,
    height: 44,

    marginRight: spacing.md,

    borderRadius: 15,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  inspirationTitle: {
    fontSize: 15,

    fontWeight: "700",

    color: colors.text,
  },

  inspirationText: {
    marginTop: 3,

    paddingRight: spacing.sm,

    fontSize: 11,

    lineHeight: 16,

    color: colors.textSecondary,
  },
});
