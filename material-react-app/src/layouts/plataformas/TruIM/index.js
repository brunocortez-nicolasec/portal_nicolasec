// src/layouts/plataformas/TruIM/index.js - VERSÃO APRIMORADA

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

function TruIM() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {/* --- Linha de Estatísticas --- */}
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <DefaultInfoCard
                icon="person"
                title="Usuários Ativos"
                description="Usuários com sessão ativa na plataforma."
                value="1,240"
                color="info"
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <DefaultInfoCard
                icon="login"
                title="Conexões (24h)"
                description="Total de logins nas últimas 24 horas."
                value="3,500"
                color="info"
              />
            </MDBox>
          </Grid>
          <Grid item xs={12} md={6} lg={4}>
            <MDBox mb={1.5}>
              <DefaultInfoCard
                icon="cloud_done"
                title="Status do Serviço"
                description="Disponibilidade dos microsserviços."
                value="Online"
                color="info"
              />
            </MDBox>
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          {/* --- Coluna Principal (Painel de Acesso) --- */}
          <Grid item xs={12} lg={8}>
            <Card>
              <MDBox variant="gradient" bgColor="info" color="white" coloredShadow="info" borderRadius="lg" display="flex" justifyContent="center" alignItems="center" width="4rem" height="4rem" mt={-3} mx={2}>
                <Icon fontSize="medium" color="inherit">fact_check</Icon>
              </MDBox>
              <MDBox p={3}>
                <MDTypography variant="h5" fontWeight="medium" textTransform="capitalize" mb={1}>
                  Plataforma TruIM
                </MDTypography>
                <MDTypography variant="body2" color="text" mb={3}>
                  Solução completa para Gestão de Identidades e Acessos (IAM), garantindo que as pessoas certas tenham acesso aos recursos certos.
                </MDTypography>
                <MDButton variant="gradient" color="info" component="a" href="http://192.168.0.251:8080/truim" target="_blank" rel="noopener noreferrer">
                  Acessar Plataforma
                </MDButton>
              </MDBox>
            </Card>
          </Grid>

          {/* --- Coluna Lateral (Timeline) --- */}
          <Grid item xs={12} lg={4}>
            <TimelineList title="Últimas Atividades">
              <TimelineItem
                color="success"
                icon="login"
                title="Novo login de Admin"
                dateTime="Ontem, 22:13"
              />
              <TimelineItem
                color="info"
                icon="person_add"
                title="Novo usuário 'Joana Silva' criado"
                dateTime="2 dias atrás"
              />
              <TimelineItem
                color="warning"
                icon="sync"
                title="Sincronização com Active Directory"
                dateTime="3 dias atrás"
              />
              <TimelineItem
                color="primary"
                icon="key"
                title="Acesso de 'Carlos' ao recurso 'Financeiro' aprovado"
                dateTime="4 dias atrás"
                lastItem
              />
            </TimelineList>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default TruIM;