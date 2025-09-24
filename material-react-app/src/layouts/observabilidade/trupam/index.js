// src/layouts/observabilidade/trupam/index.js

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

// Componentes do Template
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

// Cards e Gráficos
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import DefaultInfoCard from "examples/Cards/InfoCards/DefaultInfoCard";
import DefaultLineChart from "examples/Charts/LineCharts/DefaultLineChart";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import PieChart from "examples/Charts/PieChart";
import TimelineList from "examples/Timeline/TimelineList";
import TimelineItem from "examples/Timeline/TimelineItem";

// --- DADOS SIMULADOS PARA TruPAM (PAM) ---
const mockData = {
  kpis: {
    contasPrivilegiadas: "890",
    sessoesAtivas: 42,
    segredosNoCofre: "12,450",
    alertasCriticos: 8,
  },
  sessoesPrivilegiadas: {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    datasets: [
      { label: "Servidores Core", data: [22, 25, 19, 30, 28, 35, 32], color: "error" },
      { label: "Bancos de Dados", data: [15, 20, 14, 25, 24, 29, 26], color: "info" },
      { label: "Aplicações Críticas", data: [10, 12, 8, 15, 20, 18, 15], color: "warning" },
    ],
  },
  conformidadeSenhas: {
    labels: ["Em conformidade", "Expiradas", "Fora do Padrão"],
    datasets: {
      label: "Credenciais",
      backgroundColors: ["success", "warning", "error"],
      data: [820, 55, 15],
    },
  },
  auditoriaSessoes: {
    columns: [
      { Header: "usuário", accessor: "user", width: "25%" },
      { Header: "sistema de destino", accessor: "target", width: "30%" },
      { Header: "pontuação de risco", accessor: "riskScore", align: "center" },
      { Header: "duração", accessor: "duration", align: "center" },
      { Header: "status", accessor: "status", align: "center" },
    ],
    rows: [
      { user: "admin.cloud", target: "AWS Console (Root)", riskScore: 95, duration: "45 min", status: <MDTypography variant="caption" color="error" fontWeight="medium">Revisão Urgente</MDTypography> },
      { user: "dba.master", target: "Oracle DB PROD-1", riskScore: 78, duration: "1h 12min", status: <MDTypography variant="caption" color="warning" fontWeight="medium">Revisão Pendente</MDTypography> },
      { user: "devops.deploy", target: "Servidor K8S-Master", riskScore: 45, duration: "22 min", status: <MDTypography variant="caption" color="success" fontWeight="medium">Revisada</MDTypography> },
      { user: "analista.noc", target: "Firewall Principal", riskScore: 65, duration: "5 min", status: <MDTypography variant="caption" color="warning" fontWeight="medium">Revisão Pendente</MDTypography> },
    ],
  },
  comandosDeRisco: {
    labels: ["rm -rf", "DELETE FROM", "useradd", "shutdown", "chmod 777"],
    datasets: { label: "Execuções", data: [8, 5, 12, 2, 15] },
  },
  atividadesRecentes: [
    {
      color: "error",
      icon: "code",
      title: "Comando 'rm -rf /' bloqueado na sessão de 'root@servidor-web-01'",
      dateTime: "24 Set 11:05",
    },
    {
      color: "warning",
      icon: "schedule",
      title: "Acesso privilegiado fora do horário (admin.legacy)",
      dateTime: "24 Set 02:30",
    },
    {
      color: "info",
      icon: "vpn_key",
      title: "Acesso de emergência (break-glass) utilizado para 'DB_FINANCEIRO'",
      dateTime: "23 Set 21:00",
    },
     {
      color: "success",
      icon: "sync_lock",
      title: "Rotação de senhas concluída para todos os servidores Windows",
      dateTime: "23 Set 18:00",
    },
  ],
  impactoFinanceiro: {
    custoMedioViolacao: "R$ 25 Milhões",
    perdaPotencialAcessoIndevido: "R$ 1.47 Bilhão",
    riscoReputacional: "Incalculável",
    mitigacao: "95%", 
    perdaEvitadaAnual: "R$ 1.4 Bilhão",
  }
};
// --- FIM DOS DADOS SIMULADOS ---

