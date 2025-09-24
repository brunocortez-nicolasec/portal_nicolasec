// src/layouts/observabilidade/truam/index.js

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

// --- DADOS SIMULADOS PARA TruAM (AM) ---
const mockData = {
  kpis: {
    appsIntegradas: "128",
    loginsSSOHoje: "34,812",
    adocaoMFA: "98.2%",
    acessosSuspeitos: "15",
  },
  volumeLogins: {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    datasets: [
      { label: "Logins com Sucesso", data: [32500, 34812, 33100, 35200, 36500, 15200, 12100], color: "success" },
      { label: "Logins com Falha", data: [150, 182, 210, 190, 250, 310, 80], color: "error" },
    ],
  },
  metodosMFA: {
    labels: ["Push Notification", "OTP (Aplicativo)", "Biometria", "SMS Token"],
    datasets: {
      label: "Autenticações",
      backgroundColors: ["success", "info", "dark", "warning"],
      data: [68, 22, 8, 2], // Em percentual
    },
  },
  statusProvisionamento: {
    columns: [
      { Header: "usuário", accessor: "user", width: "30%" },
      { Header: "aplicação", accessor: "app", width: "30%" },
      { Header: "status", accessor: "status", align: "center" },
      { Header: "data", accessor: "date", align: "center" },
    ],
    rows: [
      { user: "carla.silva@cliente.com", app: "Salesforce", status: <MDTypography variant="caption" color="success" fontWeight="medium">Provisionado</MDTypography>, date: "24/09/2025 10:30" },
      { user: "julio.lima@cliente.com", app: "Office 365", status: <MDTypography variant="caption" color="success" fontWeight="medium">Provisionado</MDTypography>, date: "24/09/2025 09:15" },
      { user: "temp.guest", app: "SAP ERP", status: <MDTypography variant="caption" color="error" fontWeight="medium">Falhou</MDTypography>, date: "23/09/2025 18:00" },
      { user: "bruno.alves@cliente.com", app: "Jira Cloud", status: <MDTypography variant="caption" color="warning" fontWeight="medium">Pendente</MDTypography>, date: "23/09/2025 15:30" },
    ],
  },
  appsComFalhas: {
    labels: ["SAP ERP", "VPN Legado", "Fluig", "Sharepoint", "App Interno X"],
    datasets: { label: "Falhas de Login", data: [45, 32, 28, 15, 9] },
  },
  atividadesRecentes: [
    {
      color: "error",
      icon: "block",
      title: "Múltiplas falhas de MFA para 'ana.ferreira'",
      dateTime: "24 Set 11:10",
    },
    {
      color: "warning",
      icon: "travel_explore",
      title: "Login de local impossível detectado para 'marcos.rocha'",
      dateTime: "24 Set 08:45",
    },
    {
      color: "info",
      icon: "policy",
      title: "Política de acesso condicional ativada: bloquear IPs de alto risco",
      dateTime: "23 Set 20:00",
    },
     {
      color: "success",
      icon: "app_registration",
      title: "Nova aplicação 'ServiceNow' integrada ao SSO com sucesso",
      dateTime: "23 Set 17:00",
    },
  ],
  impactoFinanceiro: {
    horasProdutividade: "21.6 mil horas/ano",
    reducaoHelpDesk: "R$ 500 mil/ano",
    custoAccountTakeover: "R$ 2.5 Milhões",
    mitigacao: "99.9%",
    ganhoAnual: "R$ 1.5 Milhão+",
  }
};
// --- FIM DOS DADOS SIMULADOS ---

