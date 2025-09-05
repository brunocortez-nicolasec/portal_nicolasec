// material-react-app/src/layouts/plataformas/index.js

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon"; // Garanta que o Icon está importado

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";

function Plataformas() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          {/* Card para a plataforma TruIM */}
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              {/* Ícone flutuante */}
              <MDBox
                variant="gradient"
                bgColor="info"
                color="white"
                coloredShadow="info"
                borderRadius="lg"
                display="flex"
                justifyContent="center"
                alignItems="center"
                width="4rem"
                height="4rem"
                mt={-3}
                mx={2}
              >
                <Icon fontSize="medium" color="inherit">
                  account_circle
                </Icon>
              </MDBox>
              {/* Conteúdo do Card */}
              <MDBox pt={3} pb={2} px={2}>
                <MDTypography variant="h5" fontWeight="medium" textTransform="capitalize" mb={1}>
                  TruIM
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={3}>
                  Solução de Gestão de Identidades e Acessos (IAM).
                </MDTypography>
                <MDButton
                  variant="gradient"
                  color="info"
                  component="a"
                  href="http://192.168.0.251:8080/truim"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Acessar Plataforma
                </MDButton>
              </MDBox>
            </Card>
          </Grid>

          {/* Card para a plataforma TruPAM */}
          <Grid item xs={12} md={6} lg={4}>
            <Card>
              {/* Ícone flutuante */}
              <MDBox
                variant="gradient"
                bgColor="error"
                color="white"
                coloredShadow="error"
                borderRadius="lg"
                display="flex"
                justifyContent="center"
                alignItems="center"
                width="4rem"
                height="4rem"
                mt={-3}
                mx={2}
              >
                <Icon fontSize="medium" color="inherit">
                  shield
                </Icon>
              </MDBox>
              {/* Conteúdo do Card */}
              <MDBox pt={3} pb={2} px={2}>
                <MDTypography variant="h5" fontWeight="medium" textTransform="capitalize" mb={1}>
                  TruPAM
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={3}>
                  Solução de Gestão de Acessos Privilegiados (PAM).
                </MDTypography>
                <MDButton
                  variant="gradient"
                  color="error"
                  component="a"
                  href="http://192.168.0.251/trupam"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Acessar Plataforma
                </MDButton>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default Plataformas;