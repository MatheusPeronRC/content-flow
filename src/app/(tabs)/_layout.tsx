import { Ionicons } from "@expo/vector-icons";

import { Tabs, router } from "expo-router";

import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
    colors,
    radius,
    shadows,
    spacing,
    typography,
} from "../../constants/theme";

import { getCreatorProfile } from "../../services/profileStorage";

export default function TabsLayout() {
  const [ready, setReady] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkProfile() {
      try {
        const profile = await getCreatorProfile();

        if (!mounted) {
          return;
        }

        if (!profile?.onboardingCompleted) {
          router.replace("/onboarding");

          return;
        }

        setReady(true);
      } catch (error) {
        console.error("Erro ao verificar onboarding:", error);

        if (mounted) {
          setReady(true);
        }
      }
    }

    checkProfile();

    return () => {
      mounted = false;
    };
  }, []);

  function handleFromInspiration() {
    setCreateModalVisible(false);

    setTimeout(() => {
      router.push("/conteudo/escolher-inspiracao");
    }, 150);
  }

  function handleFromScratch() {
    setCreateModalVisible(false);

    setTimeout(() => {
      router.push("/conteudo/manual");
    }, 150);
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="small" color={colors.terracotta} />
      </View>
    );
  }

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,

          tabBarActiveTintColor: colors.primary,

          tabBarInactiveTintColor: colors.textMuted,

          tabBarStyle: {
            height: 82,

            paddingTop: 7,
            paddingBottom: 8,

            backgroundColor: "#FAF7F1",

            borderTopWidth: 1,

            borderTopColor: colors.border,
          },

          tabBarLabelStyle: {
            fontSize: 10,

            fontWeight: "600",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Hoje",

            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="inspiracoes"
          options={{
            title: "Inspirações",

            tabBarIcon: ({ color, size }) => (
              <Ionicons name="bulb-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="criar"
          options={{
            title: "Criar",

            tabBarIcon: () => (
              <View style={styles.createTabButton}>
                <Ionicons name="add" size={30} color={colors.surface} />
              </View>
            ),

            tabBarLabel: () => <Text style={styles.createTabLabel}>Criar</Text>,
          }}
          listeners={{
            tabPress: (event) => {
              event.preventDefault();

              setCreateModalVisible(true);
            },
          }}
        />

        <Tabs.Screen
          name="planejar"
          options={{
            title: "Planejar",

            tabBarIcon: ({ color, size }) => (
              <Ionicons name="calendar-outline" size={size} color={color} />
            ),
          }}
        />

        <Tabs.Screen
          name="conteudos"
          options={{
            title: "Conteúdos",

            tabBarIcon: ({ color, size }) => (
              <Ionicons name="layers-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>

      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setCreateModalVisible(false)}
          />

          <SafeAreaView edges={["bottom"]} style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Criar conteúdo</Text>

                <Text style={styles.sheetSubtitle}>
                  Como você quer começar?
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCreateModalVisible(false)}
              >
                <Ionicons name="close" size={21} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.createOption}
              activeOpacity={0.8}
              onPress={handleFromInspiration}
            >
              <View
                style={[
                  styles.optionIcon,

                  {
                    backgroundColor: colors.roseLight,
                  },
                ]}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={23}
                  color={colors.rose}
                />
              </View>

              <View style={styles.optionContent}>
                <View style={styles.optionTitleRow}>
                  <Text style={styles.optionTitle}>
                    A partir de uma inspiração
                  </Text>

                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedText}>RECOMENDADO</Text>
                  </View>
                </View>

                <Text style={styles.optionDescription}>
                  Escolha algo que você salvou e transforme na sua própria
                  versão.
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color={colors.rose} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.createOption}
              activeOpacity={0.8}
              onPress={handleFromScratch}
            >
              <View
                style={[
                  styles.optionIcon,

                  {
                    backgroundColor: colors.amberLight,
                  },
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={23}
                  color={colors.amber}
                />
              </View>

              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Começar do zero</Text>

                <Text style={styles.optionDescription}>
                  Comece com uma ideia sua e construa o conteúdo manualmente.
                </Text>
              </View>

              <Ionicons name="chevron-forward" size={20} color={colors.amber} />
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.background,
  },

  createTabButton: {
    width: 56,
    height: 56,

    borderRadius: 28,

    marginTop: -16,

    backgroundColor: colors.terracotta,

    borderWidth: 5,

    borderColor: "#FAF7F1",

    alignItems: "center",
    justifyContent: "center",

    ...shadows.floating,
  },

  createTabLabel: {
    marginTop: 5,

    fontSize: 11,

    lineHeight: 14,

    fontWeight: "800",

    color: colors.terracotta,
  },

  modalBackdrop: {
    flex: 1,

    justifyContent: "flex-end",

    backgroundColor: "rgba(25, 32, 29, 0.35)",
  },

  sheet: {
    paddingHorizontal: spacing.lg,

    paddingTop: 12,

    paddingBottom: spacing.lg,

    backgroundColor: colors.background,

    borderTopLeftRadius: radius.xxl,

    borderTopRightRadius: radius.xxl,
  },

  sheetHandle: {
    width: 42,
    height: 4,

    alignSelf: "center",

    marginBottom: spacing.lg,

    borderRadius: radius.round,

    backgroundColor: colors.border,
  },

  sheetHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    marginBottom: spacing.lg,
  },

  sheetTitle: {
    fontSize: typography.heading,

    fontWeight: "700",

    color: colors.text,
  },

  sheetSubtitle: {
    marginTop: 4,

    fontSize: typography.body,

    color: colors.textSecondary,
  },

  closeButton: {
    width: 38,
    height: 38,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  createOption: {
    minHeight: 100,

    flexDirection: "row",

    alignItems: "center",

    padding: spacing.md,

    marginBottom: spacing.sm,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    backgroundColor: colors.surface,
  },

  optionIcon: {
    width: 50,
    height: 50,

    borderRadius: radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  optionContent: {
    flex: 1,

    paddingRight: spacing.sm,
  },

  optionTitleRow: {
    flexDirection: "row",

    alignItems: "center",

    flexWrap: "wrap",

    gap: 7,
  },

  optionTitle: {
    fontSize: typography.subheading,

    fontWeight: "700",

    color: colors.text,
  },

  optionDescription: {
    marginTop: 5,

    fontSize: typography.caption,

    lineHeight: 18,

    color: colors.textSecondary,
  },

  recommendedBadge: {
    paddingHorizontal: 7,

    paddingVertical: 3,

    borderRadius: radius.round,

    backgroundColor: colors.roseLight,
  },

  recommendedText: {
    fontSize: 7,

    fontWeight: "800",

    letterSpacing: 0.5,

    color: colors.rose,
  },
});
