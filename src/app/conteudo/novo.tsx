import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radius, spacing, typography } from "../../constants/theme";
export default function NovoConteudoScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Novo conteúdo</Text>

        <View style={styles.headerSpace} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Como você quer começar?</Text>

        <Text style={styles.subtitle}>
          Transforme uma inspiração em conteúdo ou comece uma ideia do zero.
        </Text>

        <TouchableOpacity style={styles.optionCard}>
          <View style={styles.iconContainer}>
            <Ionicons name="bulb-outline" size={24} color={colors.primary} />
          </View>

          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Usar uma inspiração</Text>

            <Text style={styles.optionDescription}>
              Escolha algo que você salvou e crie sua própria versão.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push("/conteudo/criar")}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="create-outline" size={24} color={colors.primary} />
          </View>

          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>Começar do zero</Text>

            <Text style={styles.optionDescription}>
              Registre uma ideia e transforme em um conteúdo.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.text,
  },

  headerSpace: {
    width: 40,
  },

  content: {
    padding: spacing.lg,
  },

  title: {
    fontSize: typography.title,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.lg,
  },

  subtitle: {
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.text,
  },

  optionDescription: {
    fontSize: typography.caption,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
});
