export const colors = {
  bg: "#F3F5F9",
  panel: "#FFFFFF",
  panelAlt: "#F7F9FC",
  card: "#FFFFFF",
  text: "#0E1726",
  muted: "#5F6C83",
  white: "#FFFFFF",
  primary: "#4F8FF0",
  accent: "#F0B454",
  success: "#41C17D",
  warning: "#F5A453",
  danger: "#E16767",
  info: "#4F8FF0",
  line: "#E1E6F0",
  border: "#E1E6F0",
  chip: "#EDF1F7",
  highlight: "#DDE6F7",
  surface: "#F0F3F9",
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
};

export const shadow = {
  card: {
    shadowColor: "#0A1B33",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  soft: {
    shadowColor: "#0A1B33",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
};

export const font = {
  title: { fontSize: 26, fontWeight: "700", color: colors.text },
  subtitle: { fontSize: 12, fontWeight: "700", color: colors.muted, letterSpacing: 1.2 },
  section: { fontSize: 15, fontWeight: "700", color: colors.text },
  body: { fontSize: 14, color: colors.text },
  caption: { fontSize: 12, color: colors.muted },
  micro: { fontSize: 10, color: colors.muted, letterSpacing: 0.6 },
};
