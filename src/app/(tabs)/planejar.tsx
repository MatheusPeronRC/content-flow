import { Ionicons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";

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
    fonts,
    radius,
    shadows,
    spacing,
    statusColors,
} from "../../constants/theme";

const DAY_NAMES = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

export default function PlanejarScreen() {
  const [contents, setContents] = useState<ContentItem[]>([]);

  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  const [weekOffset, setWeekOffset] = useState(0);

  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));

  const [planningContent, setPlanningContent] = useState<ContentItem | null>(
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

    if (exists) {
      return;
    }

    const todayKey = toDateKey(new Date());

    const todayInWeek = weekDays.some((day) => day.key === todayKey);

    setSelectedDate(todayInWeek ? todayKey : weekDays[0].key);
  }, [weekDays, selectedDate]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
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

      load();

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

  const exceeded = Math.max(plannedCount - weeklyTarget, 0);

  const progress =
    weeklyTarget === 0 ? 0 : Math.min((plannedCount / weeklyTarget) * 100, 100);

  const selectedDayContents = contents.filter(
    (content) => content.plannedDate === selectedDate,
  );

  const unplannedContents = contents.filter(
    (content) => !content.plannedDate && content.status !== "publicado",
  );

  const selectedDay =
    weekDays.find((day) => day.key === selectedDate) ?? weekDays[0];

  async function handlePlan(date: string | null) {
    if (!planningContent) {
      return;
    }

    try {
      await updateContent(planningContent.id, {
        plannedDate: date,
      });

      setContents((current) =>
        current.map((content) =>
          content.id === planningContent.id
            ? {
                ...content,
                plannedDate: date,
              }
            : content,
        ),
      );

      setPlanningContent(null);
    } catch (error) {
      console.error("Erro ao planejar conteúdo:", error);
    }
  }

  function openContent(content: ContentItem) {
    router.push(`/conteudo/${content.id}`);
  }

  function getContentCount(date: string) {
    return contents.filter((content) => content.plannedDate === date).length;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Planejar</Text>

            <Text style={styles.subtitle}>Organize sua semana criativa.</Text>
          </View>

          <View style={styles.headerMark}>
            <Ionicons name="calendar-outline" size={22} color={colors.blue} />
          </View>
        </View>

        <View style={styles.goal}>
          <View style={styles.goalHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.goalEyebrow}>META SEMANAL</Text>

              <Text style={styles.goalTitle}>
                {weeklyTarget === 0
                  ? "Meta não definida"
                  : `${plannedCount} de ${weeklyTarget} planejados`}
              </Text>
            </View>

            <View
              style={[
                styles.goalStatus,

                remaining === 0 && weeklyTarget > 0 && styles.goalStatusDone,
              ]}
            >
              <Ionicons
                name={
                  remaining === 0 && weeklyTarget > 0
                    ? "checkmark"
                    : "flag-outline"
                }
                size={20}
                color={
                  remaining === 0 && weeklyTarget > 0
                    ? colors.sage
                    : colors.terracotta
                }
              />
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

          <Text style={styles.goalHint}>
            {weeklyTarget === 0
              ? "Defina sua frequência no perfil."
              : exceeded > 0
                ? `Meta superada em ${exceeded} ${
                    exceeded === 1 ? "conteúdo" : "conteúdos"
                  }.`
                : remaining > 0
                  ? `Falta${remaining === 1 ? "" : "m"} ${remaining} ${
                      remaining === 1 ? "conteúdo" : "conteúdos"
                    } para completar sua semana.`
                  : "Semana planejada ✓"}
          </Text>
        </View>

        <View style={styles.weekNav}>
          <TouchableOpacity
            style={styles.weekArrow}
            activeOpacity={0.8}
            onPress={() => setWeekOffset((current) => current - 1)}
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.weekNavCenter}>
            <Text style={styles.weekNavLabel}>
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
            activeOpacity={0.8}
            onPress={() => setWeekOffset((current) => current + 1)}
          >
            <Ionicons name="arrow-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.calendar}>
          {weekDays.map((day) => {
            const selected = day.key === selectedDate;

            const today = day.key === toDateKey(new Date());

            const count = getContentCount(day.key);

            return (
              <TouchableOpacity
                key={day.key}
                style={styles.day}
                activeOpacity={0.75}
                onPress={() => setSelectedDate(day.key)}
              >
                <Text
                  style={[styles.dayName, selected && styles.dayNameSelected]}
                >
                  {day.dayName}
                </Text>

                <View
                  style={[
                    styles.dayNumberWrap,

                    today && styles.dayToday,

                    selected && styles.daySelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNumber,

                      today && styles.dayNumberToday,

                      selected && styles.dayNumberSelected,
                    ]}
                  >
                    {day.dayNumber}
                  </Text>
                </View>

                <View style={styles.dayIndicatorArea}>
                  {count > 0 && (
                    <View style={styles.dayDots}>
                      {Array.from({
                        length: Math.min(count, 3),
                      }).map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.dayDot,

                            selected && styles.dayDotSelected,
                          ]}
                        />
                      ))}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.daySectionHeader}>
          <View>
            <Text style={styles.dayTitle}>
              {formatSelectedDay(selectedDay.date)}
            </Text>

            <Text style={styles.daySubtitle}>
              {selectedDayContents.length === 0
                ? "Nenhum conteúdo planejado."
                : selectedDayContents.length === 1
                  ? "1 conteúdo planejado."
                  : `${selectedDayContents.length} conteúdos planejados.`}
            </Text>
          </View>
        </View>

        {selectedDayContents.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyDay}
            activeOpacity={0.85}
            onPress={() => {
              if (unplannedContents.length > 0) {
                setPlanningContent(unplannedContents[0]);
              }
            }}
          >
            <View style={styles.emptyDayMark}>
              <Ionicons
                name="calendar-clear-outline"
                size={21}
                color={colors.blue}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.emptyDayTitle}>Esse dia está livre.</Text>

              <Text style={styles.emptyDayText}>
                Escolha um conteúdo abaixo para ocupar esse espaço.
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.plannedList}>
            {selectedDayContents.map((content) => (
              <PlanningCard
                key={content.id}
                content={content}
                onOpen={() => openContent(content)}
                onPlan={() => setPlanningContent(content)}
              />
            ))}
          </View>
        )}

        <View style={styles.unplannedHeader}>
          <View>
            <Text style={styles.unplannedTitle}>Não planejados</Text>

            <Text style={styles.unplannedSubtitle}>
              Ideias esperando um lugar na sua semana.
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
              size={21}
              color={colors.sage}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.allPlannedTitle}>Tudo organizado.</Text>

              <Text style={styles.allPlannedText}>
                Todos os seus conteúdos já têm um lugar.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.unplannedList}>
            {unplannedContents.map((content) => (
              <PlanningCard
                key={content.id}
                content={content}
                unplanned
                onOpen={() => openContent(content)}
                onPlan={() => setPlanningContent(content)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={planningContent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPlanningContent(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setPlanningContent(null)}
          />

          <SafeAreaView edges={["bottom"]} style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>
                  {planningContent?.plannedDate
                    ? "Mover conteúdo"
                    : "Planejar conteúdo"}
                </Text>

                <Text style={styles.sheetContent} numberOfLines={3}>
                  {planningContent?.idea}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.sheetClose}
                onPress={() => setPlanningContent(null)}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetHint}>Em qual dia isso entra?</Text>

            <View style={styles.sheetDays}>
              {weekDays.map((day) => {
                const selected = planningContent?.plannedDate === day.key;

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

                        selected && styles.sheetDayNameSelected,
                      ]}
                    >
                      {day.dayName}
                    </Text>

                    <Text
                      style={[
                        styles.sheetDayNumber,

                        selected && styles.sheetDayNumberSelected,
                      ]}
                    >
                      {day.dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {planningContent?.plannedDate && (
              <TouchableOpacity
                style={styles.removePlanning}
                onPress={() => handlePlan(null)}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={18}
                  color={colors.danger}
                />

                <Text style={styles.removePlanningText}>
                  Remover do planejamento
                </Text>
              </TouchableOpacity>
            )}
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type PlanningCardProps = {
  content: ContentItem;
  onOpen: () => void;
  onPlan: () => void;
  unplanned?: boolean;
};

function PlanningCard({
  content,
  onOpen,
  onPlan,
  unplanned = false,
}: PlanningCardProps) {
  const status = getStatusMeta(content.status);

  return (
    <TouchableOpacity
      style={styles.contentCard}
      activeOpacity={0.86}
      onPress={onOpen}
    >
      <View
        style={[
          styles.contentAccent,

          {
            backgroundColor: status.foreground,
          },
        ]}
      />

      <View
        style={[
          styles.contentIcon,

          {
            backgroundColor: status.background,
          },
        ]}
      >
        <Ionicons name={status.icon} size={19} color={status.foreground} />
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

        <Text style={styles.contentTitle} numberOfLines={3}>
          {content.idea}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.planButton, !unplanned && styles.changeButton]}
        activeOpacity={0.8}
        onPress={(event) => {
          event.stopPropagation();

          onPlan();
        }}
      >
        <Ionicons
          name={unplanned ? "add" : "calendar-outline"}
          size={15}
          color={unplanned ? colors.blue : colors.sage}
        />

        <Text
          style={[styles.planButtonText, !unplanned && styles.changeButtonText]}
        >
          {unplanned ? "Planejar" : "Alterar"}
        </Text>
      </TouchableOpacity>
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
  const sameMonth =
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    const month = end
      .toLocaleDateString("pt-BR", {
        month: "short",
      })
      .replace(".", "")
      .toUpperCase();

    return `${String(start.getDate()).padStart(2, "0")} — ${String(
      end.getDate(),
    ).padStart(2, "0")} ${month}`;
  }

  const startText = start
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })
    .replace(".", "");

  const endText = end
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })
    .replace(".", "");

  return `${startText} — ${endText}`;
}

