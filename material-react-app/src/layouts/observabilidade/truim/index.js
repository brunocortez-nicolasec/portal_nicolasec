// src/layouts/observabilidade/truim/index.js

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

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

// --- DADOS SIMULADOS EXPANDIDOS PARA TruIM (IAM) ---
const mockData = {
  kpis: {
    totalIdentidades: "1,452",
    novosUsuariosHoje: 23,
    solicitacoesPendentes: 7,
    identidadesOrfas: 19,
  },
  cicloDeVida: {
    labels: ["Abr", "Mai", "Jun", "Jul", "Ago", "Set"],
    datasets: [
      { label: "Usuários Provisionados", data: [80, 81, 56, 55, 70, 90], color: "success" },
      { label: "Usuários Desprovisionados", data: [40, 19, 86, 27, 30, 22], color: "error" },
    ],
  },
  solicitacoesAcesso: {
    labels: ["Aprovadas Automaticamente", "Aprovadas Manualmente", "Negadas"],
    datasets: {
      label: "Solicitações",
      backgroundColors: ["success", "info", "error"],
      data: [342, 21, 15],
    },
  },
  revisoesAcesso: {
    columns: [
      { Header: "campanha de revisão", accessor: "campaign", width: "40%" },
      { Header: "progresso", accessor: "progress" },
      { Header: "prazo", accessor: "deadline", align: "center" },
      { Header: "status", accessor: "status", align: "center" },
    ],
    rows: [
      { campaign: "Revisão Trimestral - Salesforce", progress: "95%", deadline: "30/09/2025", status: <MDTypography variant="caption" color="success" fontWeight="medium">Em dia</MDTypography> },
      { campaign: "Revisão de Contas Inativas (Q3)", progress: "100%", deadline: "15/09/2025", status: <MDTypography variant="caption" color="text" fontWeight="medium">Concluída</MDTypography> },
      { campaign: "Revisão de Acessos Críticos - AD", progress: "45%", deadline: "28/09/2025", status: <MDTypography variant="caption" color="warning" fontWeight="medium">Em Risco</MDTypography> },
      { campaign: "Revisão de Acessos - SAP", progress: "15%", deadline: "10/10/2025", status: <MDTypography variant="caption" color="error" fontWeight="medium">Atrasada</MDTypography> },
    ],
  },
  violacoesPorApp: {
    labels: ["SAP", "Office 365", "Salesforce", "AWS", "Jira"],
    datasets: { label: "Violações", data: [12, 19, 3, 5, 8] },
  },
  atividadesRecentes: [
    {
      color: "error",
      icon: "key",
      title: "Concessão de acesso admin para 'user_temp'",
      dateTime: "24 Set 10:30",
    },
    {
      color: "warning",
      icon: "lock_open",
      title: "Múltiplas falhas de login (user.xpto)",
      dateTime: "24 Set 09:15",
    },
    {
      color: "info",
      icon: "public",
      title: "Login de local incomum (user.finance)",
      dateTime: "23 Set 18:00",
    },
     {
      color: "success",
      icon: "task_alt",
      title: "Campanha 'Revisão de Contas Inativas' concluída",
      dateTime: "23 Set 15:30",
    },
  ],
  impactoFinanceiro: {
    perdaHora: "R$ 1.68 Milhão",
    perdaDia: "R$ 40.2 Milhões",
    perdaMes: "R$ 1.2 Bilhão",
    mitigacao: "90%",
    perdaEvitadaAnual: "R$ 12.96 Bilhões",
  }
};
// --- FIM DOS DADOS SIMULADOS ---

