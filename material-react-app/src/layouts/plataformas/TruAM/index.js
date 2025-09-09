// src/layouts/plataformas/TruAM/index.js

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

function TruAM() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              <MDBox variant="gradient" bgColor="success" color="white" coloredShadow="success" borderRadius="lg" display="flex" justifyContent="center" alignItems="center" width="4rem" height="4rem" mt={-3} mx={2}>
                <Icon fontSize="medium" color="inherit">hub</Icon>
              </MDBox>
              <MDBox pt={3} pb={2} px={2}>
                <MDTypography variant="h5" fontWeight="medium" textTransform="capitalize" mb={1}>TruAM</MDTypography>
                <MDTypography variant="body2" color="text" mb={3}>Solução de Gestão de Acessos a Aplicações (AM).</MDTypography>
                <MDButton variant="gradient" color="success" disabled>Em Breve</MDButton>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default TruAM;