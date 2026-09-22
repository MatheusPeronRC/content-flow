export const colors = {
  // BASE
  background: "#F7F4EF",
  backgroundSoft: "#F2EEE8",

  surface: "#FFFDFC",
  surfaceSoft: "#FAF7F3",
  surfaceMuted: "#ECE7E1",

  // IDENTIDADE
  // O "primary" deixa de ser verde e vira carvão.
  primary: "#292624",
  primaryDark: "#1F1C1A",
  primaryLight: "#EEEAE5",

  // CRIAÇÃO / MARCA
  terracotta: "#E17455",
  terracottaLight: "#F9E6DF",

  // ROTEIRO
  amber: "#C99A45",
  amberLight: "#F7EDD8",

  // EDIÇÃO
  lavender: "#8E7FC2",
  lavenderLight: "#EDE9F7",

  // PLANEJAMENTO
  blue: "#79A5B8",
  blueLight: "#E6F0F4",

  // INSPIRAÇÃO
  rose: "#CF8295",
  roseLight: "#F6E6EB",

  // CONCLUSÃO
  sage: "#7B9E88",
  sageLight: "#E6EFE9",

  // TEXTO
  text: "#252220",
  textSecondary: "#726D67",
  textMuted: "#A29C95",

  // ESTRUTURA
  border: "#E5DED6",
  divider: "#EEE8E1",

  // FEEDBACK
  success: "#72947F",
  warning: "#C69440",
  danger: "#BD615A",

  // COMPATIBILIDADE
  reel: "#F9E6DF",
  carousel: "#F7EDD8",
  story: "#EDE9F7",
  inspiration: "#F6E6EB",

  // NOVOS TOKENS
  ink: "#292624",
  inkDark: "#1F1C1A",
  inkSoft: "#3B3734",

  brand: "#E17455",
  brandSoft: "#F9E6DF",

  cream: "#FBF7F1",
  white: "#FFFFFF",

  overlay: "rgba(32, 28, 26, 0.38)",
};

export const sectionColors = {
  brand: {
    background: colors.primaryLight,
    foreground: colors.primary,
  },

  create: {
    background: colors.terracottaLight,
    foreground: colors.terracotta,
  },

  inspiration: {
    background: colors.roseLight,
    foreground: colors.rose,
  },

  planning: {
    background: colors.blueLight,
    foreground: colors.blue,
  },

  script: {
    background: colors.amberLight,
    foreground: colors.amber,
  },

  editing: {
    background: colors.lavenderLight,
    foreground: colors.lavender,
  },

  success: {
    background: colors.sageLight,
    foreground: colors.sage,
  },
};

export const statusColors = {
  ideia: {
    background: colors.roseLight,
    foreground: colors.rose,
  },

  roteiro: {
    background: colors.amberLight,
    foreground: "#A8782C",
  },

  gravar: {
    background: colors.terracottaLight,
    foreground: colors.terracotta,
  },

  editar: {
    background: colors.lavenderLight,
    foreground: colors.lavender,
  },

  pronto: {
    background: colors.sageLight,
    foreground: colors.sage,
  },

  publicado: {
    background: colors.blueLight,
    foreground: colors.blue,
  },
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
  xxxl: 56,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 30,
  xxxl: 36,
  round: 999,
};

export const typography = {
  display: 34,
  title: 28,
  heading: 20,
  subheading: 16,
  body: 14,
  caption: 12,
  tiny: 10,
};

export const fontWeight = {
  regular: "400" as const,
  medium: "500" as const,
  semibold: "600" as const,
  bold: "700" as const,
  heavy: "800" as const,
};

export const lineHeight = {
  display: 41,
  title: 34,
  heading: 26,
  subheading: 22,
  body: 21,
  caption: 17,
  tiny: 14,
};

export const shadows = {
  soft: {
    shadowColor: "#29231F",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.035,
    shadowRadius: 6,
    elevation: 1,
  },

  card: {
    shadowColor: "#29231F",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },

  elevated: {
    shadowColor: "#29231F",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },

  floating: {
    shadowColor: "#29231F",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 7,
  },

  hero: {
    shadowColor: "#1F1C1A",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.1,
    shadowRadius: 22,
    elevation: 5,
  },
  
};

export const fonts = {
  regular: "Manrope_400Regular",

  medium: "Manrope_500Medium",

  semibold:
    "Manrope_600SemiBold",

  bold:
    "Manrope_700Bold",

  extraBold:
    "Manrope_800ExtraBold",
};