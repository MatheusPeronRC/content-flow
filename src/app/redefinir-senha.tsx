import { Ionicons } from "@expo/vector-icons";
import * as ExpoLinking from "expo-linking";
import { router } from "expo-router";

import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { supabase } from "../lib/supabase";

import { colors, fonts, radius, shadows, spacing } from "../constants/theme";

export default function RedefinirSenhaScreen() {
  const [preparing, setPreparing] = useState(true);
  const [recoveryReady, setRecoveryReady] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let active = true;

    async function prepareFromUrl(url?: string | null) {
      try {
        if (!active) {
          return;
        }

        let recoveryEstablished = false;

        if (url) {
          const params = getAuthParams(url);

          if (params.error || params.error_code) {
            setRecoveryReady(false);
            return;
          }

          if (params.code) {
            const { error } = await supabase.auth.exchangeCodeForSession(
              params.code,
            );

            if (error) {
              throw error;
            }

            recoveryEstablished = true;
          } else if (params.access_token && params.refresh_token) {
            const { error } = await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });

            if (error) {
              throw error;
            }

            recoveryEstablished = true;
          }
        }

        if (!active) {
          return;
        }

        setRecoveryReady(recoveryEstablished);
      } catch (error) {
        console.error("Erro ao preparar recuperação de senha:", error);

        if (active) {
          setRecoveryReady(false);
        }
      } finally {
        if (active) {
          setPreparing(false);
        }
      }
    }

    void ExpoLinking.getInitialURL().then(prepareFromUrl);

    const subscription = ExpoLinking.addEventListener("url", ({ url }) => {
      setPreparing(true);
      void prepareFromUrl(url);
    });

    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || !session) {
        return;
      }

      if (event === "PASSWORD_RECOVERY") {
        setRecoveryReady(true);
        setPreparing(false);
      }
    });

    return () => {
      active = false;
      subscription.remove();
      authSubscription.unsubscribe();
    };
  }, []);

  const passwordsMatch = password === confirmPassword;

  const canSave =
    recoveryReady &&
    password.length >= 6 &&
    confirmPassword.length >= 6 &&
    passwordsMatch &&
    !saving;

  async function handleSave() {
    if (!canSave) {
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);

      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";

      if (message.includes("expired") || message.includes("invalid")) {
        setFeedback(
          "Esse link não é mais válido. Solicite uma nova recuperação de senha.",
        );
      } else if (
        message.includes("password") &&
        (message.includes("weak") ||
          message.includes("least") ||
          message.includes("characters"))
      ) {
        setFeedback("A nova senha não atende aos requisitos de segurança.");
      } else {
        setFeedback("Não foi possível atualizar a senha. Tente novamente.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (preparing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.terracotta} />

          <Text style={styles.loadingText}>Validando seu link...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (success) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={27} color={colors.surface} />
          </View>

          <Text style={styles.successTitle}>Senha atualizada.</Text>

          <Text style={styles.successText}>
            Sua nova senha já está ativa. Você pode continuar usando o
            ContentFlow normalmente.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.86}
            onPress={() => router.replace("/" as any)}
          >
            <Text style={styles.primaryButtonText}>Continuar</Text>

            <Ionicons name="arrow-forward" size={18} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!recoveryReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.invalidIcon}>
            <Ionicons
              name="link-outline"
              size={24}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.invalidTitle}>Link inválido ou expirado</Text>

          <Text style={styles.invalidText}>
            Solicite um novo link pela opção “Esqueci minha senha” na tela de
            login.
          </Text>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.84}
            onPress={() => router.replace("/login" as any)}
          >
            <Text style={styles.secondaryButtonText}>Voltar ao login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}>
              <Ionicons name="sparkles" size={20} color={colors.terracotta} />
            </View>

            <Text style={styles.brandName}>ContentFlow</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.lockIcon}>
              <Ionicons
                name="lock-closed-outline"
                size={22}
                color={colors.terracotta}
              />
            </View>

            <Text style={styles.title}>Crie uma nova senha</Text>

            <Text style={styles.description}>
              Escolha uma senha que você não utiliza em outros serviços.
            </Text>

            <PasswordInput
              label="NOVA SENHA"
              value={password}
              onChangeText={setPassword}
              visible={showPassword}
              onToggle={() => setShowPassword((current) => !current)}
              placeholder="Pelo menos 6 caracteres"
            />

            <PasswordInput
              label="CONFIRMAR NOVA SENHA"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((current) => !current)}
              placeholder="Digite a senha novamente"
            />

            {confirmPassword.length > 0 && !passwordsMatch ? (
              <View style={styles.feedback}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.terracotta}
                />

                <Text style={styles.feedbackText}>
                  As senhas não coincidem.
                </Text>
              </View>
            ) : feedback ? (
              <View style={styles.feedback}>
                <Ionicons
                  name="alert-circle-outline"
                  size={16}
                  color={colors.terracotta}
                />

                <Text style={styles.feedbackText}>{feedback}</Text>
              </View>
            ) : (
              <Text style={styles.passwordHint}>
                Use pelo menos 6 caracteres.
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !canSave && styles.primaryButtonDisabled,
              ]}
              activeOpacity={0.86}
              disabled={!canSave}
              onPress={handleSave}
            >
              {saving ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    Salvar nova senha
                  </Text>

                  <Ionicons name="checkmark" size={18} color={colors.surface} />
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function PasswordInput({
  label,
  value,
  onChangeText,
  visible,
  onToggle,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  placeholder: string;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={styles.inputShell}>
        <Ionicons
          name="lock-closed-outline"
          size={18}
          color={colors.textMuted}
        />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <TouchableOpacity
          style={styles.visibilityButton}
          activeOpacity={0.75}
          onPress={onToggle}
        >
          <Ionicons
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getAuthParams(url: string) {
  const params: Record<string, string> = {};

  const [, queryAndHash = ""] = url.split("?");

  const [query = "", hashFromQuery = ""] = queryAndHash.split("#");

  const directHash = url.includes("#") ? (url.split("#")[1] ?? "") : "";

  const combined = [query, hashFromQuery, directHash].filter(Boolean).join("&");

  combined
    .split("&")
    .filter(Boolean)
    .forEach((pair) => {
      const [rawKey, ...rawValue] = pair.split("=");

      if (!rawKey) {
        return;
      }

      params[decodeURIComponent(rawKey)] = decodeURIComponent(
        rawValue.join("=") ?? "",
      );
    });

  return params;
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },

  brandRow: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
  },

  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  brandName: {
    marginLeft: 10,
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  card: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },

  lockIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    marginTop: 15,
    fontSize: 23,
    lineHeight: 29,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  description: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  fieldGroup: {
    marginTop: 16,
  },

  fieldLabel: {
    marginBottom: 7,
    fontSize: 11,
    letterSpacing: 0.7,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  inputShell: {
    minHeight: 54,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  visibilityButton: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  feedback: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  feedbackText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.medium,
    color: colors.terracotta,
  },

  passwordHint: {
    marginTop: 9,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  primaryButton: {
    minHeight: 54,
    marginTop: 18,
    paddingHorizontal: 15,
    borderRadius: 15,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  primaryButtonDisabled: {
    opacity: 0.45,
  },

  primaryButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  center: {
    flex: 1,
    paddingHorizontal: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  successIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },

  successTitle: {
    marginTop: 15,
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
  },

  successText: {
    maxWidth: 330,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  invalidIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  invalidTitle: {
    marginTop: 15,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
  },

  invalidText: {
    maxWidth: 320,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  secondaryButton: {
    minHeight: 46,
    marginTop: 18,
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryButtonText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
});
