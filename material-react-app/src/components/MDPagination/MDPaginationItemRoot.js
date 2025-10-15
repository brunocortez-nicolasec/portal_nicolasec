// material-react-app/src/components/MDPagination/MDPaginationItemRoot.js

// @mui material components
import { styled } from "@mui/material/styles";

// Material Dashboard 2 React components
import MDButton from "components/MDButton";

export default styled(MDButton)(({ theme, ownerState }) => {
  const { borders, functions, typography, palette } = theme;
  const { variant, paginationSize, active } = ownerState;

  const { borderColor } = borders;
  const { pxToRem } = functions;
  const { fontWeightRegular, size: fontSize } = typography;
  const { light, grey, text, action, mode } = palette;

  // width, height, minWidth and minHeight values
  let sizeValue = pxToRem(36);

  if (paginationSize === "small") {
    sizeValue = pxToRem(30);
  } else if (paginationSize === "large") {
    sizeValue = pxToRem(46);
  }

  return {
    borderColor,
    margin: `0 ${pxToRem(2)}`,
    pointerEvents: active ? "none" : "auto",
    fontWeight: fontWeightRegular,
    fontSize: fontSize.sm,
    width: sizeValue,
    minWidth: sizeValue,
    height: sizeValue,
    minHeight: sizeValue,

    // <<< INÍCIO DA ALTERAÇÃO FINAL >>>
    // Aplica estilos específicos apenas para o modo escuro e para itens não ativos
    ...(mode === "dark" && !active && {
      color: text.secondary, // Cor do texto inativo mais clara
      borderColor: grey[700], // Cor da borda inativa mais clara
    }),

    "&:hover, &:focus, &:active": {
      transform: "none",
      boxShadow: (variant !== "gradient" || variant !== "contained") && "none !important",
      opacity: "1 !important",
    },

    "&:hover": {
      // Define um fundo de hover que funciona em ambos os modos
      backgroundColor: action.hover, 
      borderColor, // Mantém a borda padrão no hover (ou a do modo escuro, se aplicável)
      // No modo escuro, força o texto a ficar branco no hover para garantir a legibilidade
      ...(mode === "dark" && {
        color: text.primary,
      }),
    },
    // <<< FIM DA ALTERAÇÃO FINAL >>>
  };
});