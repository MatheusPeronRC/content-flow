import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ProductionEffortBadge } from "../../components/ProductionEffortSelector";

import { getContents, updateContent } from "../../services/contentStorage";
import { getCreatorProfile } from "../../services/profileStorage";

import { ContentItem, ContentStatus } from "../../types/content";
import { CreatorProfile } from "../../types/creatorProfile";
import { ProductionEffort } from "../../types/productionEffort";

import {
  colors,
  fonts,
  radius,
  shadows,
  spacing,
  statusColors,
} from "../../constants/theme";

const DAY_NAMES = ["SEG", "TER", "QUA", "QUI", "SEX", "SÁB", "DOM"];

type EffortFilter = "all" | ProductionEffort;

const effortFilters: Array<{
  value: EffortFilter;
  label: string;
}> = [
  { value: "all", label: "Todos" },
  { value: "quick", label: "Rápidos" },
  { value: "medium", label: "Médios" },
  { value: "demanding", label: "Demorados" },
];

export default function PlanejarScreen() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()));

  const [planningContent, setPlanningContent] = useState<ContentItem | null>(
    null,
  );

  const [dayPickerVisible, setDayPickerVisible] = useState(false);

  const [effortFilter, setEffortFilter] = useState<EffortFilter>("all");

  const weekDays = useMemo(() => {
    const today = new Date();
    const monday = getMonday(today);

    monday.setDate(monday.getDate() + weekOffset * 7);

    return Array.from({ length: 7 }).map((_, index) => {
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

      void load();

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

  const progress =
    weeklyTarget === 0 ? 0 : Math.min((plannedCount / weeklyTarget) * 100, 100);

  const selectedDayContents = contents.filter(
    (content) => content.plannedDate === selectedDate,
  );

  const unplannedContents = contents.filter(
    (content) => !content.plannedDate && content.status !== "publicado",
  );

  const filteredUnplannedContents = unplannedContents.filter(
    (content) =>
      effortFilter === "all" || content.productionEffort === effortFilter,
  );

  const selectedDay =
    weekDays.find((day) => day.key === selectedDate) ?? weekDays[0];

  async function planContent(content: ContentItem, date: string | null) {
    try {
      await updateContent(content.id, {
        plannedDate: date,
      });

      setContents((current) =>
        current.map((item) =>
          item.id === content.id
            ? {
                ...item,
                plannedDate: date,
              }
            : item,
        ),
      );
    } catch (error) {
      console.error("Erro ao planejar conteúdo:", error);
      throw error;
    }
  }

  async function handlePlan(date: string | null) {
    if (!planningContent) {
      return;
    }

    try {
      await planContent(planningContent, date);
      setPlanningContent(null);
    } catch {
      // Erro já registrado em planContent.
    }
  }

  async function handleAddToSelectedDay(content: ContentItem) {
    try {
      await planContent(content, selectedDate);
      setDayPickerVisible(false);
    } catch {
      // Erro já registrado em planContent.
    }
  }

  function openContent(content: ContentItem) {
    router.push(`/conteudo/${content.id}` as any);
  }

  function getContentCount(date: string) {
    return contents.filter((content) => content.plannedDate === date).length;
  }

  function goToCurrentWeek() {
    setWeekOffset(0);
    setSelectedDate(toDateKey(new Date()));
  }

  function handleAddContentToDay() {
    if (unplannedContents.length === 0) {
      router.push("/conteudo/manual" as any);
      return;
    }

    setDayPickerVisible(true);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Planejar</Text>

            <Text style={styles.subtitle}>
              Organize sua semana e transforme suas ideias em conteúdo.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.calendarButton}
            activeOpacity={0.82}
            onPress={goToCurrentWeek}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekHeader}>
          <TouchableOpacity
            style={styles.weekArrow}
            activeOpacity={0.8}
            onPress={() => setWeekOffset((current) => current - 1)}
          >
            <Ionicons
              name="chevron-back"
              size={17}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <View style={styles.weekLabelWrap}>
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
            activeOpacity={0.8}
            onPress={() => setWeekOffset((current) => current + 1)}
          >
            <Ionicons
              name="chevron-forward"
              size={17}
              color={colors.textSecondary}
            />
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
                style={[styles.day, selected && styles.daySelected]}
                activeOpacity={0.8}
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
                    today && !selected && styles.dayNumberToday,
                    selected && styles.dayNumberSelected,
                  ]}
                >
                  {day.dayNumber}
                </Text>

                <View
                  style={[
                    styles.dayDot,
                    count > 0 && styles.dayDotVisible,
                    selected && count > 0 && styles.dayDotSelected,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.goalCard}>
          <View style={styles.goalTop}>
            <View style={styles.goalIcon}>
              <Ionicons
                name="flag-outline"
                size={19}
                color={colors.terracotta}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.goalTitle}>Meta da semana</Text>

              <Text style={styles.goalSubtitle}>
                {weeklyTarget === 0
                  ? "Defina sua meta semanal no perfil"
                  : `${plannedCount} de ${weeklyTarget} conteúdos planejados`}
              </Text>
            </View>

            {weeklyTarget > 0 ? (
              <Text style={styles.goalPercent}>{Math.round(progress)}%</Text>
            ) : null}
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

          {weeklyTarget > 0 && remaining > 0 ? (
            <Text style={styles.goalHint}>
              Faltam {remaining} {remaining === 1 ? "conteúdo" : "conteúdos"}{" "}
              para completar sua meta.
            </Text>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>
              Conteúdos de {formatSelectedDayShort(selectedDay.date)}
            </Text>

            <Text style={styles.sectionSubtitle}>
              {selectedDayContents.length === 0
                ? "Nenhum conteúdo planejado."
                : selectedDayContents.length === 1
                  ? "1 conteúdo planejado."
                  : `${selectedDayContents.length} conteúdos planejados.`}
            </Text>
          </View>

          <Text style={styles.sectionCount}>
            {selectedDayContents.length}{" "}
            {selectedDayContents.length === 1 ? "item" : "itens"}
          </Text>
        </View>

        {selectedDayContents.length > 0 ? (
          <View style={styles.plannedList}>
            {selectedDayContents.map((content) => (
              <PlanningRow
                key={content.id}
                content={content}
                onOpen={() => openContent(content)}
                onPlan={() => setPlanningContent(content)}
              />
            ))}
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.addToDayButton}
          activeOpacity={0.84}
          onPress={handleAddContentToDay}
        >
          <Ionicons name="add" size={19} color={colors.terracotta} />

          <Text style={styles.addToDayText}>
            {unplannedContents.length > 0
              ? "Adicionar conteúdo neste dia"
              : "Criar conteúdo para este dia"}
          </Text>
        </TouchableOpacity>

        <View style={styles.unplannedHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Ideias não planejadas</Text>

            <Text style={styles.sectionSubtitle}>
              Escolha o que faz sentido para a sua semana.
            </Text>
          </View>

          <Text style={styles.sectionCount}>
            {unplannedContents.length}{" "}
            {unplannedContents.length === 1 ? "ideia" : "ideias"}
          </Text>
        </View>

        {unplannedContents.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.effortFilters}
          >
            {effortFilters.map((filter) => {
              const selected = effortFilter === filter.value;

              return (
                <TouchableOpacity
                  key={filter.value}
                  style={[
                    styles.effortFilter,
                    selected && styles.effortFilterSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setEffortFilter(filter.value)}
                >
                  <Text
                    style={[
                      styles.effortFilterText,
                      selected && styles.effortFilterTextSelected,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : null}

        {unplannedContents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="checkmark-circle-outline"
              size={22}
              color={colors.sage}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.emptyTitle}>Tudo organizado.</Text>

              <Text style={styles.emptyText}>
                Todos os seus conteúdos já têm um lugar na agenda.
              </Text>
            </View>
          </View>
        ) : filteredUnplannedContents.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="filter-outline"
              size={20}
              color={colors.textSecondary}
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.emptyTitle}>Nada com esse esforço.</Text>

              <Text style={styles.emptyText}>
                Escolha outro filtro para ver mais ideias.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.unplannedList}>
            {filteredUnplannedContents.map((content) => (
              <PlanningRow
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
                <Text style={styles.sheetEyebrow}>
                  {planningContent?.plannedDate
                    ? "MOVER CONTEÚDO"
                    : "PLANEJAR CONTEÚDO"}
                </Text>

                <Text style={styles.sheetTitle} numberOfLines={2}>
                  {planningContent?.idea}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.sheetClose}
                activeOpacity={0.8}
                onPress={() => setPlanningContent(null)}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetHint}>Escolha o dia da semana.</Text>

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
                    activeOpacity={0.82}
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

            {planningContent?.plannedDate ? (
              <TouchableOpacity
                style={styles.removePlanning}
                activeOpacity={0.82}
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
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>

      <Modal
        visible={dayPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDayPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setDayPickerVisible(false)}
          />

          <SafeAreaView edges={["bottom"]} style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetEyebrow}>
                  ADICIONAR EM{" "}
                  {formatSelectedDayShort(selectedDay.date).toUpperCase()}
                </Text>

                <Text style={styles.sheetTitle}>Escolha um conteúdo</Text>
              </View>

              <TouchableOpacity
                style={styles.sheetClose}
                activeOpacity={0.8}
                onPress={() => setDayPickerVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.pickerList}
            >
              {unplannedContents.map((content) => (
                <PlanningRow
                  key={content.id}
                  content={content}
                  unplanned
                  compact
                  onOpen={() => void handleAddToSelectedDay(content)}
                  onPlan={() => void handleAddToSelectedDay(content)}
                />
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type PlanningRowProps = {
  content: ContentItem;
  onOpen: () => void;
  onPlan: () => void;
  unplanned?: boolean;
  compact?: boolean;
};

function PlanningRow({
  content,
  onOpen,
  onPlan,
  unplanned = false,
  compact = false,
}: PlanningRowProps) {
  const status = getStatusMeta(content.status);
  const thumbnail = content.reference?.thumbnailUrl ?? null;

  return (
    <TouchableOpacity
      style={[styles.contentRow, compact && styles.contentRowCompact]}
      activeOpacity={0.86}
      onPress={onOpen}
    >
      <View style={styles.thumbnail}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnailImage} />
        ) : (
          <Ionicons name={status.icon} size={21} color={status.foreground} />
        )}
      </View>

      <View style={styles.rowMain}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {content.idea}
          </Text>

          {!compact ? (
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
          ) : null}
        </View>

        <View style={styles.rowMeta}>
          {content.format ? (
            <View style={styles.metaPill}>
              <Ionicons
                name={getFormatIcon(content.format)}
                size={12}
                color={colors.textSecondary}
              />

              <Text style={styles.metaText}>{content.format}</Text>
            </View>
          ) : null}

          <ProductionEffortBadge effort={content.productionEffort} subtle />
        </View>
      </View>

      <TouchableOpacity
        style={[styles.planButton, !unplanned && styles.planButtonSecondary]}
        activeOpacity={0.82}
        onPress={(event) => {
          event.stopPropagation();
          onPlan();
        }}
      >
        {unplanned ? (
          <Text style={styles.planButtonText}>Planejar</Text>
        ) : (
          <Ionicons
            name="calendar-outline"
            size={17}
            color={colors.textSecondary}
          />
        )}
      </TouchableOpacity>

      {!compact ? (
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      ) : null}
    </TouchableOpacity>
  );
}

function getStatusMeta(status: ContentStatus) {
  switch (status) {
    case "ideia":
      return {
        label: "Ideia",
        icon: "bulb-outline" as const,
        ...statusColors.ideia,
      };

    case "roteiro":
      return {
        label: "Roteiro",
        icon: "create-outline" as const,
        ...statusColors.roteiro,
      };

    case "gravar":
      return {
        label: "Em andamento",
        icon: "videocam-outline" as const,
        ...statusColors.gravar,
      };

    case "editar":
      return {
        label: "Em andamento",
        icon: "cut-outline" as const,
        ...statusColors.editar,
      };

    case "pronto":
      return {
        label: "Pronto",
        icon: "checkmark-circle-outline" as const,
        ...statusColors.pronto,
      };

    case "publicado":
      return {
        label: "Publicado",
        icon: "paper-plane-outline" as const,
        ...statusColors.publicado,
      };
  }
}

function getFormatIcon(format: string): keyof typeof Ionicons.glyphMap {
  const normalized = format.toLowerCase();

  if (normalized.includes("reel") || normalized.includes("vídeo")) {
    return "videocam-outline";
  }

  if (normalized.includes("carrossel")) {
    return "albums-outline";
  }

  if (normalized.includes("story")) {
    return "phone-portrait-outline";
  }

  return "image-outline";
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

function formatSelectedDayShort(date: Date) {
  const weekday = date
    .toLocaleDateString("pt-BR", {
      weekday: "long",
    })
    .replace("-feira", "");

  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${date.getDate()}`;
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
    paddingTop: 20,
    paddingBottom: 19,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },

  title: {
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.9,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  subtitle: {
    maxWidth: 300,
    marginTop: 3,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  calendarButton: {
    width: 44,
    height: 44,
    marginTop: 2,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  weekHeader: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  weekArrow: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  weekLabelWrap: {
    flex: 1,
    alignItems: "center",
  },

  weekLabel: {
    fontSize: 9,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  weekRange: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  calendar: {
    flexDirection: "row",
    gap: 6,
  },

  day: {
    flex: 1,
    minWidth: 0,
    minHeight: 66,
    paddingVertical: 8,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  daySelected: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
    ...shadows.soft,
  },

  dayName: {
    fontSize: 9,
    lineHeight: 13,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  dayNameSelected: {
    color: "rgba(255,255,255,0.86)",
  },

  dayNumber: {
    marginTop: 3,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  dayNumberToday: {
    color: colors.terracotta,
  },

  dayNumberSelected: {
    color: colors.surface,
  },

  dayDot: {
    width: 4,
    height: 4,
    marginTop: 4,
    borderRadius: radius.round,
    backgroundColor: "transparent",
  },

  dayDotVisible: {
    backgroundColor: colors.textMuted,
  },

  dayDotSelected: {
    backgroundColor: colors.surface,
  },

  goalCard: {
    marginTop: 18,
    padding: 15,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },

  goalTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  goalIcon: {
    width: 39,
    height: 39,
    borderRadius: 12,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  goalTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  goalSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  goalPercent: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  progressTrack: {
    height: 7,
    marginTop: 13,
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
    marginTop: 8,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  sectionHeader: {
    marginTop: 25,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  unplannedHeader: {
    marginTop: 30,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  sectionTitle: {
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.35,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  sectionCount: {
    paddingBottom: 2,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  plannedList: {
    overflow: "hidden",
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  unplannedList: {
    overflow: "hidden",
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  contentRow: {
    minHeight: 82,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  contentRowCompact: {
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },

  thumbnail: {
    width: 58,
    height: 58,
    overflow: "hidden",
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  rowMain: {
    flex: 1,
    minWidth: 0,
  },

  rowTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  rowTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  statusPill: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  statusText: {
    fontSize: 9,
    lineHeight: 13,
    fontFamily: fonts.bold,
  },

  rowMeta: {
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },

  metaPill: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  planButton: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: 11,
    backgroundColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },

  planButtonSecondary: {
    width: 34,
    paddingHorizontal: 0,
    backgroundColor: colors.surfaceMuted,
  },

  planButtonText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  addToDayButton: {
    minHeight: 54,
    marginTop: 10,
    borderRadius: 15,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.terracotta,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  addToDayText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },

  effortFilters: {
    gap: 7,
    paddingBottom: 11,
  },

  effortFilter: {
    minHeight: 35,
    paddingHorizontal: 13,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  effortFilterSelected: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },

  effortFilterText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  effortFilterTextSelected: {
    color: colors.surface,
  },

  emptyCard: {
    minHeight: 76,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  emptyTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  emptyText: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },

  sheet: {
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.surface,
  },

  pickerSheet: {
    maxHeight: "76%",
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.surface,
  },

  sheetHandle: {
    width: 42,
    height: 4,
    marginBottom: 18,
    alignSelf: "center",
    borderRadius: radius.round,
    backgroundColor: colors.border,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  sheetEyebrow: {
    fontSize: 9,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  sheetTitle: {
    marginTop: 3,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sheetClose: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetHint: {
    marginTop: 18,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  sheetDays: {
    marginTop: 10,
    flexDirection: "row",
    gap: 6,
  },

  sheetDay: {
    flex: 1,
    minWidth: 0,
    minHeight: 59,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetDaySelected: {
    borderColor: colors.terracotta,
    backgroundColor: colors.terracotta,
  },

  sheetDayName: {
    fontSize: 8,
    lineHeight: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  sheetDayNameSelected: {
    color: "rgba(255,255,255,0.82)",
  },

  sheetDayNumber: {
    marginTop: 2,
    fontSize: 15,
    lineHeight: 19,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sheetDayNumberSelected: {
    color: colors.surface,
  },

  removePlanning: {
    minHeight: 47,
    marginTop: 16,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  removePlanningText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.danger,
  },

  pickerList: {
    paddingTop: 16,
    paddingBottom: 8,
  },
});