function DashboardTruPAM() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>

        {/* =================================================
            SEÇÃO 1: VISÃO GERAL DE ACESSOS PRIVILEGIADOS (KPIs)
        ================================================== */}
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                icon="admin_panel_settings"
                title="Contas Privilegiadas"
                count={mockData.kpis.contasPrivilegiadas}
                percentage={{ color: "success", amount: "+12", label: "no último mês" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="info"
                icon="cast_connected"
                title="Sessões Ativas"
                count={mockData.kpis.sessoesAtivas}
                percentage={{ color: "success", amount: "+5", label: "na última hora" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="secondary"
                icon="key"
                title="Segredos no Cofre"
                count={mockData.kpis.segredosNoCofre}
                percentage={{ color: "success", amount: "+200", label: "esta semana" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="error"
                icon="notification_important"
                title="Alertas de Risco Crítico"
                count={mockData.kpis.alertasCriticos}
                percentage={{ color: "error", amount: "+3", label: "nas últimas 24h" }}
              />
            </Grid>
          </Grid>
        </MDBox>

        {/* =================================================
            SEÇÃO 2: ANÁLISE DE SESSÕES E CONFORMIDADE
        ================================================== */}
        <MDBox mb={4.5}>
          <MDTypography variant="h5" mb={3}>Análise de Sessões e Conformidade</MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <DefaultLineChart
                icon={{ component: "insights" }}
                title="Tendência de Sessões Privilegiadas"
                description="Volume de sessões ativas nos últimos 7 dias."
                chart={mockData.sessoesPrivilegiadas}
              />
            </Grid>
            <Grid item xs={12} lg={5}>
              <PieChart
                icon={{ component: "task_alt" }}
                title="Conformidade de Rotação de Senhas"
                description={<><strong>{mockData.kpis.contasPrivilegiadas}</strong> contas monitoradas</>}
                chart={mockData.conformidadeSenhas}
              />
            </Grid>
          </Grid>
        </MDBox>

        {/* =================================================
            SEÇÃO 3: GOVERNANÇA E AUDITORIA
        ================================================== */}
        <MDBox mb={4.5}>
          <MDTypography variant="h5" mb={2}>Governança e Auditoria de Sessões</MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox pt={3} px={2}>
                  <MDTypography variant="h6">Gravações Recentes para Auditoria</MDTypography>
                </MDBox>
                <MDBox p={2}>
                  <DataTable
                    table={mockData.auditoriaSessoes}
                    isSorted={false} entriesPerPage={false} showTotalEntries={false} noEndBorder
                  />
                </MDBox>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
               <DefaultInfoCard
                  icon="fact_check"
                  title="Relatórios de Auditoria"
                  description="Relatórios gerados vs. relatórios pendentes de revisão."
                  value="152 Gerados / 12 Pendentes"
                />
            </Grid>
            <Grid item xs={12} md={4}>
               <DefaultInfoCard
                  icon="lock_clock"
                  title="Acessos de Emergência"
                  description="Usos do 'break-glass' nos últimos 30 dias."
                  value="3 utilizações"
                />
            </Grid>
            <Grid item xs={12} md={4}>
               <DefaultInfoCard
                  icon="policy"
                  title="Conformidade de Comandos"
                  description="Percentual de comandos executados dentro das políticas."
                  value="99.8% em conformidade"
                />
            </Grid>
          </Grid>
        </MDBox>
        
        {/* =================================================
            SEÇÃO 4: ANÁLISE DE AMEAÇAS E RISCOS
        ================================================== */}
        <MDBox mb={4.5}>
          <MDTypography variant="h5" mb={3}>Análise de Ameaças e Riscos</MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
                <ReportsBarChart
                  color="error"
                  title="Top 5 Comandos de Risco Executados"
                  description="Comandos perigosos mais frequentes em sessões privilegiadas."
                  chart={mockData.comandosDeRisco}
                />
            </Grid>
            <Grid item xs={12} lg={5}>
                <TimelineList title="Atividades Recentes de Risco">
                  {mockData.atividadesRecentes.map(item => (
                     <TimelineItem
                        key={item.title}
                        color={item.color}
                        icon={item.icon}
                        title={item.title}
                        dateTime={item.dateTime}
                      />
                  ))}
                </TimelineList>
            </Grid>
          </Grid>
        </MDBox>

        {/* =================================================
            SEÇÃO 5: ANÁLISE DE IMPACTO FINANCEIRO (ROI)
        ================================================== */}
        <MDBox mb={3}>
          <MDTypography variant="h5" mb={3}>Análise de Impacto Financeiro (ROI)</MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} lg={3}>
                <ComplexStatisticsCard
                  color="warning"
                  icon="security"
                  title="Custo Médio de Violação"
                  count={mockData.impactoFinanceiro.custoMedioViolacao}
                  percentage={{ color: "error", amount: "segundo a indústria", label: "" }}
                />
              </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="error"
                icon="business"
                title="Perda por Acesso Indevido"
                count={mockData.impactoFinanceiro.perdaPotencialAcessoIndevido}
                percentage={{ color: "error", amount: "em caso de incidente", label: "grave" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="dark"
                icon="public"
                title="Risco Reputacional"
                count={mockData.impactoFinanceiro.riscoReputacional}
                percentage={{ color: "warning", amount: "perda de confiança", label: "do mercado" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="success"
                icon="shield"
                title="Mitigação com TruPAM"
                count={mockData.impactoFinanceiro.mitigacao}
                percentage={{ color: "success", amount: "prevenção de ameaças", label: "avançadas" }}
              />
            </Grid>
          </Grid>

          <Grid container justifyContent="center" sx={{ mt: 3 }}>
            <Grid item xs={12} md={8} lg={7}>
              <DefaultInfoCard
                icon="payments"
                title="Valor Anual Evitado com TruPAM"
                description="Nossa plataforma protege seus ativos mais críticos, prevenindo perdas catastróficas por violação de acessos privilegiados."
                value={
                  <MDTypography variant="h2" fontWeight="medium" textGradient color="success">
                    {mockData.impactoFinanceiro.perdaEvitadaAnual}
                  </MDTypography>
                }
              />
            </Grid>
          </Grid>
        </MDBox>

      </MDBox>
    </DashboardLayout>
  );
}

export default DashboardTruPAM;