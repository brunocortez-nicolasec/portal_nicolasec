// material-react-app/src/components/MDPagination/index.js

import { forwardRef, createContext, useContext, useMemo } from "react";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles"; // <<< ALTERAÇÃO 1: Importar o hook de tema

import MDBox from "components/MDBox";
import MDPaginationItemRoot from "components/MDPagination/MDPaginationItemRoot";

const Context = createContext();

const MDPagination = forwardRef(
  ({ item, variant, color, size, active, children, ...rest }, ref) => {
    const context = useContext(Context);
    const paginationSize = context ? context.size : null;
    const theme = useTheme(); // <<< ALTERAÇÃO 2: Acessar o tema atual

    const value = useMemo(() => ({ variant, color, size }), [variant, color, size]);

    // <<< INÍCIO DA ALTERAÇÃO 3: Lógica de cor aprimorada >>>
    // Define a cor para os botões inativos. No modo escuro, usa 'white', caso contrário, 'secondary'.
    const inactiveColor = theme.palette.mode === 'dark' ? "white" : "secondary";
    // <<< FIM DA ALTERAÇÃO 3 >>>

    return (
      <Context.Provider value={value}>
        {item ? (
          <MDPaginationItemRoot
            {...rest}
            ref={ref}
            variant={active ? context.variant : "outlined"}
            // <<< ALTERAÇÃO 4: Aplica a cor inativa correta >>>
            color={active ? context.color : inactiveColor}
            iconOnly
            circular
            ownerState={{ variant, active, paginationSize }}
          >
            {children}
          </MDPaginationItemRoot>
        ) : (
          <MDBox
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            sx={{ listStyle: "none" }}
          >
            {children}
          </MDBox>
        )}
      </Context.Provider>
    );
  }
);

MDPagination.defaultProps = {
  item: false,
  variant: "gradient",
  color: "info",
  size: "medium",
  active: false,
};

MDPagination.propTypes = {
  item: PropTypes.bool,
  variant: PropTypes.oneOf(["gradient", "contained"]),
  color: PropTypes.oneOf([
    "white",
    "primary",
    "secondary",
    "info",
    "success",
    "warning",
    "error",
    "light",
    "dark",
  ]),
  size: PropTypes.oneOf(["small", "medium", "large"]),
  active: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

export default MDPagination;