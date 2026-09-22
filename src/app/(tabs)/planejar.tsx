import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { getContents, updateContent } from "../../services/contentStorage";

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

const DAY_NAMES = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

export default function PlanejarScreen() {
  const [contents, setContents] = useState<ContentItem[]>([]);

  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  const [weekOffset, setWeekOffset] = useState(0);

  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));

  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null,
  );

  const weekDays = useMemo(() => {
    const today = new Date();

    const monday = getMonday(today);

    monday.setDate(monday.getDate() + weekOffset * 7);

    return Array.from({
      length: 7,
    }).map((_, index) => {
      const date = new Date(monday);

      date.setDate(monday.getDate() + index);

      return {
        date,

        key: toDateKey(date),

        dayName: DAY_NAMES[index],

        dayNumber: date.getDate(),
      };
    });
  }, [weekOffset]);

  useEffect(() => {
    const exists = weekDays.some((day) => day.key === selectedDate);

    if (!exists) {
      const todayKey = toDateKey(new Date());

      const todayExists = weekDays.some((day) => day.key === todayKey);

      setSelectedDate(todayExists ? todayKey : weekDays[0].key);
    }
  }, [weekDays, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadData() {
        try {
          const [savedContents, savedProfile] = await Promise.all([
            getContents(),
            getCreatorProfile(),
          ]);

          if (!active) {
            return;
          }

          setContents(savedContents);

          setProfile(savedProfile);
        } catch (error) {
          console.error("Erro ao carregar planejamento:", error);
        }
      }

      loadData();

      return () => {
        active = false;
      };
    }, []),
  );

  const weekStart = weekDays[0]?.key;

  const weekEnd = weekDays[6]?.key;

  const weekPlannedContents = contents.filter(
    (content) =>
      content.plannedDate &&
      weekStart &&
      weekEnd &&
      content.plannedDate >= weekStart &&
      content.plannedDate <= weekEnd,
  );

  const weeklyTarget = profile?.postsPerWeek ?? 0;

  const plannedCount = weekPlannedContents.length;

  const remaining = Math.max(weeklyTarget - plannedCount, 0);

  const goalProgress =
    weeklyTarget === 0
      ? 0
      : Math.min(Math.round((plannedCount / weeklyTarget) * 100), 100);

  const unplannedContents = contents.filter(
    (content) => !content.plannedDate && content.status !== "publicado",
  );

  const selectedDayContents = contents.filter(
    (content) => content.plannedDate === selectedDate,
  );

  async function handlePlan(date: string | null) {
    if (!selectedContent) {
      return;
    }

    await updateContent(selectedContent.id, {
      plannedDate: date,
    });

    setContents((current) =>
      current.map((content) =>
        content.id === selectedContent.id
          ? {
              ...content,
              plannedDate: date,
            }
          : content,
      ),
    );

    setSelectedContent(null);
  }

  function getContentCount(date: string) {
    return contents.filter((content) => content.plannedDate === date).length;
  }

  const selectedDay =
    weekDays.find((day) => day.key === selectedDate) ?? weekDays[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Planejar</Text>

            <Text style={styles.subtitle}>
              Organize o que você vai produzir durante a semana.
            </Text>
          </View>

          <View style={styles.calendarIcon}>
            <Ionicons name="calendar-outline" size={22} color={colors.blue} />
          </View>
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.goalLabel}>META SEMANAL</Text>

              <Text style={styles.goalValue}>
                {weeklyTarget === 0
                  ? "Meta não definida"
                  : `${plannedCount} de ${weeklyTarget} planejados`}
              </Text>
            </View>

            <View style={styles.goalIcon}>
              <Ionicons
                name={
                  remaining === 0 && weeklyTarget > 0
                    ? "checkmark"
                    : "flag-outline"
                }
                size={21}
                color={
                  remaining === 0 && weeklyTarget > 0
                    ? colors.sage
                    : colors.terracotta
                }
              />
            </View>
          </View>

          <View style={styles.goalTrack}>
            <View
              style={[
                styles.goalFill,

                {
                  width: `${goalProgress}%` as `${number}%`,
                },
              ]}
            />
          </View>

          <Text style={styles.goalHint}>
            {weeklyTarget === 0
              ? "Defina sua frequência no perfil."
              : remaining > 0
                ? `Falta${remaining === 1 ? "" : "m"} ${remaining} ${
                    remaining === 1 ? "conteúdo" : "conteúdos"
                  } para completar a meta desta semana.`
                : plannedCount > weeklyTarget
                  ? `Meta superada: ${plannedCount} conteúdos planejados.`
                  : "Semana planejada ✓"}
          </Text>
        </View>

        <View style={styles.weekHeader}>
          <TouchableOpacity
            style={styles.weekArrow}
            onPress={() => setWeekOffset((current) => current - 1)}
          >
            <Ionicons name="chevron-back" size={20} color={colors.blue} />
          </TouchableOpacity>

          <View style={styles.weekTitleArea}>
            <Text style={styles.weekLabel}>
              {weekOffset === 0
                ? "ESTA SEMANA"
                : weekOffset === 1
                  ? "PRÓXIMA SEMANA"
                  : weekOffset === -1
                    ? "SEMANA ANTERIOR"
                    : "SEMANA"}
            </Text>

            <Text style={styles.weekRange}>
              {formatWeekRange(weekDays[0].date, weekDays[6].date)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.weekArrow}
            onPress={() => setWeekOffset((current) => current + 1)}
          >
            <Ionicons name="chevron-forward" size={20} color={colors.blue} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.days}
        >
          {weekDays.map((day) => {
            const selected = day.key === selectedDate;

            const today = day.key === toDateKey(new Date());

            const count = getContentCount(day.key);

            return (
              <TouchableOpacity
                key={day.key}
                style={[styles.dayCard, selected && styles.dayCardSelected]}
                onPress={() => setSelectedDate(day.key)}
              >
                <Text
                  style={[styles.dayName, selected && styles.dayNameSelected]}
                >
                  {day.dayName}
                </Text>

                <Text
                  style={[
                    styles.dayNumber,

                    selected && styles.dayNumberSelected,
                  ]}
                >
                  {day.dayNumber}
                </Text>

                {today && (
                  <Text
                    style={[
                      styles.todayLabel,

                      selected && styles.todayLabelSelected,
                    ]}
                  >
                    HOJE
                  </Text>
                )}

                {!today && count > 0 && (
                  <View
                    style={[
                      styles.countBadge,

                      selected && styles.countBadgeSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countText,

                        selected && styles.countTextSelected,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {formatSelectedDay(selectedDay.date)}
          </Text>

          <Text style={styles.sectionSubtitle}>
            {selectedDayContents.length === 0
              ? "Nenhum conteúdo planejado"
              : selectedDayContents.length === 1
                ? "1 conteúdo planejado"
                : `${selectedDayContents.length} conteúdos planejados`}
          </Text>
        </View>

        {selectedDayContents.length === 0 ? (
          <View style={styles.emptyDay}>
            <View style={styles.emptyDayIcon}>
              <Ionicons
                name="calendar-clear-outline"
                size={26}
                color={colors.blue}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.emptyDayTitle}>Dia livre</Text>

              <Text style={styles.emptyDayText}>
                Escolha um conteúdo não planejado e coloque-o neste dia.
              </Text>
            </View>
          </View>
        ) : (
          selectedDayContents.map((content) => (
            <PlanningCard
              key={content.id}
              content={content}
              onPress={() => setSelectedContent(content)}
            />
          ))
        )}

        <View style={styles.unplannedHeader}>
          <View>
            <Text style={styles.sectionTitle}>Não planejados</Text>

            <Text style={styles.sectionSubtitle}>
              Conteúdos esperando um espaço na sua semana.
            </Text>
          </View>

          {unplannedContents.length > 0 && (
            <View style={styles.unplannedCount}>
              <Text style={styles.unplannedCountText}>
                {unplannedContents.length}
              </Text>
            </View>
          )}
        </View>

        {unplannedContents.length === 0 ? (
          <View style={styles.allPlanned}>
            <Ionicons
              name="checkmark-circle-outline"
              size={23}
              color={colors.sage}
            />

            <Text style={styles.allPlannedText}>Tudo planejado por aqui.</Text>
          </View>
        ) : (
          unplannedContents.map((content) => (
            <PlanningCard
              key={content.id}
              content={content}
              unplanned
              onPress={() => setSelectedContent(content)}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={selectedContent !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedContent(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedContent(null)}
          />

          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <Text style={styles.sheetTitle}>Planejar conteúdo</Text>

            <Text style={styles.sheetContentTitle} numberOfLines={2}>
              {selectedContent?.idea}
            </Text>

            <Text style={styles.sheetDescription}>
              Escolha em qual dia você quer trabalhar neste conteúdo.
            </Text>

            <View style={styles.sheetDays}>
              {weekDays.map((day) => {
                const selected = selectedContent?.plannedDate === day.key;

                return (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.sheetDay,

                      selected && styles.sheetDaySelected,
                    ]}
                    onPress={() => handlePlan(day.key)}
                  >
                    <Text
                      style={[
                        styles.sheetDayName,

                        selected && styles.sheetDayTextSelected,
                      ]}
                    >
                      {day.dayName}
                    </Text>

                    <Text
                      style={[
                        styles.sheetDayNumber,

                        selected && styles.sheetDayTextSelected,
                      ]}
                    >
                      {day.dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedContent?.plannedDate && (
              <TouchableOpacity
                style={styles.removePlanning}
                onPress={() => handlePlan(null)}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={19}
                  color={colors.danger}
                />

                <Text style={styles.removePlanningText}>
                  Remover do planejamento
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type PlanningCardProps = {
  content: ContentItem;
  onPress: () => void;
  unplanned?: boolean;
};

function PlanningCard({
  content,
  onPress,
  unplanned = false,
}: PlanningCardProps) {
  const status = getStatusMeta(content.status);

  return (
    <TouchableOpacity
      style={styles.contentCard}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View
        style={[
          styles.contentIcon,

          {
            backgroundColor: status.background,
          },
        ]}
      >
        <Ionicons name={status.icon} size={21} color={status.foreground} />
      </View>

      <View style={styles.contentInfo}>
        <View style={styles.contentMeta}>
          <Text
            style={[
              styles.statusText,

              {
                color: status.foreground,
              },
            ]}
          >
            {status.label}
          </Text>

          {content.format && (
            <>
              <View style={styles.metaDot} />

              <Text style={styles.formatText}>{content.format}</Text>
            </>
          )}
        </View>

        <Text style={styles.contentTitle} numberOfLines={2}>
          {content.idea}
        </Text>
      </View>

      <View
        style={[styles.planAction, !unplanned && styles.planActionScheduled]}
      >
        <Ionicons
          name={unplanned ? "calendar-outline" : "calendar"}
          size={17}
          color={colors.blue}
        />
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

function formatWeekRange(start: Date, end: Date) {
  const startText = start.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  const endText = end.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

  return `${startText} — ${endText}`;
}

function formatSelectedDay(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
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
    paddingTop: spacing.md,

    paddingBottom: spacing.xl,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  title: {
    fontSize: typography.title,

    fontWeight: "700",

    color: colors.text,
  },

  subtitle: {
    marginTop: 4,

    fontSize: typography.body,

    lineHeight: 20,

    color: colors.textSecondary,

    maxWidth: 290,
  },

  calendarIcon: {
    width: 44,
    height: 44,

    borderRadius: radius.md,

    backgroundColor: colors.blueLight,

    alignItems: "center",

    justifyContent: "center",
  },

  goalCard: {
    padding: spacing.lg,

    marginBottom: spacing.xl,

    borderRadius: radius.xl,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    ...shadows.card,
  },

  goalTop: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: spacing.md,
  },

  goalLabel: {
    fontSize: typography.tiny,

    fontWeight: "800",

    letterSpacing: 1,

    color: colors.blue,
  },

  goalValue: {
    marginTop: 4,

    fontSize: typography.heading,

    fontWeight: "700",

    color: colors.text,
  },

  goalIcon: {
    width: 44,
    height: 44,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceSoft,

    alignItems: "center",

    justifyContent: "center",
  },

  goalTrack: {
    height: 7,

    marginTop: spacing.lg,

    borderRadius: radius.round,

    backgroundColor: colors.blueLight,

    overflow: "hidden",
  },

  goalFill: {
    height: "100%",

    borderRadius: radius.round,

    backgroundColor: colors.terracotta,
  },

  goalHint: {
    marginTop: spacing.sm,

    fontSize: typography.caption,

    lineHeight: 18,

    color: colors.textSecondary,
  },

  weekHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: spacing.md,
  },

  weekArrow: {
    width: 38,
    height: 38,

    borderRadius: radius.round,

    backgroundColor: colors.blueLight,

    alignItems: "center",

    justifyContent: "center",
  },

  weekTitleArea: {
    alignItems: "center",
  },

  weekLabel: {
    fontSize: typography.tiny,

    fontWeight: "800",

    letterSpacing: 1,

    color: colors.blue,
  },

  weekRange: {
    marginTop: 3,

    fontSize: typography.body,

    fontWeight: "700",

    color: colors.text,
  },

  days: {
    gap: spacing.sm,

    paddingBottom: spacing.xl,
  },

  dayCard: {
    width: 58,

    minHeight: 82,

    borderRadius: radius.lg,

    backgroundColor: colors.surfaceSoft,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: "center",

    paddingVertical: 10,
  },

  dayCardSelected: {
    backgroundColor: colors.blue,

    borderColor: colors.blue,
  },

  dayName: {
    fontSize: typography.tiny,

    fontWeight: "700",

    color: colors.textMuted,
  },

  dayNameSelected: {
    color: colors.surface,
  },

  dayNumber: {
    marginTop: 5,

    fontSize: 19,

    fontWeight: "700",

    color: colors.text,
  },

  dayNumberSelected: {
    color: colors.surface,
  },

  todayLabel: {
    marginTop: 4,

    fontSize: 7,

    fontWeight: "800",

    color: colors.blue,
  },

  todayLabelSelected: {
    color: colors.surface,
  },

  countBadge: {
    marginTop: 5,

    minWidth: 18,

    height: 18,

    paddingHorizontal: 4,

    borderRadius: radius.round,

    backgroundColor: colors.blueLight,

    alignItems: "center",

    justifyContent: "center",
  },

  countBadgeSelected: {
    backgroundColor: colors.surface,
  },

  countText: {
    fontSize: 9,

    fontWeight: "800",

    color: colors.blue,
  },

  countTextSelected: {
    color: colors.blue,
  },

  sectionHeader: {
    marginBottom: spacing.md,
  },

  sectionTitle: {
    fontSize: typography.heading,

    fontWeight: "700",

    color: colors.text,

    textTransform: "capitalize",
  },

  sectionSubtitle: {
    marginTop: 3,

    fontSize: typography.caption,

    color: colors.textSecondary,
  },

  emptyDay: {
    minHeight: 92,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: colors.blueLight,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.md,

    marginBottom: spacing.xl,
  },

  emptyDayIcon: {
    width: 44,
    height: 44,

    borderRadius: radius.md,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  emptyDayTitle: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.text,
  },

  emptyDayText: {
    marginTop: 3,

    fontSize: typography.caption,

    lineHeight: 17,

    color: colors.textSecondary,
  },

  contentCard: {
    minHeight: 88,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.md,

    marginBottom: spacing.sm,

    ...shadows.card,
  },

  contentIcon: {
    width: 46,
    height: 46,

    borderRadius: radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  contentInfo: {
    flex: 1,
  },

  contentMeta: {
    flexDirection: "row",

    alignItems: "center",
  },

  statusText: {
    fontSize: typography.tiny,

    fontWeight: "800",

    letterSpacing: 0.5,
  },

  metaDot: {
    width: 3,
    height: 3,

    borderRadius: radius.round,

    backgroundColor: colors.textMuted,

    marginHorizontal: 6,
  },

  formatText: {
    fontSize: typography.tiny,

    color: colors.textMuted,
  },

  contentTitle: {
    marginTop: 5,

    fontSize: typography.body,

    lineHeight: 19,

    fontWeight: "600",

    color: colors.text,
  },

  planAction: {
    width: 36,
    height: 36,

    borderRadius: radius.round,

    backgroundColor: colors.blueLight,

    alignItems: "center",

    justifyContent: "center",

    marginLeft: spacing.sm,
  },

  planActionScheduled: {
    backgroundColor: colors.sageLight,
  },

  unplannedHeader: {
    marginTop: spacing.xl,

    marginBottom: spacing.md,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  unplannedCount: {
    minWidth: 30,

    height: 30,

    paddingHorizontal: 8,

    borderRadius: radius.round,

    backgroundColor: colors.amberLight,

    alignItems: "center",

    justifyContent: "center",
  },

  unplannedCountText: {
    fontSize: typography.caption,

    fontWeight: "800",

    color: colors.amber,
  },

  allPlanned: {
    flexDirection: "row",

    alignItems: "center",

    gap: spacing.sm,

    backgroundColor: colors.sageLight,

    borderRadius: radius.lg,

    padding: spacing.md,
  },

  allPlannedText: {
    fontSize: typography.body,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  modalBackdrop: {
    flex: 1,

    justifyContent: "flex-end",

    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },

  sheet: {
    backgroundColor: colors.background,

    borderTopLeftRadius: radius.xxl,

    borderTopRightRadius: radius.xxl,

    paddingHorizontal: spacing.lg,

    paddingTop: 12,

    paddingBottom: spacing.xl,
  },

  sheetHandle: {
    width: 42,
    height: 4,

    borderRadius: radius.round,

    backgroundColor: colors.border,

    alignSelf: "center",

    marginBottom: spacing.lg,
  },

  sheetTitle: {
    fontSize: typography.heading,

    fontWeight: "700",

    color: colors.text,
  },

  sheetContentTitle: {
    marginTop: spacing.sm,

    fontSize: typography.subheading,

    lineHeight: 22,

    fontWeight: "600",

    color: colors.text,
  },

  sheetDescription: {
    marginTop: 4,

    marginBottom: spacing.lg,

    fontSize: typography.caption,

    color: colors.textSecondary,
  },

  sheetDays: {
    flexDirection: "row",

    justifyContent: "space-between",

    gap: 5,
  },

  sheetDay: {
    flex: 1,

    minHeight: 66,

    borderRadius: radius.md,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: "center",

    justifyContent: "center",
  },

  sheetDaySelected: {
    backgroundColor: colors.blue,

    borderColor: colors.blue,
  },

  sheetDayName: {
    fontSize: 8,

    fontWeight: "700",

    color: colors.textMuted,
  },

  sheetDayNumber: {
    marginTop: 4,

    fontSize: 16,

    fontWeight: "700",

    color: colors.text,
  },

  sheetDayTextSelected: {
    color: colors.surface,
  },

  removePlanning: {
    height: 46,

    marginTop: spacing.lg,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,
  },

  removePlanningText: {
    fontSize: typography.body,

    fontWeight: "600",

    color: colors.danger,
  },
});
