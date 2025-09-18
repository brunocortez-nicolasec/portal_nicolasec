// src/assets/theme-dark/components/form/formHelperText.js

// Funções e estilos base do tema
import colors from "assets/theme-dark/base/colors";
import typography from "assets/theme-dark/base/typography";
import rgba from "assets/theme-dark/functions/rgba";

const { white } = colors;
const { size, fontWeightRegular } = typography;

const formHelperText = {
  styleOverrides: {
    root: {
      color: rgba(white.main, 0.65),
      fontWeight: fontWeightRegular,
      fontSize: size.sm,
      
      "&.Mui-error": {
        color: white.main, // Deixa o texto de erro um pouco mais forte
      },
    },
  },
};

export default formHelperText;