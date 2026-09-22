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
        <View style={styles.planningHero}>
          <View style={styles.heroBubbleOne} />

          <View style={styles.heroBubbleTwo} />

          <View style={styles.heroTop}>
            <View style={styles.heroEyebrow}>
              <Ionicons name="sparkles" size={13} color={colors.blue} />

              <Text style={styles.heroEyebrowText}>PLANEJAMENTO CRIATIVO</Text>
            </View>

            <View style={styles.heroMark}>
              <Ionicons name="calendar" size={21} color={colors.surface} />
            </View>
          </View>

          <Text style={styles.heroTitle}>Planejar</Text>

          <Text style={styles.heroSubtitle}>
            Distribua suas ideias pela semana e transforme intenção em ritmo.
          </Text>

          <View style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.goalEyebrow}>META DA SEMANA</Text>

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
                  size={19}
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

            <View style={styles.goalFooter}>
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

              {weeklyTarget > 0 && (
                <View style={styles.goalPercent}>
                  <Text style={styles.goalPercentText}>
                    {Math.round(progress)}%
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.weekPanel}>
          <View style={styles.weekNav}>
            <TouchableOpacity
              style={styles.weekArrow}
              activeOpacity={0.8}
              onPress={() => setWeekOffset((current) => current - 1)}
            >
              <Ionicons name="chevron-back" size={18} color={colors.blue} />
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
              <Ionicons name="chevron-forward" size={18} color={colors.blue} />
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
        </View>

        <View style={styles.daySectionHeader}>
          <View style={{ flex: 1 }}>
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

          <View style={styles.dayCountBadge}>
            <Ionicons name="calendar-outline" size={14} color={colors.blue} />

            <Text style={styles.dayCountBadgeText}>
              {selectedDayContents.length}
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
          <View style={styles.unplannedMark}>
            <Ionicons name="albums-outline" size={20} color={colors.amber} />
          </View>

          <View style={{ flex: 1 }}>
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
      style={[
        styles.contentCard,
        {
          borderColor: status.background,
        },
      ]}
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
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: status.background,
              },
            ]}
          >
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
          </View>

          {content.format && (
            <View style={styles.formatPill}>
              <Text style={styles.formatText}>{content.format}</Text>
            </View>
          )}
        </View>

        <Text style={styles.contentTitle} numberOfLines={2}>
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

  planningHero: {
    position: "relative",

    overflow: "hidden",

    marginTop: spacing.lg,

    marginBottom: 18,

    padding: 20,

    borderRadius: 28,

    backgroundColor: colors.blueLight,

    borderWidth: 1,

    borderColor: "rgba(121, 165, 184, 0.18)",

    ...shadows.card,
  },

  heroBubbleOne: {
    position: "absolute",

    width: 126,
    height: 126,

    top: -44,
    right: -34,

    borderRadius: 63,

    backgroundColor: "rgba(225, 116, 85, 0.13)",
  },

  heroBubbleTwo: {
    position: "absolute",

    width: 86,
    height: 86,

    left: -26,
    bottom: 28,

    borderRadius: 43,

    backgroundColor: "rgba(142, 127, 194, 0.11)",
  },

  heroTop: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  heroEyebrow: {
    minHeight: 30,

    paddingHorizontal: 10,

    borderRadius: radius.round,

    backgroundColor: "rgba(255, 253, 252, 0.74)",

    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  heroEyebrowText: {
    fontSize: 10,

    letterSpacing: 0.75,

    fontFamily: fonts.bold,

    color: colors.blue,
  },

  heroMark: {
    width: 42,
    height: 42,

    borderRadius: 14,

    backgroundColor: colors.blue,

    alignItems: "center",

    justifyContent: "center",

    ...shadows.soft,
  },

  heroTitle: {
    marginTop: 17,

    fontSize: 32,

    lineHeight: 39,

    letterSpacing: -1,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  heroSubtitle: {
    maxWidth: 315,

    marginTop: 5,

    fontSize: 13,

    lineHeight: 20,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  goalCard: {
    marginTop: 19,

    padding: 15,

    borderRadius: 19,

    backgroundColor: "rgba(255, 253, 252, 0.9)",

    borderWidth: 1,

    borderColor: "rgba(255, 255, 255, 0.74)",
  },

  goalHeader: {
    flexDirection: "row",

    alignItems: "center",
  },

  goalEyebrow: {
    fontSize: 9,

    letterSpacing: 0.85,

    fontFamily: fonts.bold,

    color: colors.blue,
  },

  goalTitle: {
    marginTop: 4,

    fontSize: 20,

    lineHeight: 27,

    letterSpacing: -0.35,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  goalStatus: {
    width: 40,
    height: 40,

    borderRadius: 13,

    backgroundColor: colors.terracottaLight,

    alignItems: "center",

    justifyContent: "center",
  },

  goalStatusDone: {
    backgroundColor: colors.sageLight,
  },

  progressTrack: {
    height: 7,

    marginTop: 14,

    overflow: "hidden",

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,
  },

  progressFill: {
    height: "100%",

    borderRadius: radius.round,

    backgroundColor: colors.terracotta,
  },

  goalFooter: {
    marginTop: 10,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 8,
  },

  goalHint: {
    flex: 1,

    fontSize: 11,

    lineHeight: 17,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  goalPercent: {
    minHeight: 27,

    paddingHorizontal: 9,

    borderRadius: radius.round,

    backgroundColor: colors.terracottaLight,

    alignItems: "center",

    justifyContent: "center",
  },

  goalPercentText: {
    fontSize: 10,

    fontFamily: fonts.bold,

    color: colors.terracotta,
  },

  weekPanel: {
    marginBottom: 30,

    padding: 14,

    borderRadius: 22,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    ...shadows.soft,
  },

  weekNav: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 17,
  },

  weekArrow: {
    width: 38,
    height: 38,

    borderRadius: 12,

    backgroundColor: colors.blueLight,

    alignItems: "center",

    justifyContent: "center",
  },

  weekNavCenter: {
    alignItems: "center",
  },

  weekNavLabel: {
    fontSize: 9,

    letterSpacing: 0.85,

    fontFamily: fonts.bold,

    color: colors.blue,
  },

  weekRange: {
    marginTop: 3,

    fontSize: 15,

    lineHeight: 21,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  calendar: {
    flexDirection: "row",

    justifyContent: "space-between",
  },

  day: {
    width: 42,

    alignItems: "center",
  },

  dayName: {
    marginBottom: 7,

    fontSize: 9,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  dayNameSelected: {
    color: colors.blue,
  },

  dayNumberWrap: {
    width: 39,
    height: 39,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: colors.surfaceSoft,
  },

  dayToday: {
    borderWidth: 1.5,

    borderColor: colors.terracotta,
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
    color: colors.terracotta,

    fontFamily: fonts.bold,
  },

  dayNumberSelected: {
    color: colors.surface,

    fontFamily: fonts.bold,
  },

  dayIndicatorArea: {
    height: 9,

    marginTop: 5,

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

    flexDirection: "row",

    alignItems: "center",

    gap: 12,
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

  dayCountBadge: {
    minWidth: 42,
    height: 42,

    paddingHorizontal: 9,

    borderRadius: 14,

    backgroundColor: colors.blueLight,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 4,
  },

  dayCountBadgeText: {
    fontSize: 12,

    fontFamily: fonts.bold,

    color: colors.blue,
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
    marginTop: 36,

    marginBottom: 15,

    padding: 14,

    borderRadius: 20,

    backgroundColor: colors.amberLight,

    flexDirection: "row",

    alignItems: "center",

    gap: 11,
  },

  unplannedMark: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  unplannedTitle: {
    fontSize: 20,

    lineHeight: 27,

    letterSpacing: -0.4,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  unplannedSubtitle: {
    marginTop: 2,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  unplannedCount: {
    minWidth: 34,

    height: 34,

    paddingHorizontal: 9,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

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
    minHeight: 84,

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

    ...shadows.card,
  },

  contentAccent: {
    position: "absolute",

    left: 0,
    top: 11,
    bottom: 11,

    width: 4,

    borderRadius: radius.round,
  },

  contentIcon: {
    width: 44,
    height: 44,

    marginRight: 11,

    borderRadius: 14,

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

    gap: 6,
  },

  statusPill: {
    minHeight: 23,

    paddingHorizontal: 8,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",
  },

  statusText: {
    fontSize: 9,

    letterSpacing: 0.45,

    fontFamily: fonts.bold,
  },

  formatPill: {
    minHeight: 23,

    paddingHorizontal: 8,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  metaDot: {
    display: "none",
  },

  formatText: {
    fontSize: 9,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  contentTitle: {
    marginTop: 6,

    fontSize: 15,

    lineHeight: 21,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  planButton: {
    minHeight: 36,

    marginLeft: 8,

    paddingHorizontal: 10,

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
