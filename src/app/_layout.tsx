import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />

      <Stack.Screen
        name="conteudo/novo"
        options={{
          presentation: "modal",
        }}
      />

      <Stack.Screen
        name="inspiracao/nova"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="conteudo/criar"
        options={{
          presentation: "modal",
        }}
      />
      <Stack.Screen
        name="conteudo/roteiro"
        options={{
          presentation: "modal",
        }}
      />
    </Stack>
  );
}
