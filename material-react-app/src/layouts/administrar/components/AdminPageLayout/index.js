// src/layouts/administrar/components/AdminPageLayout/index.js

import PropTypes from "prop-types";

// Componentes do Material Dashboard 2 React
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function AdminPageLayout({ title, buttonText, onButtonClick, children }) {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              {/* Cabeçalho do Card */}
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  {title}
                </MDTypography>
                {buttonText && (
                  <MDButton variant="gradient" color="dark" onClick={onButtonClick}>
                    <Icon sx={{ fontWeight: "bold" }}>add</Icon>
                    &nbsp; {buttonText}
                  </MDButton>
                )}
              </MDBox>

              {/* Corpo do Card (onde a tabela ou outro conteúdo irá) */}
              <MDBox p={3}>
                {children}
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

// Define props padrão
AdminPageLayout.defaultProps = {
  buttonText: "",
  onButtonClick: () => {},
};

// Define os tipos das props
AdminPageLayout.propTypes = {
  title: PropTypes.string.isRequired,
  buttonText: PropTypes.string,
  onButtonClick: PropTypes.func,
  children: PropTypes.node.isRequired,
};

export default AdminPageLayout;