function formatSelectedDay(date: Date) {
  const formatted = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,

    paddingBottom: 140,
  },

  header: {
    paddingTop: spacing.lg,

    paddingBottom: 30,

    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",
  },

  title: {
    fontSize: 32,

    lineHeight: 40,

    letterSpacing: -1,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  subtitle: {
    marginTop: 6,

    fontSize: 14,

    lineHeight: 21,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  headerMark: {
    width: 44,
    height: 44,

    marginTop: 3,

    borderRadius: 14,

    backgroundColor: colors.blueLight,

    alignItems: "center",

    justifyContent: "center",
  },

  goal: {
    padding: 18,

    marginBottom: 32,

    borderRadius: 22,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    ...shadows.soft,
  },

  goalHeader: {
    flexDirection: "row",

    alignItems: "center",
  },

  goalEyebrow: {
    fontSize: 10,

    letterSpacing: 1,

    fontFamily: fonts.bold,

    color: colors.blue,
  },

  goalTitle: {
    marginTop: 5,

    fontSize: 22,

    lineHeight: 29,

    letterSpacing: -0.4,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  goalStatus: {
    width: 42,
    height: 42,

    borderRadius: 14,

    backgroundColor: colors.terracottaLight,

    alignItems: "center",

    justifyContent: "center",
  },

  goalStatusDone: {
    backgroundColor: colors.sageLight,
  },

  progressTrack: {
    height: 6,

    marginTop: 18,

    overflow: "hidden",

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,
  },

  progressFill: {
    height: "100%",

    borderRadius: radius.round,

    backgroundColor: colors.terracotta,
  },

  goalHint: {
    marginTop: 11,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  weekNav: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 20,
  },

  weekArrow: {
    width: 40,
    height: 40,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",

    borderWidth: 1,

    borderColor: colors.border,
  },

  weekNavCenter: {
    alignItems: "center",
  },

  weekNavLabel: {
    fontSize: 10,

    letterSpacing: 0.9,

    fontFamily: fonts.bold,

    color: colors.blue,
  },

  weekRange: {
    marginTop: 4,

    fontSize: 16,

    lineHeight: 22,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  calendar: {
    flexDirection: "row",

    justifyContent: "space-between",

    marginBottom: 34,
  },

  day: {
    width: 42,

    alignItems: "center",
  },

  dayName: {
    marginBottom: 8,

    fontSize: 10,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  dayNameSelected: {
    color: colors.blue,
  },

  dayNumberWrap: {
    width: 40,
    height: 40,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: colors.surfaceSoft,
  },

  dayToday: {
    borderWidth: 1.5,

    borderColor: colors.text,
  },

  daySelected: {
    borderWidth: 0,

    backgroundColor: colors.blue,
  },

  dayNumber: {
    fontSize: 14,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  dayNumberToday: {
    color: colors.text,
  },

  dayNumberSelected: {
    color: colors.surface,

    fontFamily: fonts.bold,
  },

  dayIndicatorArea: {
    height: 10,

    marginTop: 6,

    justifyContent: "center",
  },

  dayDots: {
    flexDirection: "row",

    gap: 2,
  },

  dayDot: {
    width: 4,
    height: 4,

    borderRadius: radius.round,

    backgroundColor: colors.blue,
  },

  dayDotSelected: {
    backgroundColor: colors.blueLight,
  },

  daySectionHeader: {
    marginBottom: 15,
  },

  dayTitle: {
    fontSize: 24,

    lineHeight: 31,

    letterSpacing: -0.5,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  daySubtitle: {
    marginTop: 4,

    fontSize: 13,

    lineHeight: 19,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  emptyDay: {
    minHeight: 84,

    paddingVertical: 15,

    flexDirection: "row",

    alignItems: "center",

    borderTopWidth: 1,

    borderBottomWidth: 1,

    borderColor: colors.divider,
  },

  emptyDayMark: {
    width: 42,
    height: 42,

    marginRight: spacing.md,

    borderRadius: 13,

    backgroundColor: colors.blueLight,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyDayTitle: {
    fontSize: 15,

    lineHeight: 21,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  emptyDayText: {
    marginTop: 4,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  plannedList: {
    gap: 10,
  },

  unplannedHeader: {
    marginTop: 38,

    marginBottom: 15,

    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "space-between",
  },

  unplannedTitle: {
    fontSize: 24,

    lineHeight: 31,

    letterSpacing: -0.5,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  unplannedSubtitle: {
    marginTop: 4,

    fontSize: 13,

    lineHeight: 19,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
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
    fontSize: 11,

    fontFamily: fonts.bold,

    color: colors.amber,
  },

  unplannedList: {
    gap: 10,
  },

  contentCard: {
    minHeight: 88,

    position: "relative",

    overflow: "hidden",

    padding: 14,

    paddingLeft: 17,

    flexDirection: "row",

    alignItems: "center",

    borderRadius: 19,

    borderWidth: 1,

    borderColor: colors.border,

    backgroundColor: colors.surface,

    ...shadows.soft,
  },

  contentAccent: {
    position: "absolute",

    left: 0,
    top: 14,
    bottom: 14,

    width: 3,

    borderRadius: radius.round,
  },

  contentIcon: {
    width: 42,
    height: 42,

    marginRight: 12,

    borderRadius: 13,

    alignItems: "center",

    justifyContent: "center",
  },

  contentInfo: {
    flex: 1,

    minWidth: 0,
  },

  contentMeta: {
    flexDirection: "row",

    alignItems: "center",
  },

  statusText: {
    fontSize: 10,

    letterSpacing: 0.5,

    fontFamily: fonts.bold,
  },

  metaDot: {
    width: 3,
    height: 3,

    marginHorizontal: 5,

    borderRadius: radius.round,

    backgroundColor: colors.textMuted,
  },

  formatText: {
    fontSize: 10,

    fontFamily: fonts.medium,

    color: colors.textSecondary,
  },

  contentTitle: {
    marginTop: 5,

    fontSize: 15,

    lineHeight: 22,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  planButton: {
    minHeight: 38,

    marginLeft: 8,

    paddingHorizontal: 11,

    borderRadius: 12,

    flexDirection: "row",

    alignItems: "center",

    gap: 4,

    backgroundColor: colors.blueLight,
  },

  planButtonText: {
    fontSize: 11,

    fontFamily: fonts.semibold,

    color: colors.blue,
  },

  changeButton: {
    backgroundColor: colors.sageLight,
  },

  changeButtonText: {
    color: colors.sage,
  },

  allPlanned: {
    minHeight: 82,

    flexDirection: "row",

    alignItems: "center",

    gap: 12,

    paddingVertical: 15,

    borderTopWidth: 1,

    borderBottomWidth: 1,

    borderColor: colors.divider,
  },

  allPlannedTitle: {
    fontSize: 15,

    lineHeight: 21,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  allPlannedText: {
    marginTop: 3,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  modalBackdrop: {
    flex: 1,

    justifyContent: "flex-end",

    backgroundColor: colors.overlay,
  },

  sheet: {
    marginHorizontal: 10,

    marginBottom: 8,

    paddingHorizontal: spacing.lg,

    paddingTop: 12,

    paddingBottom: spacing.lg,

    borderRadius: radius.xxl,

    backgroundColor: colors.surface,
  },

  sheetHandle: {
    width: 36,
    height: 4,

    alignSelf: "center",

    marginBottom: 22,

    borderRadius: radius.round,

    backgroundColor: colors.border,
  },

  sheetHeader: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  sheetTitle: {
    fontSize: 24,

    lineHeight: 31,

    letterSpacing: -0.5,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  sheetContent: {
    maxWidth: 280,

    marginTop: 6,

    fontSize: 13,

    lineHeight: 20,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  sheetClose: {
    width: 40,
    height: 40,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  sheetHint: {
    marginTop: 25,

    marginBottom: 12,

    fontSize: 13,

    lineHeight: 19,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  sheetDays: {
    flexDirection: "row",

    justifyContent: "space-between",

    gap: 5,
  },

  sheetDay: {
    flex: 1,

    height: 68,

    borderRadius: 16,

    backgroundColor: colors.surfaceSoft,

    alignItems: "center",

    justifyContent: "center",
  },

  sheetDaySelected: {
    backgroundColor: colors.blue,
  },

  sheetDayName: {
    fontSize: 9,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  sheetDayNameSelected: {
    color: colors.blueLight,
  },

  sheetDayNumber: {
    marginTop: 4,

    fontSize: 16,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  sheetDayNumberSelected: {
    color: colors.surface,
  },

  removePlanning: {
    minHeight: 46,

    marginTop: 18,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,
  },

  removePlanningText: {
    fontSize: 12,

    fontFamily: fonts.semibold,

    color: colors.danger,
  },
});
