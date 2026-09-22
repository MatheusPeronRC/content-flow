export const colors = {
  // BASE
  background: "#F3F0E9",
  backgroundSoft: "#EEEAE2",

  surface: "#FFFDFC",
  surfaceSoft: "#F8F5EF",
  surfaceMuted: "#EAE5DC",

  // MARCA
  primary: "#25463E",
  primaryDark: "#19332D",
  primaryLight: "#DFE9E4",

  // ACENTOS
  terracotta: "#C9785C",
  terracottaLight: "#F3E2DB",

  amber: "#D6A34B",
  amberLight: "#F4E9D3",

  lavender: "#8E82B8",
  lavenderLight: "#E9E5F3",

  blue: "#6E94A6",
  blueLight: "#DFEAF0",

  rose: "#B97B87",
  roseLight: "#F0DFE3",

  sage: "#6F957E",
  sageLight: "#E1ECE4",

  // TEXTO
  text: "#202824",
  textSecondary: "#646C68",
  textMuted: "#969D99",

  // ESTRUTURA
  border: "#DED9CF",
  divider: "#E7E2D9",

  // ESTADOS
  success: "#5F8B70",
  warning: "#D09A45",
  danger: "#B95D58",

  // COMPATIBILIDADE
  reel: "#F3E2DB",
  carousel: "#F4E9D3",
  story: "#E9E5F3",
  inspiration: "#F0DFE3",
};

export const statusColors = {
  ideia: {
    background: colors.roseLight,
    foreground: colors.rose,
  },

  roteiro: {
    background: colors.amberLight,
    foreground: "#A87829",
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
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 28,
  xxl: 40,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32,
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

export const shadows = {
  card: {
    shadowColor: "#352F28",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },

  floating: {
    shadowColor: "#352F28",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.12,
    shadowRadius: 15,
    elevation: 6,
  },
};