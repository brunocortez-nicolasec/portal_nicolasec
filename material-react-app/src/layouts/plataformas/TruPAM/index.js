// src/layouts/plataformas/TruPAM/index.js

// @mui material components
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DefaultInfoCard from "examples/Cards/InfoCards/DefaultInfoCard";
import TimelineList from "examples/Timeline/TimelineList";
import TimelineItem from "examples/Timeline/TimelineItem";
import Card from "@mui/material/Card";

function TruPAM() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* --- Linha de Estatísticas --- */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <DefaultInfoCard
                icon="admin_panel_settings"
                title="Sessões Privilegiadas"
                description="Sessões de alto privilégio ativas."
                value="72"
                color="error"
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <DefaultInfoCard
                icon="password"
                title="Cofres de Senhas"
                description="Credenciais armazenadas com segurança."
                value="2,150"
                color="error"
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <DefaultInfoCard
                icon="lock_clock"
                title="Status do Cofre"
                description="Integridade e disponibilidade do cofre."
                value="Seguro"
                color="error"
              />
            </MDBox>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* --- Coluna Principal (Painel de Acesso) --- */}
          <Grid item xs={12} lg={8}>
            <Card>
              <MDBox variant="gradient" bgColor="error" color="white" coloredShadow="error" borderRadius="lg" display="flex" justifyContent="center" alignItems="center" width="4rem" height="4rem" mt={-3} mx={2}>
                <Icon fontSize="medium" color="inherit">shield</Icon>
              </MDBox>
              <MDBox p={3}>
                <MDTypography variant="h5" fontWeight="medium" textTransform="capitalize" mb={1}>
                  Plataforma TruPAM
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={3}>
                  Solução robusta para Gestão de Acessos Privilegiados (PAM), monitorando e protegendo as credenciais mais críticas da organização.
                </MDTypography>
                <MDButton variant="gradient" color="error" component="a" href="http://192.168.0.251/trupam" target="_blank" rel="noopener noreferrer">
                  Acessar Plataforma
                </MDButton>
              </MDBox>
            </Card>
          </Grid>

          {/* --- Coluna Lateral (Timeline) --- */}
          <Grid item xs={12} lg={4}>
            <TimelineList title="Atividades Recentes">
              <TimelineItem
                color="error"
                icon="visibility"
                title="Sessão gravada: 'admin_db' em 'srv-db01'"
                dateTime="Hoje, 14:30"
              />
              <TimelineItem
                color="info"
                icon="key"
                title="Senha do 'root@srv-web03' rotacionada"
                dateTime="Hoje, 09:15"
              />
              <TimelineItem
                color="warning"
                icon="report_problem"
                title="Múltiplas tentativas de acesso falhas para 'user_temp'"
                dateTime="Ontem, 18:00"
              />
              <TimelineItem
                color="primary"
                icon="person_add"
                title="Acesso privilegiado concedido a 'ana.souza'"
                dateTime="2 dias atrás"
                lastItem
              />
            </TimelineList>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default TruPAM;