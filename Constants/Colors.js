// Same identity as the Scale Conversion Tool, with a few extra tokens this app
// needs (cards, muted labels, the +/-1mm chip).

export const Colors = {
  primary: "#4A90C4",
  warning: "#ff0000",

  dark: {
    text: "#ffffff",
    title: "#ffffff",
    muted: "#9DB4CC",
    background: "#1A2E44",
    navBackground: "#1A2E44",
    card: "#223B57",
    cardBorder: "#2E5075",
    imageTile: "#E9EDF1",
    chip: "#2E5075",
    iconColor: "#6b7e91",
    iconColorFocused: "#ffffff",
    uiBackground: "#12212F",
  },
  light: {
    text: "#000000",
    title: "#000000",
    muted: "#5A6B7C",
    background: "#ffffff",
    navBackground: "#ffffff",
    card: "#F2F6FA",
    cardBorder: "#D8E3ED",
    imageTile: "#E9EDF1",
    chip: "#DCE7F2",
    iconColor: "#99b8d2",
    iconColorFocused: "#4A90C4",
    uiBackground: "#EAF1F7",
  },
}

export const useTheme = (scheme) => Colors[scheme] ?? Colors.light
