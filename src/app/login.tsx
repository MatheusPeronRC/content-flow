import { Ionicons } from "@expo/vector-icons";
import * as ExpoLinking from "expo-linking";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, radius, shadows, spacing } from "../constants/theme";
import { supabase } from "../lib/supabase";

type Mode = "login" | "signup";

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    type: "error" | "success";
    text: string;
  } | null>(null);

  const normalizedEmail = email.trim().toLowerCase();

  const passwordsMatch = mode === "login" || password === confirmPassword;

  const canSubmit =
    normalizedEmail.length > 0 &&
    password.length >= 6 &&
    (mode === "login" || (confirmPassword.length >= 6 && passwordsMatch)) &&
    !submitting;

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setFeedback(null);
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  }

  function openResetPassword() {
    setResetEmail(normalizedEmail);
    setResetFeedback(null);
    setResetSent(false);
    setResetModalVisible(true);
  }

  function closeResetPassword() {
    if (resetSubmitting) {
      return;
    }

    setResetModalVisible(false);
    setResetFeedback(null);
    setResetSent(false);
  }

  async function handleRequestPasswordReset() {
    const targetEmail = resetEmail.trim().toLowerCase();

    if (!targetEmail || !targetEmail.includes("@") || resetSubmitting) {
      setResetFeedback("Informe um e-mail válido.");
      return;
    }

    try {
      setResetSubmitting(true);
      setResetFeedback(null);

      const redirectTo = ExpoLinking.createURL("/redefinir-senha");

      const { error } = await supabase.auth.resetPasswordForEmail(targetEmail, {
        redirectTo,
      });

      if (error) {
        throw error;
      }

      setResetSent(true);
    } catch (error) {
      const message = error instanceof Error ? error.message.toLowerCase() : "";

      if (message.includes("rate limit")) {
        setResetFeedback(
          "Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente.",
        );
      } else {
        setResetFeedback(
          "Não foi possível enviar as instruções agora. Tente novamente.",
        );
      }
    } finally {
      setResetSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (!canSubmit) {
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setFeedback({
        type: "error",
        text: "As senhas não coincidem.",
      });

      return;
    }

    try {
      setSubmitting(true);
      setFeedback(null);

      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          throw error;
        }

        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
      });

      if (error) {
        throw error;
      }

      const identities = data.user?.identities;

      const existingAccountResponse =
        Array.isArray(identities) && identities.length === 0;

      if (existingAccountResponse) {
        setMode("login");
        setPassword("");
        setConfirmPassword("");
        setShowPassword(false);
        setShowConfirmPassword(false);

        setFeedback({
          type: "error",
          text: "Não foi possível criar uma nova conta com esse e-mail. Se você já tem cadastro, tente entrar.",
        });

        return;
      }

      if (data.session) {
        return;
      }

      setFeedback({
        type: "success",
        text: "Conta criada. Confira seu e-mail para confirmar o cadastro antes de entrar.",
      });

      setMode("login");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível continuar.";

      setFeedback({
        type: "error",
        text: translateAuthError(message),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const confirmPasswordHasError =
    mode === "signup" &&
    confirmPassword.length > 0 &&
    password !== confirmPassword;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.shell}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <Ionicons name="sparkles" size={20} color={colors.terracotta} />
              </View>

              <Text style={styles.brandName}>ContentFlow</Text>

              <View style={styles.betaPill}>
                <Text style={styles.betaText}>BETA</Text>
              </View>
            </View>

            <View style={styles.intro}>
              <Text style={styles.title}>
                Transforme referências em conteúdo publicado.
              </Text>

              <Text style={styles.description}>
                Salve ideias, adapte para o seu jeito e acompanhe tudo até a
                publicação.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.modeTabs}>
                {(["login", "signup"] as Mode[]).map((item) => {
                  const selected = mode === item;

                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.modeTab, selected && styles.modeTabActive]}
                      activeOpacity={0.8}
                      onPress={() => changeMode(item)}
                    >
                      <Text
                        style={[
                          styles.modeTabText,
                          selected && styles.modeTabTextActive,
                        ]}
                      >
                        {item === "login" ? "Entrar" : "Criar conta"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.formHeading}>
                <Text style={styles.formTitle}>
                  {mode === "login"
                    ? "Que bom ter você de volta."
                    : "Comece seu ContentFlow."}
                </Text>

                <Text style={styles.formDescription}>
                  {mode === "login"
                    ? "Entre com o e-mail usado na sua conta."
                    : "Você só precisa de um e-mail e uma senha para começar."}
                </Text>
              </View>

              <Field
                label="E-MAIL"
                icon="mail-outline"
                value={email}
                onChangeText={setEmail}
                placeholder="voce@email.com"
                keyboardType="email-address"
                autoComplete="email"
                textContentType="emailAddress"
              />

              <Field
                label="SENHA"
                icon="lock-closed-outline"
                value={password}
                onChangeText={setPassword}
                placeholder={
                  mode === "login" ? "Sua senha" : "Pelo menos 6 caracteres"
                }
                secureTextEntry={!showPassword}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
                textContentType={mode === "login" ? "password" : "newPassword"}
                rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                onRightPress={() => setShowPassword((current) => !current)}
                rightAccessibilityLabel={
                  showPassword ? "Ocultar senha" : "Mostrar senha"
                }
                onSubmitEditing={mode === "login" ? handleSubmit : undefined}
              />

              {mode === "login" ? (
                <TouchableOpacity
                  style={styles.forgotPasswordButton}
                  activeOpacity={0.8}
                  onPress={openResetPassword}
                >
                  <Text style={styles.forgotPasswordText}>
                    Esqueci minha senha
                  </Text>
                </TouchableOpacity>
              ) : null}

              {mode === "signup" ? (
                <>
                  <Field
                    label="CONFIRMAR SENHA"
                    icon="shield-checkmark-outline"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Digite a senha novamente"
                    secureTextEntry={!showConfirmPassword}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    rightIcon={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    onRightPress={() =>
                      setShowConfirmPassword((current) => !current)
                    }
                    rightAccessibilityLabel={
                      showConfirmPassword
                        ? "Ocultar confirmação de senha"
                        : "Mostrar confirmação de senha"
                    }
                    error={confirmPasswordHasError}
                    onSubmitEditing={handleSubmit}
                  />

                  {confirmPasswordHasError ? (
                    <View style={styles.inlineError}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={15}
                        color={colors.terracotta}
                      />

                      <Text style={styles.inlineErrorText}>
                        As senhas não coincidem.
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.passwordHelp}>
                      Use pelo menos 6 caracteres.
                    </Text>
                  )}
                </>
              ) : null}

              {feedback ? (
                <View
                  style={[
                    styles.feedback,
                    feedback.type === "success" && styles.feedbackSuccess,
                  ]}
                >
                  <Ionicons
                    name={
                      feedback.type === "success"
                        ? "checkmark-circle-outline"
                        : "alert-circle-outline"
                    }
                    size={18}
                    color={
                      feedback.type === "success"
                        ? colors.sage
                        : colors.terracotta
                    }
                  />

                  <Text style={styles.feedbackText}>{feedback.text}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  !canSubmit && styles.primaryButtonDisabled,
                ]}
                activeOpacity={0.86}
                disabled={!canSubmit}
                onPress={handleSubmit}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.surface} />
                ) : (
                  <>
                    <Text style={styles.primaryButtonText}>
                      {mode === "login" ? "Entrar" : "Criar minha conta"}
                    </Text>

                    <Ionicons
                      name="arrow-forward"
                      size={19}
                      color={colors.surface}
                    />
                  </>
                )}
              </TouchableOpacity>

              <Text style={styles.privacyText}>
                Seus conteúdos e referências ficam vinculados à sua conta.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeResetPassword}
      >
        <View style={styles.resetBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeResetPassword}
          />

          <View style={styles.resetCard}>
            <View style={styles.resetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.resetEyebrow}>RECUPERAR ACESSO</Text>

                <Text style={styles.resetTitle}>
                  {resetSent ? "Confira seu e-mail" : "Esqueceu sua senha?"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.resetClose}
                activeOpacity={0.8}
                onPress={closeResetPassword}
              >
                <Ionicons name="close" size={19} color={colors.text} />
              </TouchableOpacity>
            </View>

            {resetSent ? (
              <>
                <View style={styles.resetSuccessIcon}>
                  <Ionicons
                    name="mail-outline"
                    size={24}
                    color={colors.terracotta}
                  />
                </View>

                <Text style={styles.resetSuccessText}>
                  Se existir uma conta com esse e-mail, você receberá um link
                  para criar uma nova senha.
                </Text>

                <Text style={styles.resetSuccessHint}>
                  Confira também a caixa de spam. O link pode levar alguns
                  instantes para chegar.
                </Text>

                <TouchableOpacity
                  style={styles.resetPrimaryButton}
                  activeOpacity={0.85}
                  onPress={closeResetPassword}
                >
                  <Text style={styles.resetPrimaryButtonText}>Entendi</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.resetDescription}>
                  Informe o e-mail da sua conta. Enviaremos as instruções para
                  definir uma nova senha.
                </Text>

                <Text style={styles.resetLabel}>E-MAIL</Text>

                <View style={styles.resetInputShell}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={colors.textMuted}
                  />

                  <TextInput
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    autoComplete="email"
                    textContentType="emailAddress"
                    placeholder="voce@email.com"
                    placeholderTextColor={colors.textMuted}
                    style={styles.resetInput}
                    onSubmitEditing={handleRequestPasswordReset}
                  />
                </View>

                {resetFeedback ? (
                  <View style={styles.resetFeedback}>
                    <Ionicons
                      name="alert-circle-outline"
                      size={16}
                      color={colors.terracotta}
                    />

                    <Text style={styles.resetFeedbackText}>
                      {resetFeedback}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[
                    styles.resetPrimaryButton,
                    resetSubmitting && styles.resetPrimaryButtonDisabled,
                  ]}
                  activeOpacity={0.85}
                  disabled={resetSubmitting}
                  onPress={handleRequestPasswordReset}
                >
                  {resetSubmitting ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <>
                      <Text style={styles.resetPrimaryButtonText}>
                        Enviar instruções
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={18}
                        color={colors.surface}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type FieldProps = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;

  secureTextEntry?: boolean;
  keyboardType?: "email-address";

  autoComplete?: "email" | "current-password" | "new-password";

  textContentType?: "emailAddress" | "password" | "newPassword";

  onSubmitEditing?: () => void;

  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  rightAccessibilityLabel?: string;

  error?: boolean;
};

function Field({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoComplete,
  textContentType,
  onSubmitEditing,
  rightIcon,
  onRightPress,
  rightAccessibilityLabel,
  error,
}: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <View style={[styles.inputShell, error && styles.inputShellError]}>
        <Ionicons name={icon} size={18} color={colors.textMuted} />

        <TextInput
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          textContentType={textContentType}
          autoComplete={autoComplete}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          onSubmitEditing={onSubmitEditing}
        />

        {rightIcon && onRightPress ? (
          <TouchableOpacity
            style={styles.visibilityButton}
            activeOpacity={0.72}
            onPress={onRightPress}
            accessibilityRole="button"
            accessibilityLabel={rightAccessibilityLabel}
          >
            <Ionicons name={rightIcon} size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function translateAuthError(message: string) {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "E-mail ou senha incorretos.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Confirme seu e-mail antes de entrar.";
  }

  if (
    normalized.includes("user already registered") ||
    normalized.includes("already registered") ||
    normalized.includes("user_already_exists")
  ) {
    return "Não foi possível criar uma nova conta com esse e-mail. Se você já tem cadastro, tente entrar.";
  }

  if (normalized.includes("password")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }

  if (normalized.includes("email")) {
    return "Verifique o endereço de e-mail informado.";
  }

  return "Não foi possível continuar. Tente novamente.";
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
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: 28,
    justifyContent: "center",
  },

  shell: {
    width: "100%",
    maxWidth: 460,
    alignSelf: "center",
  },

  brandRow: {
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

  betaPill: {
    minHeight: 24,
    marginLeft: 8,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  betaText: {
    fontSize: 11,
    letterSpacing: 0.7,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  intro: {
    marginTop: 30,
    marginBottom: 24,
  },

  title: {
    maxWidth: 410,
    fontSize: 32,
    lineHeight: 39,
    letterSpacing: -1,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  description: {
    maxWidth: 390,
    marginTop: 10,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  card: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },

  modeTabs: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
  },

  modeTab: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  modeTabActive: {
    backgroundColor: colors.surface,
    ...shadows.soft,
  },

  modeTabText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textMuted,
  },

  modeTabTextActive: {
    color: colors.text,
  },

  formHeading: {
    marginTop: 22,
    marginBottom: 4,
  },

  formTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  formDescription: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  fieldGroup: {
    marginTop: 14,
  },

  fieldLabel: {
    marginBottom: 7,
    fontSize: 11,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  inputShell: {
    minHeight: 54,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  inputShellError: {
    borderColor: colors.terracotta,
  },

  input: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 15,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  visibilityButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.round,
  },

  forgotPasswordButton: {
    alignSelf: "flex-end",
    marginTop: 9,
    paddingVertical: 3,
  },

  forgotPasswordText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },

  resetBackdrop: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.overlay,
  },

  resetCard: {
    width: "100%",
    maxWidth: 390,
    padding: 18,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.elevated,
  },

  resetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  resetEyebrow: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  resetTitle: {
    marginTop: 3,
    fontSize: 21,
    lineHeight: 27,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  resetClose: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  resetDescription: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  resetLabel: {
    marginTop: 18,
    marginBottom: 7,
    fontSize: 11,
    letterSpacing: 0.7,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  resetInputShell: {
    minHeight: 52,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  resetInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  resetFeedback: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  resetFeedbackText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.medium,
    color: colors.terracotta,
  },

  resetPrimaryButton: {
    minHeight: 52,
    marginTop: 17,
    paddingHorizontal: 15,
    borderRadius: 14,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  resetPrimaryButtonDisabled: {
    opacity: 0.55,
  },

  resetPrimaryButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  resetSuccessIcon: {
    width: 54,
    height: 54,
    marginTop: 18,
    borderRadius: 17,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  resetSuccessText: {
    marginTop: 13,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  resetSuccessHint: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  passwordHelp: {
    marginTop: 7,
    marginLeft: 2,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  inlineError: {
    marginTop: 7,
    marginLeft: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  inlineErrorText: {
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.medium,
    color: colors.terracotta,
  },

  feedback: {
    marginTop: 16,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.terracottaLight,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  feedbackSuccess: {
    backgroundColor: colors.surfaceMuted,
  },

  feedbackText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  primaryButton: {
    minHeight: 56,
    marginTop: 18,
    paddingHorizontal: 17,
    borderRadius: 16,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...shadows.soft,
  },

  primaryButtonDisabled: {
    opacity: 0.45,
  },

  primaryButtonText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  privacyText: {
    marginTop: 13,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textMuted,
    textAlign: "center",
  },
});
