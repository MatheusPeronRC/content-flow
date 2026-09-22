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
  fonts,
  radius,
  shadows,
  spacing,
  statusColors,
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
            onPress={() => router.push("/onboarding")}
          >
            <Ionicons name="person-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroBubbleOne} />
          <View style={styles.heroBubbleTwo} />

          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={13} color={colors.terracotta} />

              <Text style={styles.heroBadgeText}>SEU ESPAÇO CRIATIVO</Text>
            </View>

            <View style={styles.heroMark}>
              <Ionicons name="flash" size={20} color={colors.surface} />
            </View>
          </View>

          <Text style={styles.greeting}>{getGreeting()} 👋</Text>

          <Text style={styles.heroTitle}>
            O que você vai{"\n"}
            criar hoje?
          </Text>

          <Text style={styles.heroText}>
            Organize o que merece sua atenção e mantenha seu conteúdo em
            movimento.
          </Text>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <View
                style={[
                  styles.heroStatIcon,
                  {
                    backgroundColor: colors.terracottaLight,
                  },
                ]}
              >
                <Ionicons
                  name="videocam-outline"
                  size={16}
                  color={colors.terracotta}
                />
              </View>

              <View>
                <Text style={styles.heroStatValue}>{todayContents.length}</Text>

                <Text style={styles.heroStatLabel}>para hoje</Text>
              </View>
            </View>

            <View style={styles.heroStatDivider} />

            <View style={styles.heroStat}>
              <View
                style={[
                  styles.heroStatIcon,
                  {
                    backgroundColor: colors.roseLight,
                  },
                ]}
              >
                <Ionicons name="bulb-outline" size={16} color={colors.rose} />
              </View>

              <View>
                <Text style={styles.heroStatValue}>{inspirationCount}</Text>

                <Text style={styles.heroStatLabel}>inspirações</Text>
              </View>
            </View>
          </View>
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
                : plannedThisWeek > weeklyTarget
                  ? `Meta superada em ${plannedThisWeek - weeklyTarget} ${
                      plannedThisWeek - weeklyTarget === 1
                        ? "conteúdo"
                        : "conteúdos"
                    }`
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
          <View style={styles.sectionHeadingRow}>
            <View style={styles.todaySectionMark}>
              <Ionicons
                name="today-outline"
                size={18}
                color={colors.terracotta}
              />
            </View>

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
          </View>

          <TouchableOpacity
            style={styles.sectionAction}
            onPress={() => router.push("/planejar")}
          >
            <Text style={styles.textAction}>Ver semana</Text>

            <Ionicons
              name="arrow-forward"
              size={14}
              color={colors.terracotta}
            />
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

        <View style={styles.weekSurface}>
          <View style={styles.weekSurfaceHeader}>
            <View style={styles.sectionHeadingRow}>
              <View style={styles.weekSectionMark}>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={colors.blue}
                />
              </View>

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

            <View style={styles.weekCountPill}>
              <Text style={styles.weekCountText}>{plannedThisWeek}</Text>
            </View>
          </View>

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
          <View style={styles.inspirationBubble} />

          <View style={styles.inspirationMark}>
            <Ionicons name="bulb" size={21} color={colors.rose} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inspirationEyebrow}>SEU ACERVO</Text>

            <Text style={styles.inspirationTitle}>Suas inspirações</Text>

            <Text style={styles.inspirationText}>
              {inspirationCount === 0
                ? "Comece salvando uma referência."
                : inspirationCount === 1
                  ? "1 referência esperando para virar conteúdo."
                  : `${inspirationCount} referências esperando para virar conteúdo.`}
            </Text>
          </View>

          <View style={styles.inspirationCount}>
            <Text style={styles.inspirationCountText}>{inspirationCount}</Text>
          </View>

          <View style={styles.inspirationArrow}>
            <Ionicons name="arrow-forward" size={17} color={colors.rose} />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeContentRow({ content }: { content: ContentItem }) {
  const meta = getStatusMeta(content.status);

  return (
    <TouchableOpacity
      style={[
        styles.todayContent,
        {
          borderColor: meta.background,
        },
      ]}
      activeOpacity={0.84}
      onPress={() => router.push(`/conteudo/${content.id}`)}
    >
      <View
        style={[
          styles.todayAccent,
          {
            backgroundColor: meta.foreground,
          },
        ]}
      />

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

      <View style={styles.todayMain}>
        <View style={styles.todayMetaRow}>
          <View
            style={[
              styles.todayStatusPill,
              {
                backgroundColor: meta.background,
              },
            ]}
          >
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
          </View>

          {content.format && (
            <View style={styles.todayFormatPill}>
              <Text style={styles.todayFormatText}>{content.format}</Text>
            </View>
          )}
        </View>

        <Text style={styles.todayContentTitle} numberOfLines={2}>
          {content.idea}
        </Text>
      </View>

      <View
        style={[
          styles.todayArrow,
          {
            backgroundColor: meta.background,
          },
        ]}
      >
        <Ionicons name="chevron-forward" size={16} color={meta.foreground} />
      </View>
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
    fontSize: 17,

    fontFamily: fonts.bold,

    color: colors.text,

    letterSpacing: -0.3,
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

  heroPanel: {
    position: "relative",

    overflow: "hidden",

    marginTop: 12,

    marginBottom: 18,

    padding: 20,

    borderRadius: 28,

    backgroundColor: colors.terracottaLight,

    borderWidth: 1,

    borderColor: "rgba(225, 116, 85, 0.16)",

    ...shadows.card,
  },

  heroBubbleOne: {
    position: "absolute",

    width: 130,
    height: 130,

    top: -48,
    right: -35,

    borderRadius: 65,

    backgroundColor: "rgba(142, 127, 194, 0.14)",
  },

  heroBubbleTwo: {
    position: "absolute",

    width: 92,
    height: 92,

    left: -30,
    bottom: -24,

    borderRadius: 46,

    backgroundColor: "rgba(121, 165, 184, 0.12)",
  },

  heroTop: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  heroBadge: {
    minHeight: 30,

    paddingHorizontal: 10,

    borderRadius: radius.round,

    backgroundColor: "rgba(255, 253, 252, 0.78)",

    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  heroBadgeText: {
    fontSize: 10,

    letterSpacing: 0.75,

    fontFamily: fonts.bold,

    color: colors.terracotta,
  },

  heroMark: {
    width: 42,
    height: 42,

    borderRadius: 14,

    backgroundColor: colors.terracotta,

    alignItems: "center",

    justifyContent: "center",

    ...shadows.soft,
  },

  greeting: {
    marginTop: 16,

    marginBottom: 7,

    fontSize: 14,

    fontFamily: fonts.semibold,

    color: colors.terracotta,
  },

  heroTitle: {
    fontSize: 34,

    lineHeight: 40,

    letterSpacing: -1.3,

    fontFamily: fonts.extraBold,

    color: colors.text,
  },

  heroText: {
    maxWidth: 315,

    marginTop: 10,

    fontSize: 14,

    lineHeight: 21,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  heroStats: {
    minHeight: 64,

    marginTop: 18,

    paddingHorizontal: 12,

    borderRadius: 18,

    backgroundColor: "rgba(255, 253, 252, 0.82)",

    flexDirection: "row",

    alignItems: "center",
  },

  heroStat: {
    flex: 1,

    minWidth: 0,

    flexDirection: "row",

    alignItems: "center",

    gap: 8,
  },

  heroStatIcon: {
    width: 34,
    height: 34,

    borderRadius: 11,

    alignItems: "center",

    justifyContent: "center",
  },

  heroStatValue: {
    fontSize: 16,

    lineHeight: 19,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  heroStatLabel: {
    marginTop: 1,

    fontSize: 10,

    fontFamily: fonts.medium,

    color: colors.textSecondary,
  },

  heroStatDivider: {
    width: 1,
    height: 32,

    marginHorizontal: 10,

    backgroundColor: colors.divider,
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
    fontSize: 10,

    letterSpacing: 1,

    fontFamily: fonts.bold,

    color: colors.terracotta,
  },

  weekGoalTitle: {
    marginTop: 5,

    fontSize: 22,

    letterSpacing: -0.5,

    fontFamily: fonts.bold,

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

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: "#CFC8C1",
  },

  completedText: {
    fontSize: 11,

    fontFamily: fonts.semibold,

    color: colors.sageLight,
  },

  sectionHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginTop: 10,

    marginBottom: 15,
  },

  sectionHeadingRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  todaySectionMark: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: colors.terracottaLight,

    alignItems: "center",

    justifyContent: "center",
  },

  sectionTitle: {
    fontSize: 22,

    lineHeight: 28,

    letterSpacing: -0.5,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: 2,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  sectionAction: {
    minHeight: 36,

    paddingHorizontal: 10,

    borderRadius: 12,

    backgroundColor: colors.terracottaLight,

    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  textAction: {
    fontSize: 11,

    fontFamily: fonts.bold,

    color: colors.terracotta,
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
    fontSize: 15,

    lineHeight: 21,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  emptyTodayText: {
    marginTop: 4,

    fontSize: 13,

    lineHeight: 19,

    fontFamily: fonts.regular,

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
    gap: 10,
  },

  todayContent: {
    minHeight: 82,

    position: "relative",

    overflow: "hidden",

    paddingVertical: 12,

    paddingRight: 12,

    paddingLeft: 15,

    flexDirection: "row",

    alignItems: "center",

    borderRadius: 18,

    borderWidth: 1,

    backgroundColor: colors.surface,

    ...shadows.soft,
  },

  todayAccent: {
    position: "absolute",

    left: 0,
    top: 12,
    bottom: 12,

    width: 4,

    borderRadius: radius.round,
  },

  todayContentIcon: {
    width: 44,
    height: 44,

    marginRight: 11,

    borderRadius: 14,

    alignItems: "center",

    justifyContent: "center",
  },

  todayMain: {
    flex: 1,

    minWidth: 0,
  },

  todayMetaRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  todayStatusPill: {
    minHeight: 24,

    paddingHorizontal: 8,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",
  },

  todayStatus: {
    fontSize: 9,

    fontFamily: fonts.bold,

    letterSpacing: 0.45,
  },

  todayFormatPill: {
    minHeight: 24,

    paddingHorizontal: 8,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  todayFormatText: {
    fontSize: 9,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  todayContentTitle: {
    marginTop: 6,

    fontSize: 15,

    lineHeight: 21,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  todayArrow: {
    width: 34,
    height: 34,

    marginLeft: 8,

    borderRadius: 11,

    alignItems: "center",

    justifyContent: "center",
  },

  weekSectionHeader: {
    marginTop: 32,
  },

  weekSurface: {
    marginTop: 30,

    padding: 15,

    borderRadius: 24,

    backgroundColor: colors.blueLight,

    borderWidth: 1,

    borderColor: "rgba(121, 165, 184, 0.17)",

    ...shadows.soft,
  },

  weekSurfaceHeader: {
    marginBottom: 16,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 10,
  },

  weekSectionMark: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  weekCountPill: {
    minWidth: 36,
    height: 36,

    paddingHorizontal: 9,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  weekCountText: {
    fontSize: 12,

    fontFamily: fonts.bold,

    color: colors.blue,
  },

  weekDays: {
    paddingVertical: 10,

    paddingHorizontal: 7,

    borderRadius: 18,

    backgroundColor: "rgba(255, 253, 252, 0.82)",

    flexDirection: "row",

    justifyContent: "space-between",
  },

  day: {
    alignItems: "center",
  },

  dayLabel: {
    marginBottom: 8,

    fontSize: 10,

    fontFamily: fonts.bold,

    color: colors.textMuted,
  },

  dayCircle: {
    width: 38,
    height: 38,

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
    fontSize: 14,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  dayNumberToday: {
    color: colors.primary,

    fontFamily: fonts.bold,
  },

  dayNumberPlanned: {
    color: colors.terracotta,

    fontFamily: fonts.bold,
  },

  dayNumberCompleted: {
    color: colors.surface,

    fontFamily: fonts.bold,
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

    marginTop: 12,

    paddingHorizontal: 12,

    borderRadius: 14,

    backgroundColor: "rgba(255, 253, 252, 0.82)",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  weekActionText: {
    fontSize: 14,

    fontFamily: fonts.bold,

    color: colors.blue,
  },

  inspirationCard: {
    minHeight: 104,

    position: "relative",

    overflow: "hidden",

    marginTop: spacing.xl,

    padding: 16,

    flexDirection: "row",

    alignItems: "center",

    borderRadius: 23,

    backgroundColor: colors.roseLight,

    borderWidth: 1,

    borderColor: "rgba(207, 130, 149, 0.16)",

    ...shadows.soft,
  },

  inspirationBubble: {
    position: "absolute",

    width: 92,
    height: 92,

    right: -36,
    top: -30,

    borderRadius: 46,

    backgroundColor: "rgba(225, 116, 85, 0.13)",
  },

  inspirationMark: {
    width: 48,
    height: 48,

    marginRight: 13,

    borderRadius: 15,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  inspirationEyebrow: {
    marginBottom: 2,

    fontSize: 9,

    letterSpacing: 0.8,

    fontFamily: fonts.bold,

    color: colors.rose,
  },

  inspirationTitle: {
    fontSize: 17,

    lineHeight: 22,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  inspirationText: {
    marginTop: 3,

    paddingRight: spacing.sm,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  inspirationCount: {
    minWidth: 34,
    height: 34,

    paddingHorizontal: 8,

    marginLeft: 5,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  inspirationCountText: {
    fontSize: 11,

    fontFamily: fonts.bold,

    color: colors.rose,
  },

  inspirationArrow: {
    width: 34,
    height: 34,

    marginLeft: 7,

    borderRadius: 11,

    backgroundColor: "rgba(255, 253, 252, 0.7)",

    alignItems: "center",

    justifyContent: "center",
  },
});
