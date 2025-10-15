// material-react-app/src/examples/LayoutContainers/DashboardLayout/index.js

import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import PropTypes from "prop-types";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";

// Material Dashboard 2 React context
import { useMaterialUIController, setLayout } from "context";

import Footer from "examples/Footer";

function DashboardLayout({ children }) {
  const [controller, dispatch] = useMaterialUIController();
  const { miniSidenav } = controller;
  const { pathname } = useLocation();

  useEffect(() => {
    setLayout(dispatch, "dashboard");
  }, [pathname]);

  return (
    <MDBox
      sx={({ breakpoints, transitions, functions: { pxToRem } }) => ({
        position: "relative",
        // <<< INÍCIO DA ALTERAÇÃO 1: Estrutura de layout principal >>>
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh", // Ocupa a altura total da tela
        // O padding foi removido daqui
        // <<< FIM DA ALTERAÇÃO 1 >>>

        [breakpoints.up("xl")]: {
          marginLeft: miniSidenav ? pxToRem(120) : pxToRem(274),
          transition: transitions.create(["margin-left", "margin-right"], {
            easing: transitions.easing.easeInOut,
            duration: transitions.duration.standard,
          }),
        },
      })}
    >
      {/* <<< INÍCIO DA ALTERAÇÃO 2: Wrapper para o conteúdo da página >>> */}
      <MDBox sx={{ p: 3, flexGrow: 1 }}>
        {children}
      </MDBox>
      {/* <<< FIM DA ALTERAÇÃO 2 >>> */}

      {/* <<< INÍCIO DA ALTERAÇÃO 3: Wrapper para o footer com padding controlado >>> */}
      <MDBox px={3} pb={1}>
        <Footer />
      </MDBox>
      {/* <<< FIM DA ALTERAÇÃO 3 >>> */}
    </MDBox>
  );
}

// Typechecking props for the DashboardLayout
DashboardLayout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default DashboardLayout;