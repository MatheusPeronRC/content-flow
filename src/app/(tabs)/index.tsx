import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
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

type QuickActionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  primary?: boolean;
  onPress: () => void;
};

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

      void loadHome();

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

  const completedThisWeek = weeklyContents.filter(
    (content) => content.status === "pronto" || content.status === "publicado",
  ).length;

  const publishedThisWeek = weeklyContents.filter(
    (content) => content.status === "publicado",
  ).length;

  const progress =
    weeklyTarget === 0
      ? 0
      : Math.min(Math.round((plannedThisWeek / weeklyTarget) * 100), 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <Text style={styles.brandContent}>Content</Text>
            <Text style={styles.brandFlow}>Flow</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            activeOpacity={0.8}
            onPress={() => router.push("/perfil")}
          >
            {profile?.avatarUri ? (
              <Image
                source={{ uri: profile.avatarUri }}
                style={styles.profileImage}
              />
            ) : (
              <Ionicons name="person-outline" size={20} color={colors.text} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.welcome}>
          <Text style={styles.greeting}>{getGreeting()} 👋</Text>
          <Text style={styles.welcomeText}>
            Organize suas ideias e mantenha seu conteúdo em movimento.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.progressCard}
          activeOpacity={0.9}
          onPress={() => router.push("/planejar")}
        >
          <View style={styles.progressHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.progressEyebrow}>
                SEU PROGRESSO DA SEMANA
              </Text>
              <Text style={styles.progressTitle}>
                {weeklyTarget > 0
                  ? `${plannedThisWeek} de ${weeklyTarget} conteúdos`
                  : "Defina sua meta semanal"}
              </Text>
            </View>

            <Text style={styles.progressPercent}>{progress}%</Text>
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

          <View style={styles.statsRow}>
            <Metric
              icon="calendar-outline"
              value={String(plannedThisWeek)}
              label="Planejados"
            />

            <View style={styles.metricDivider} />

            <Metric
              icon="checkmark-circle-outline"
              value={String(completedThisWeek)}
              label="Concluídos"
              positive
            />

            <View style={styles.metricDivider} />

            <Metric
              icon="paper-plane-outline"
              value={String(publishedThisWeek)}
              label="Publicados"
            />

            <View style={styles.metricDivider} />

            <Metric
              icon="bookmark-outline"
              value={String(inspirationCount)}
              label="Inspirações"
            />
          </View>
        </TouchableOpacity>

        <View style={styles.sectionTop}>
          <Text style={styles.sectionTitle}>O que você quer fazer hoje?</Text>
          <Text style={styles.sectionSubtitle}>
            Escolha por onde continuar.
          </Text>
        </View>

        <View style={styles.quickGrid}>
          <QuickAction
            icon="add"
            title="Criar conteúdo"
            subtitle="Começar do zero"
            primary
            onPress={() => router.push("/conteudo/manual")}
          />

          <QuickAction
            icon="calendar-outline"
            title="Planejar"
            subtitle="Organizar a semana"
            onPress={() => router.push("/planejar")}
          />

          <QuickAction
            icon="images-outline"
            title="Explorar inspirações"
            subtitle="Ideias e referências"
            onPress={() => router.push("/inspiracoes")}
          />

          <QuickAction
            icon="albums-outline"
            title="Meus conteúdos"
            subtitle="Acompanhar produção"
            onPress={() => router.push("/conteudos")}
          />
        </View>

        <View style={styles.todayHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Seus conteúdos de hoje</Text>
            <Text style={styles.sectionSubtitle}>
              {todayContents.length === 0
                ? "Nada planejado para hoje."
                : todayContents.length === 1
                  ? "1 conteúdo para continuar."
                  : `${todayContents.length} conteúdos para continuar.`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.inlineAction}
            activeOpacity={0.8}
            onPress={() => router.push("/conteudos")}
          >
            <Text style={styles.inlineActionText}>Ver todos</Text>
            <Ionicons
              name="chevron-forward"
              size={15}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {todayContents.length === 0 ? (
          <View style={styles.emptyToday}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="calendar-clear-outline"
                size={22}
                color={colors.blue}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.emptyTitle}>Seu dia está livre</Text>
              <Text style={styles.emptyText}>
                Planeje uma ideia ou transforme uma referência em conteúdo.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.emptyAction}
              activeOpacity={0.8}
              onPress={() => router.push("/planejar")}
            >
              <Ionicons name="arrow-forward" size={17} color={colors.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.todayList}>
            {todayContents.slice(0, 3).map((content) => (
              <HomeContentCard key={content.id} content={content} />
            ))}
          </View>
        )}

        <TouchableOpacity
          style={styles.inspirationStrip}
          activeOpacity={0.88}
          onPress={() => router.push("/inspiracoes")}
        >
          <View style={styles.inspirationIcon}>
            <Ionicons name="bulb-outline" size={20} color={colors.blue} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.inspirationLabel}>SUA BIBLIOTECA</Text>
            <Text style={styles.inspirationTitle}>
              {inspirationCount === 0
                ? "Salve sua primeira referência"
                : `${inspirationCount} ${
                    inspirationCount === 1
                      ? "inspiração salva"
                      : "inspirações salvas"
                  }`}
            </Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={17}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({
  icon,
  value,
  label,
  positive = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  label: string;
  positive?: boolean;
}) {
  return (
    <View style={styles.metric}>
      <Ionicons
        name={icon}
        size={16}
        color={positive ? colors.sage : colors.textSecondary}
      />
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  icon,
  title,
  subtitle,
  primary = false,
  onPress,
}: QuickActionProps) {
  return (
    <TouchableOpacity
      style={[styles.quickAction, primary && styles.quickActionPrimary]}
      activeOpacity={0.86}
      onPress={onPress}
    >
      <View style={[styles.quickIcon, primary && styles.quickIconPrimary]}>
        <Ionicons
          name={icon}
          size={21}
          color={primary ? colors.terracotta : colors.text}
        />
      </View>

      <View style={styles.quickTextWrap}>
        <Text
          style={[styles.quickTitle, primary && styles.quickTitlePrimary]}
          numberOfLines={2}
        >
          {title}
        </Text>

        <Text
          style={[styles.quickSubtitle, primary && styles.quickSubtitlePrimary]}
          numberOfLines={2}
        >
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function HomeContentCard({ content }: { content: ContentItem }) {
  const meta = getStatusMeta(content.status);
  const thumbnail = content.reference?.thumbnailUrl ?? null;

  return (
    <TouchableOpacity
      style={styles.contentCard}
      activeOpacity={0.86}
      onPress={() => router.push(`/conteudo/${content.id}`)}
    >
      <View style={styles.contentThumbnail}>
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.contentThumbnailImage}
          />
        ) : (
          <Ionicons
            name="document-text-outline"
            size={23}
            color={colors.textSecondary}
          />
        )}
      </View>

      <View style={styles.contentInfo}>
        <View style={styles.contentMeta}>
          <View
            style={[
              styles.statusPill,
              {
                backgroundColor:
                  content.status === "pronto" || content.status === "publicado"
                    ? colors.sageLight
                    : colors.surfaceMuted,
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    content.status === "pronto" ||
                    content.status === "publicado"
                      ? colors.sage
                      : colors.textSecondary,
                },
              ]}
            >
              {meta.label}
            </Text>
          </View>

          {content.format ? (
            <Text style={styles.contentFormat}>{content.format}</Text>
          ) : null}
        </View>

        <Text style={styles.contentTitle} numberOfLines={2}>
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
    paddingBottom: 140,
  },

  topBar: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },

  brandContent: {
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: -0.9,
    fontFamily: fonts.extraBold,
    color: colors.text,
  },

  brandFlow: {
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: -0.9,
    fontFamily: fonts.extraBold,
    color: colors.terracotta,
  },

  profileButton: {
    width: 42,
    height: 42,
    overflow: "hidden",
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  profileImage: {
    width: "100%",
    height: "100%",
  },

  welcome: {
    paddingTop: 12,
    paddingBottom: 18,
  },

  greeting: {
    fontSize: 27,
    lineHeight: 34,
    letterSpacing: -0.75,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  welcomeText: {
    marginTop: 4,
    maxWidth: 330,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  progressCard: {
    padding: 17,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  progressHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },

  progressEyebrow: {
    fontSize: 11,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  progressTitle: {
    marginTop: 5,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  progressPercent: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
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

  statsRow: {
    marginTop: 17,
    flexDirection: "row",
    alignItems: "stretch",
  },

  metric: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },

  metricValue: {
    marginTop: 5,
    fontSize: 16,
    lineHeight: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  metricLabel: {
    marginTop: 1,
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  metricDivider: {
    width: 1,
    marginHorizontal: 5,
    backgroundColor: colors.divider,
  },

  sectionTop: {
    marginTop: 30,
    marginBottom: 13,
  },

  sectionTitle: {
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.45,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  quickAction: {
    width: "48%",
    minHeight: 116,
    padding: 14,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },

  quickActionPrimary: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },

  quickIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  quickIconPrimary: {
    backgroundColor: colors.surface,
  },

  quickTextWrap: {
    marginTop: 12,
  },

  quickTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  quickTitlePrimary: {
    color: colors.surface,
  },

  quickSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  quickSubtitlePrimary: {
    color: "rgba(255,255,255,0.82)",
  },

  todayHeader: {
    marginTop: 34,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  inlineAction: {
    minHeight: 34,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },

  inlineActionText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  todayList: {
    gap: 9,
  },

  contentCard: {
    minHeight: 82,
    padding: 10,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  contentThumbnail: {
    width: 58,
    height: 58,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  contentThumbnailImage: {
    width: "100%",
    height: "100%",
  },

  contentInfo: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    marginRight: 7,
  },

  contentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
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

  contentFormat: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  contentTitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  emptyToday: {
    minHeight: 96,
    padding: 15,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  emptyIcon: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 14,
    backgroundColor: colors.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  emptyText: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  emptyAction: {
    width: 34,
    height: 34,
    marginLeft: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  inspirationStrip: {
    marginTop: 20,
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  inspirationIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },

  inspirationLabel: {
    fontSize: 10,
    letterSpacing: 0.65,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  inspirationTitle: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
});
