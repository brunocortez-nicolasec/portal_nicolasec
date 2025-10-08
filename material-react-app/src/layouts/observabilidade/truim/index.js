// src/layouts/observabilidade/truim/index.js

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// Componentes do Template
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import PieChart from "examples/Charts/PieChart";
// ======================= INÍCIO DA ALTERAÇÃO =======================
import DefaultDoughnutChart from "examples/Charts/DoughnutCharts/DefaultDoughnutChart";
// ======================== FIM DA ALTERAÇÃO =======================


// Hook do Contexto Principal
import { useMaterialUIController } from "context";

// Componentes para a Tabela de Detalhes
import MDBadge from "components/MDBadge";

const StatusCell = ({ status }) => {
  let color = "secondary";
  let text = status ? String(status).toUpperCase() : "-";
  if (text === "ATIVO") color = "success";
  if (text === "INATIVO") color = "error";
  if (text === "NÃO ENCONTRADO") color = "secondary";
  return <MDTypography variant="caption" color={color} fontWeight="medium">{text}</MDTypography>;
};


function DashboardTruIM() {
  const [controller] = useMaterialUIController();
  const { token } = controller;
  const plataforma = "TruIM";

  const [metrics, setMetrics] = useState(null);
  const [liveFeedData, setLiveFeedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!token) return;
      setIsLoading(true);

      const metricsPromise = axios.get(`/metrics/${plataforma}`, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      const liveFeedPromise = axios.get('/live-feed', {
        headers: { "Authorization": `Bearer ${token}` },
        params: { system: plataforma }
      });

      try {
        const [metricsResponse, liveFeedResponse] = await Promise.all([metricsPromise, liveFeedPromise]);
        setMetrics(metricsResponse.data);
        setLiveFeedData(liveFeedResponse.data);
      } catch (error) {
        console.error(`Erro ao buscar dados do dashboard para ${plataforma}:`, error);
        setMetrics(null);
        setLiveFeedData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [token]);

  const displayData = useMemo(() => {
    if (isLoading || !metrics || !liveFeedData) {
      return null;
    }

    const totalIdentidades = metrics.pills?.total || 0;
    const contasPrivilegiadas = metrics.kpisAdicionais?.acessoPrivilegiado || 0;
    const contasDormentes = metrics.kpisAdicionais?.contasDormentes || 0;
    const divergenciasCriticas = liveFeedData.filter(user => user.isCritical).length;

    const profileCounts = liveFeedData.reduce((acc, user) => {
      const perfil = user.perfil || 'N/A';
      acc[perfil] = (acc[perfil] || 0) + 1;
      return acc;
    }, {});

    const perfisDeAcessoChart = {
      labels: Object.keys(profileCounts),
      datasets: {
        label: "Perfis",
        backgroundColors: ["info", "primary", "warning", "secondary", "error", "light"],
        data: Object.values(profileCounts),
      },
    };

    const tiposDeUsuarioChart = {
      labels: metrics.tiposDeUsuario.map(t => t.tipo),
      datasets: { label: "Quantidade", data: metrics.tiposDeUsuario.map(t => t.total) },
    };

    const criticalDivergencesTable = {
      columns: [
        { Header: "Nome", accessor: "name" },
        { Header: "Email", accessor: "email" },
        { Header: "Perfil", accessor: "perfil" },
        { Header: "Status App", accessor: "app_status" },
        { Header: "Status RH", accessor: "rh_status" },
      ],
      rows: liveFeedData
        .filter(user => user.isCritical)
        .map(user => ({
          name: <MDTypography variant="caption" fontWeight="medium">{user.name}</MDTypography>,
          email: <MDTypography variant="caption">{user.email}</MDTypography>,
          perfil: <MDBadge badgeContent={user.perfil} color={user.perfil === 'Admin' ? 'error' : 'secondary'} size="xs" container />,
          app_status: <StatusCell status={user.app_status} />,
          rh_status: <StatusCell status={user.rh_status} />,
        })),
    };

    // ======================= INÍCIO DA ALTERAÇÃO =======================
    // Calcula dados para o Gráfico de Detalhamento de Divergências
    const divergenceBreakdown = metrics.divergencias;
    const divergenceLabels = {
        inativosRHAtivosApp: "Acesso Indevido",
        ativosNaoEncontradosRH: "Conta Órfã",
        cpf: "CPF",
        nome: "Nome",
        email: "E-mail",
        userType: "Tipo de Usuário"
    };
    const divergenceChartData = {
        labels: Object.keys(divergenceBreakdown)
            .filter(key => key !== 'acessoPrevistoNaoConcedido' && divergenceBreakdown[key] > 0)
            .map(key => divergenceLabels[key] || key),
        datasets: {
            label: "Quantidade",
            data: Object.keys(divergenceBreakdown)
                .filter(key => key !== 'acessoPrevistoNaoConcedido' && divergenceBreakdown[key] > 0)
                .map(key => divergenceBreakdown[key])
        },
    };

    // Calcula dados para o Gráfico de Análise de Contas Dormentes
    const totalAtivos = metrics.pills?.ativos || 0;
    const totalDormentes = metrics.kpisAdicionais?.contasDormentes || 0;
    const ativosRecentes = totalAtivos - totalDormentes;
    const dormancyChartData = {
        labels: ["Dormentes", "Ativas Recentes"],
        datasets: {
            label: "Contas",
            backgroundColors: ["warning", "success"],
            data: [totalDormentes, ativosRecentes > 0 ? ativosRecentes : 0],
        },
    };
    // ======================== FIM DA ALTERAÇÃO =======================

    return {
      totalIdentidades,
      contasPrivilegiadas,
      contasDormentes,
      divergenciasCriticas,
      perfisDeAcessoChart,
      tiposDeUsuarioChart,
      criticalDivergencesTable,
      divergenceChartData, // Adicionado ao retorno
      dormancyChartData,   // Adicionado ao retorno
    };
  }, [isLoading, metrics, liveFeedData]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        {isLoading || !displayData ? (
          <MDBox mt={5} display="flex" justifyContent="center">
            <MDTypography>Carregando dados do dashboard {plataforma}...</MDTypography>
          </MDBox>
        ) : (
          <>
            {/* Linha 1: KPIs Principais */}
            <MDBox mb={5}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard icon="people" title="Total de Identidades" count={displayData.totalIdentidades} /></Grid>
                <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="info" icon="admin_panel_settings" title="Contas Privilegiadas" count={displayData.contasPrivilegiadas} /></Grid>
                <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="warning" icon="hourglass_disabled" title="Contas Dormentes" count={displayData.contasDormentes} /></Grid>
                <Grid item xs={12} sm={6} lg={3}><ComplexStatisticsCard color="error" icon="warning" title="Divergências Críticas" count={displayData.divergenciasCriticas} /></Grid>
              </Grid>
            </MDBox>
            
            {/* Linha 2: Gráficos de Análise */}
            <MDBox mb={5}>
              <Grid container spacing={3}>
                <Grid item xs={12} lg={5}>
                  <PieChart 
                    icon={{ component: "badge" }} 
                    title="Perfis de Acesso" 
                    description="Distribuição de perfis de usuário no sistema."
                    chart={displayData.perfisDeAcessoChart}
                  />
                </Grid>
                <Grid item xs={12} lg={7}>
                  <ReportsBarChart
                    color="info"
                    title="Tipos de Usuário"
                    description="Distribuição de tipos de vínculo dos usuários."
                    chart={displayData.tiposDeUsuarioChart}
                  />
                </Grid>
              </Grid>
            </MDBox>

            {/* ======================= INÍCIO DA ALTERAÇÃO ======================= */}
            {/* Linha 3: Análises Adicionais */}
            <MDBox mb={5}>
              <Grid container spacing={3}>
                <Grid item xs={12} lg={7}>
                  <ReportsBarChart
                    color="warning"
                    title="Detalhamento de Divergências"
                    description="Distribuição dos tipos de inconsistências encontradas."
                    chart={displayData.divergenceChartData}
                  />
                </Grid>
                <Grid item xs={12} lg={5}>
                  <DefaultDoughnutChart
                    icon={{ color: "warning", component: "hourglass_disabled" }}
                    title="Análise de Contas Dormentes"
                    description="Proporção de contas ativas sem login recente."
                    chart={displayData.dormancyChartData}
                  />
                </Grid>
              </Grid>
            </MDBox>
            {/* ======================== FIM DA ALTERAÇÃO ======================= */}
            
            {/* Linha 4: Tabela de Ação */}
            <MDBox>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <MDBox pt={3} px={2}>
                      <MDTypography variant="h6" fontWeight="medium">Detalhes das Divergências Críticas</MDTypography>
                    </MDBox>
                    <MDBox p={2}>
                      <DataTable table={displayData.criticalDivergencesTable} isSorted={false} entriesPerPage={{ defaultValue: 5, entries: [5, 10, 25] }} showTotalEntries canSearch />
                    </MDBox>
                  </Card>
                </Grid>
              </Grid>
            </MDBox>
          </>
        )}
      </MDBox>
    </DashboardLayout>
  );
}

export default DashboardTruIM;