function DashboardTruIM() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>

        {/* =================================================
            SEÇÃO 1: VISÃO GERAL DE IDENTIDADES (KPIs)
        ================================================== */}
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                icon="people"
                title="Total de Identidades"
                count={mockData.kpis.totalIdentidades}
                percentage={{ color: "success", amount: "+5%", label: "no último mês" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="info"
                icon="person_add"
                title="Novos Usuários (Hoje)"
                count={mockData.kpis.novosUsuariosHoje}
                percentage={{ color: "success", amount: "+2", label: "na última hora" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="warning"
                icon="pending_actions"
                title="Solicitações Pendentes"
                count={mockData.kpis.solicitacoesPendentes}
                percentage={{ color: "error", amount: "SLA", label: "em risco" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="secondary"
                icon="no_accounts"
                title="Contas Órfãs"
                count={mockData.kpis.identidadesOrfas}
                percentage={{ color: "success", amount: "-3", label: "desde ontem" }}
              />
            </Grid>
          </Grid>
        </MDBox>

        {/* =================================================
            SEÇÃO 2: ANÁLISE DE CICLO DE VIDA E ACESSOS
        ================================================== */}
        <MDBox mb={4.5}>
          <MDTypography variant="h5" mb={3}>Análise de Ciclo de Vida e Acessos</MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <DefaultLineChart
                icon={{ component: "leaderboard" }}
                title="Ciclo de Vida de Usuários"
                description="Fluxo de entradas e saídas de colaboradores."
                chart={mockData.cicloDeVida}
              />
            </Grid>
            <Grid item xs={12} lg={5}>
              <PieChart
                icon={{ component: "rule" }}
                title="Status das Solicitações de Acesso (Mês)"
                description={<><strong>{mockData.solicitacoesAcesso.datasets.data.reduce((a, b) => a + b, 0)}</strong> solicitações no total</>}
                chart={mockData.solicitacoesAcesso}
              />
            </Grid>
          </Grid>
        </MDBox>

        {/* =================================================
            SEÇÃO 3: GOVERNANÇA E CONFORMIDADE
        ================================================== */}
        <MDBox mb={4.5}>
          <MDTypography variant="h5" mb={2}>Governança e Conformidade</MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox pt={3} px={2}>
                  <MDTypography variant="h6">Campanhas de Revisão de Acesso</MDTypography>
                </MDBox>
                <MDBox p={2}>
                  <DataTable
                    table={mockData.revisoesAcesso}
                    isSorted={false} entriesPerPage={false} showTotalEntries={false} noEndBorder
                  />
                </MDBox>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
               <DefaultInfoCard
                  icon="policy"
                  title="Conformidade de Políticas"
                  description="Verificação automática de segregação de função (SoD)."
                  value="98.5% em conformidade"
                />
            </Grid>
            <Grid item xs={12} md={4}>
               <DefaultInfoCard
                  icon="gpp_bad"
                  title="Violações de SoD"
                  description="Conflitos de segregação de função detectados."
                  value="12 violações ativas"
                />
            </Grid>
            <Grid item xs={12} md={4}>
               <DefaultInfoCard
                  icon="timer"
                  title="Tempo Médio de Acesso"
                  description="Tempo médio para aprovar e provisionar um novo acesso."
                  value="2.5 horas"
                />
            </Grid>
          </Grid>
        </MDBox>
        
        {/* =================================================
            SEÇÃO 4: ATIVIDADES E ALERTAS DE RISCO
        ================================================== */}
        <MDBox mb={4.5}>
          <MDTypography variant="h5" mb={3}>Atividades e Alertas de Risco</MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
                <ReportsBarChart
                  color="info"
                  title="Top 5 Aplicações com Violações de Política"
                  description="Aplicações com maior número de violações de SoD nos últimos 30 dias."
                  chart={mockData.violacoesPorApp}
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
            SEÇÃO 5: ANÁLISE DE IMPACTO FINANCEIRO (ROI) - MODIFICADA
        ================================================== */}
        <MDBox mb={3}>
          <MDTypography variant="h5" mb={3}>Análise de Impacto Financeiro (ROI)</MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} lg={3}>
                <ComplexStatisticsCard
                  color="warning"
                  icon="timer"
                  title="Perda Potencial (1 Hora)"
                  count={mockData.impactoFinanceiro.perdaHora}
                  percentage={{ color: "error", amount: "criticidade", label: "altíssima" }}
                />
              </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="error"
                icon="calendar_today"
                title="Perda Potencial (1 Dia)"
                count={mockData.impactoFinanceiro.perdaDia}
                percentage={{ color: "error", amount: "paralisação", label: "de operações" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="dark"
                icon="event"
                title="Perda Potencial (30 dias)"
                count={mockData.impactoFinanceiro.perdaMes}
                percentage={{ color: "error", amount: "impacto", label: "estratégico" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="success"
                icon="shield"
                title="Mitigação com TruIM"
                count={mockData.impactoFinanceiro.mitigacao}
                percentage={{ color: "success", amount: "alta disponibilidade", label: "da plataforma" }}
              />
            </Grid>
          </Grid>

          {/* O card foi movido para um novo container para centralização e destaque */}
          <Grid container justifyContent="center" sx={{ mt: 3 }}>
            <Grid item xs={12} md={8} lg={7}>
              <DefaultInfoCard
                icon="payments"
                title="Valor Anual Evitado com TruIM"
                description="Nossa plataforma garante a continuidade do seu negócio, evitando perdas anuais bilionárias com falhas de acesso e identidade."
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

export default DashboardTruIM;