function DashboardTruAM() {
  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>

        {/* =================================================
            SEÇÃO 1: VISÃO GERAL DE GESTÃO DE APLICAÇÕES (KPIs)
        ================================================== */}
        <MDBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                icon="apps"
                title="Aplicações Integradas"
                count={mockData.kpis.appsIntegradas}
                percentage={{ color: "success", amount: "+5", label: "neste trimestre" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="info"
                icon="login"
                title="Logins via SSO (Hoje)"
                count={mockData.kpis.loginsSSOHoje}
                percentage={{ color: "success", amount: "+3%", label: "que ontem" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="success"
                icon="phonelink_lock"
                title="Adoção de MFA"
                count={mockData.kpis.adocaoMFA}
                percentage={{ color: "success", amount: "alvo atingido", label: "" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="error"
                icon="report_problem"
                title="Acessos Suspeitos"
                count={mockData.kpis.acessosSuspeitos}
                percentage={{ color: "error", amount: "requerem atenção", label: "imediata" }}
              />
            </Grid>
          </Grid>
        </MDBox>

        {/* =================================================
            SEÇÃO 2: ANÁLISE DE AUTENTICAÇÃO E USO
        ================================================== */}
        <MDBox mb={4.5}>
          <MDTypography variant="h5" mb={3}>Análise de Autenticação e Uso</MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
              <DefaultLineChart
                icon={{ component: "assessment" }}
                title="Volume de Logins"
                description="Logins com sucesso vs. falhas nos últimos 7 dias."
                chart={mockData.volumeLogins}
              />
            </Grid>
            <Grid item xs={12} lg={5}>
              <PieChart
                icon={{ component: "fingerprint" }}
                title="Métodos de MFA Utilizados"
                description="Distribuição dos fatores de autenticação preferidos pelos usuários."
                chart={mockData.metodosMFA}
              />
            </Grid>
          </Grid>
        </MDBox>

        {/* =================================================
            SEÇÃO 3: GOVERNANÇA E PROVISIONAMENTO DE APPS
        ================================================== */}
        <MDBox mb={4.5}>
          <MDTypography variant="h5" mb={2}>Governança e Provisionamento de Aplicações</MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <MDBox pt={3} px={2}>
                  <MDTypography variant="h6">Logs de Provisionamento Recentes</MDTypography>
                </MDBox>
                <MDBox p={2}>
                  <DataTable
                    table={mockData.statusProvisionamento}
                    isSorted={false} entriesPerPage={false} showTotalEntries={false} noEndBorder
                  />
                </MDBox>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
               <DefaultInfoCard
                  icon="star"
                  title="Aplicação Mais Utilizada"
                  description="App com o maior volume de logins SSO no mês."
                  value="Office 365"
                />
            </Grid>
            <Grid item xs={12} md={4}>
               <DefaultInfoCard
                  icon="savings"
                  title="Otimização de Licenças"
                  description="Potencial de redução de custos baseado em apps não utilizados."
                  value="~ R$ 85 mil / mês"
                />
            </Grid>
            <Grid item xs={12} md={4}>
               <DefaultInfoCard
                  icon="speed"
                  title="Tempo Médio de Login"
                  description="Tempo economizado por usuário com o uso de SSO."
                  value="~ 45s por login"
                />
            </Grid>
          </Grid>
        </MDBox>
        
        {/* =================================================
            SEÇÃO 4: ANÁLISE DE RISCO E COMPORTAMENTO
        ================================================== */}
        <MDBox mb={4.5}>
          <MDTypography variant="h5" mb={3}>Análise de Risco e Comportamento</MDTypography>
          <Grid container spacing={3}>
            <Grid item xs={12} lg={7}>
                <ReportsBarChart
                  color="warning"
                  title="Top 5 Aplicações com Falhas de Login"
                  description="Aplicações que registram o maior número de tentativas de acesso mal sucedidas."
                  chart={mockData.appsComFalhas}
                />
            </Grid>
            <Grid item xs={12} lg={5}>
                <TimelineList title="Eventos de Segurança Recentes">
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
                  color="info"
                  icon="work_history"
                  title="Produtividade Ganha"
                  count={mockData.impactoFinanceiro.horasProdutividade}
                  percentage={{ color: "success", amount: "via SSO e autoatendimento", label: "" }}
                />
              </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="secondary"
                icon="support_agent"
                title="Redução de Custos"
                count={mockData.impactoFinanceiro.reducaoHelpDesk}
                percentage={{ color: "success", amount: "em tickets de senha", label: "" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="error"
                icon="person_off"
                title="Custo de Account Takeover"
                count={mockData.impactoFinanceiro.custoAccountTakeover}
                percentage={{ color: "error", amount: "risco mitigado", label: "com MFA" }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <ComplexStatisticsCard
                color="success"
                icon="verified_user"
                title="Mitigação com TruAM"
                count={mockData.impactoFinanceiro.mitigacao}
                percentage={{ color: "success", amount: "em prevenção a fraudes", label: "" }}
              />
            </Grid>
          </Grid>

          <Grid container justifyContent="center" sx={{ mt: 3 }}>
            <Grid item xs={12} md={8} lg={7}>
              <DefaultInfoCard
                icon="payments"
                title="Ganho Anual Estimado com TruAM"
                description="Somando ganhos de produtividade e redução de custos, o valor gerado pela plataforma para o negócio é de..."
                value={
                  <MDTypography variant="h2" fontWeight="medium" textGradient color="success">
                    {mockData.impactoFinanceiro.ganhoAnual}
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

export default DashboardTruAM;