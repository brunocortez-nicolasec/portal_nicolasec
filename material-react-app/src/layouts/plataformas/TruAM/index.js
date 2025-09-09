// src/layouts/plataformas/TruAM/index.js

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

function TruAM() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* --- Linha de Estatísticas --- */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <DefaultInfoCard
                icon="apps"
                title="Aplicações Gerenciadas"
                description="Aplicações integradas ao portal."
                value="42"
                color="success"
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <DefaultInfoCard
                icon="login"
                title="Logins via SSO (24h)"
                description="Autenticações via Single Sign-On."
                value="8,920"
                color="success"
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <DefaultInfoCard
                icon="router"
                title="Status do Gateway"
                description="Disponibilidade do gateway de acesso."
                value="Online"
                color="success"
              />
            </MDBox>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* --- Coluna Principal (Painel de Acesso) --- */}
          <Grid item xs={12} lg={8}>
            <Card>
              <MDBox variant="gradient" bgColor="success" color="white" coloredShadow="success" borderRadius="lg" display="flex" justifyContent="center" alignItems="center" width="4rem" height="4rem" mt={-3} mx={2}>
                <Icon fontSize="medium" color="inherit">hub</Icon>
              </MDBox>
              <MDBox p={3}>
                <MDTypography variant="h5" fontWeight="medium" textTransform="capitalize" mb={1}>
                  Plataforma TruAM
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={3}>
                  Solução para Gestão de Acessos a Aplicações (AM), centralizando a autenticação e autorização com Single Sign-On.
                </MDTypography>
                <MDButton variant="gradient" color="success" disabled>
                  Em Breve
                </MDButton>
              </MDBox>
            </Card>
          </Grid>

          {/* --- Coluna Lateral (Timeline) --- */}
          <Grid item xs={12} lg={4}>
            <TimelineList title="Atividades Recentes">
               <TimelineItem
                color="success"
                icon="web"
                title="Nova aplicação 'Portal RH' integrada"
                dateTime="Hoje, 10:05"
              />
              <TimelineItem
                color="info"
                icon="person"
                title="Usuário 'bruno.cortez' acessou 'Sistema Financeiro'"
                dateTime="Hoje, 09:40"
              />
              <TimelineItem
                color="dark"
                icon="sync_alt"
                title="Políticas de acesso atualizadas"
                dateTime="Ontem, 11:30"
              />
              <TimelineItem
                color="primary"
                icon="group"
                title="Grupo 'Vendas' recebeu acesso ao CRM"
                dateTime="3 dias atrás"
                lastItem
              />
            </TimelineList>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default TruAM;