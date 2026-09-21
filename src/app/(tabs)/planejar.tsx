import { StyleSheet, Text, View } from "react-native";

import { colors } from "../../constants/theme";

export default function PlanejarScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Planejar</Text>
      <Text style={styles.subtitle}>Seu planejamento semanal ficará aqui.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },

  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },

  subtitle: {
    marginTop: 8,
    color: colors.textSecondary,
  },
});
