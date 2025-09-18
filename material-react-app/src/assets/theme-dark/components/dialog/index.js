/**
=========================================================
* Material Dashboard 2 React - v2.1.0
=========================================================
*/

// Material Dashboard 2 React base styles
import borders from "assets/theme-dark/base/borders";
import boxShadows from "assets/theme-dark/base/boxShadows";

// --- MUDANÇA: Imports adicionais para a cor de fundo ---
import colors from "assets/theme-dark/base/colors";
import linearGradient from "assets/theme-dark/functions/linearGradient";

const { borderRadius } = borders;
const { xxl } = boxShadows;

// --- MUDANÇA: Extrai as cores de gradiente ---
const { gradients } = colors;

const dialog = {
  styleOverrides: {
    paper: {
      borderRadius: borderRadius.lg,
      boxShadow: xxl,
      // --- MUDANÇA: Define o fundo escuro para o modal ---
      backgroundImage: linearGradient(gradients.dark.main, gradients.dark.state),
    },

    paperFullScreen: {
      borderRadius: 0,
    },
  },
};

export default dialog;