// src/layouts/observabilidade/geral/index.js

import { useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import { Box } from "@mui/material";

// Componentes do Template
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import VerticalBarChart from "examples/Charts/BarCharts/VerticalBarChart";
import DefaultInfoCard from "examples/Cards/InfoCards/DefaultInfoCard";
import PieChart from "examples/Charts/PieChart";
import { useDashboard } from "context/DashboardContext";
import colors from "assets/theme/base/colors";

// --- COMPONENTES CUSTOMIZADOS ---
function PillKpi({ label, count, color }) {
    return ( <MDBox p={1} display="flex" alignItems="center" sx={{border: "1px solid #eee", borderRadius: "12px"}}> <Box sx={{backgroundColor: colors[color].main, width: "10px", height: "10px", borderRadius:"50%", marginRight: "8px"}} /> <MDTypography variant="button" color="secondary" sx={{mr: 0.5}}>{label}:</MDTypography> <MDTypography variant="h5" fontWeight="bold">{count}</MDTypography> </MDBox> );
}
function DetailList({ title, items }) {
    return ( <Card sx={{height: "100%", p: 2, boxShadow: "none", border: "1px solid #eee"}}> <MDTypography variant="overline" color="secondary" fontWeight="medium">{title}</MDTypography> {items.map(item => ( <MDBox key={item.label} display="flex" justifyContent="space-between" alignItems="center" pt={1.5}> <MDTypography variant="button" fontWeight="regular" color="text">{item.label}</MDTypography> <MDTypography variant="h6" fontWeight="bold" color={item.color || "dark"}>{item.value}</MDTypography> </MDBox> ))} </Card> );
}
function MiniMetricCard({ title, count, color = "dark" }) {
    return ( <Card sx={{p: 2, textAlign: "center", height: "100%", boxShadow: "none", border: "1px solid #eee"}}> <MDTypography variant="button" color="text" fontWeight="regular" sx={{whiteSpace: "normal"}}>{title}</MDTypography> <MDTypography variant="h2" fontWeight="bold" color={color} mt={1}>{count}</MDTypography> </Card> )
}
function KpiStack({ title, items, defaultColor = "dark" }) {
    return ( <Card sx={{height: "100%"}}> <MDBox pt={2} px={2}> <MDTypography variant="button" fontWeight="bold" textTransform="uppercase" color="secondary">{title}</MDTypography> </MDBox> <MDBox p={2} pt={0}> {items.map(item => ( <MDBox key={item.label} mt={2.5} lineHeight={1}> <MDTypography variant="caption" color="text" fontWeight="light" textTransform="uppercase">{item.label}</MDTypography> <MDTypography variant="h3" fontWeight="bold" color={item.color || defaultColor}>{item.value}</MDTypography> </MDBox> ))} </MDBox> </Card> );
}

function VisaoGeral() {
  const { truIMData, truPAMData, truAMData } = useDashboard();
  const [searchTerm, setSearchTerm] = useState("");

  const displayData = useMemo(() => {
    const imData = truIMData || [];
    const pamData = truPAMData || [];
    const amData = truAMData || [];

    const custoPorDivergencia = 25000;
    const inativosRHAtivosAppCount = imData.filter(r => r.status_rh === 'inativo' && r.status_app === 'ativo').length;
    const prejuizoCalculado = inativosRHAtivosAppCount * custoPorDivergencia;
    const valorMitigado = (prejuizoCalculado * 0.95);
    const prejuizoPotencial = prejuizoCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const prejuizoMitigado = valorMitigado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


    const imDisplay = {
      pills: { total: imData.length, ativos: imData.filter(r => r.status_app === 'ativo').length, inativos: imData.filter(r => r.status_app === 'inativo').length, desconhecido: imData.filter(r => r.status_app === 'desconhecido').length, },
      tipos: imData.reduce((acc, r) => { (acc[r.tipo_usuario] = (acc[r.tipo_usuario] || 0) + 1); return acc; }, {}),
      divergencias: {
        inativosRHAtivosApp: inativosRHAtivosAppCount,
        ativosNaoEncontradosRH: imData.filter(r => !r.status_rh && r.status_app === 'ativo').length,
        login: imData.filter(r => r.login_esperado && r.login_atual && r.login_esperado !== r.login_atual).length,
        acessoPrevistoNaoConcedido: imData.filter(r => r.acesso_previsto === 'true' && r.status_app !== 'ativo').length,
        cpf: imData.filter(r => r.cpf_rh && r.cpf_app && r.cpf_rh !== r.cpf_app).length,
        email: imData.filter(r => r.email_rh && r.email_app && r.email_rh !== r.email_app).length,
      },
      // --- MODIFICAÇÃO: Gráfico agora será sobre os Tipos de Usuários ---
      tiposChart: (() => {
        const tipos = imData.reduce((acc, r) => {
            if (r.tipo_usuario) acc[r.tipo_usuario] = (acc[r.tipo_usuario] || 0) + 1;
            return acc;
        }, {});
        return {
            labels: Object.keys(tipos),
            datasets: { 
                label: "Tipos",
                backgroundColors: ["info", "primary", "warning", "secondary", "error"], 
                data: Object.values(tipos)
            },
        };
      })()
    };
    
    const pamDisplay = {
        riscos: { acessosIndevidos: pamData.filter(r => r.acesso_indevido === 'sim').length, }
    };
    
    const amDisplay = {
        riscos: { falhasCriticas: amData.filter(r => r.status_login === 'falha' && r.evento_severidade === 'error').length, }
    };

    const riscosConsolidadosChart = {
        labels: ["Acessos Indevidos (PAM)", "RH Inativo/App Ativo (IM)", "Divergência de Login (IM)"],
        datasets: [{
            label: "Total de Eventos de Risco",
            color: "error",
            data: [
                pamDisplay.riscos.acessosIndevidos,
                imDisplay.divergencias.inativosRHAtivosApp,
                imDisplay.divergencias.login,
            ]
        }]
    };
    
    let allEvents = [];
    if(imData) allEvents.push(...imData.filter(r => r.evento_descricao).map(r => ({ data: new Date(r.evento_timestamp), usuario: r.id_usuario, plataforma: 'TruIM', evento: r.evento_descricao })));
    if(pamData) allEvents.push(...pamData.filter(r => r.evento_recente_descricao).map(r => ({ data: new Date(r.evento_recente_timestamp), usuario: r.usuario_privilegiado, plataforma: 'TruPAM', evento: r.evento_recente_descricao })));
    if(amData) allEvents.push(...amData.filter(r => r.evento_descricao).map(r => ({ data: new Date(r.evento_timestamp), usuario: r.usuario, plataforma: 'TruAM', evento: r.evento_descricao })));
    if (searchTerm) {
        allEvents = allEvents.filter(e => e.usuario && e.usuario.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    const unifiedFeed = {
      columns: [ { Header: "Usuário", accessor: "usuario" }, { Header: "Plataforma", accessor: "plataforma" }, { Header: "Evento", accessor: "evento", width: "50%" }, { Header: "Data/Hora", accessor: "data" } ],
      rows: allEvents.sort((a, b) => b.data - a.data).slice(0, 50).map(e => ({ ...e, data: e.data.toLocaleString("pt-BR") }))
    };

    return { imDisplay, pamDisplay, amDisplay, unifiedFeed, riscosConsolidadosChart, prejuizoPotencial, prejuizoMitigado };
  }, [truIMData, truPAMData, truAMData, searchTerm]);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {/* --- MODIFICAÇÃO: Card principal sem abas --- */}
          <Grid item xs={12} lg={9}>
            <Card sx={{height: "100%"}}>
                <MDBox p={2}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}><Grid container spacing={1} justifyContent="space-around"><Grid item><PillKpi label="Usuários" count={displayData.imDisplay.pills.total} color="info"/></Grid><Grid item><PillKpi label="Ativos" count={displayData.imDisplay.pills.ativos} color="success" /></Grid><Grid item><PillKpi label="Inativos" count={displayData.imDisplay.pills.inativos} color="secondary" /></Grid><Grid item><PillKpi label="Desconhecido" count={displayData.imDisplay.pills.desconhecido} color="error" /></Grid></Grid></Grid>
                        
                        {/* Coluna da esquerda */}
                        <Grid item xs={4}>
                            <DetailList title="Tipos de Usuários" items={Object.entries(displayData.imDisplay.tipos).map(([key, val])=>({label:key, value:val}))} />
                        </Grid>
                        
                        <Grid item xs={4}>
                           <PieChart
                                chart={displayData.imDisplay.tiposChart}
                            />
                        </Grid>
                        <Grid item xs={4}>
                            <Grid container spacing={2} direction="column">
                                <Grid item><MiniMetricCard title="Ativos no App / Inativos no RH" count={displayData.imDisplay.divergencias.inativosRHAtivosApp} color="error"/></Grid>
                                <Grid item><MiniMetricCard title="Ativos Não Encontrados no RH" count={displayData.imDisplay.divergencias.ativosNaoEncontradosRH} color="warning"/></Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </MDBox>
            </Card>
          </Grid>
          
          <Grid item xs={12} lg={3}>
            <Grid container spacing={3} direction="column">
              <Grid item>
                <DefaultInfoCard
                    icon="money_off"
                    color="error"
                    title="Prejuízo Potencial (Mensal)"
                    description="Custo com riscos devido a contas 'RH Inativo / App Ativo'."
                    value={displayData.prejuizoPotencial}
                  />
              </Grid>
              <Grid item>
                 <DefaultInfoCard
                    icon="savings"
                    color="success"
                    title="Valor Mitigado com TruIM"
                    description="Redução de 95% do prejuízo potencial com governança."
                    value={displayData.prejuizoMitigado}
                  />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
        
        <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2}><KpiStack title="Crítico" defaultColor="error" items={[
                {label: "Acessos Indevidos (PAM)", value: displayData.pamDisplay.riscos.acessosIndevidos ?? 'N/A'},
                {label: "Divergência de Login (IM)", value: displayData.imDisplay.divergencias.login ?? 'N/A'},
                {label: "Divergência de CPF (IM)", value: displayData.imDisplay.divergencias.cpf ?? 'N/A'}
            ]} /></Grid>
            <Grid item xs={12} sm={6} md={2}><KpiStack title="Divergências" defaultColor="warning" items={[
                {label: "RH Inativo / App Ativo (IM)", value: displayData.imDisplay.divergencias.inativosRHAtivosApp ?? 'N/A'},
                {label: "Acessos Previstos Não Concedidos", value: displayData.imDisplay.divergencias.acessoPrevistoNaoConcedido ?? 'N/A'},
                {label: "Divergência de E-mail (IM)", value: displayData.imDisplay.divergencias.email ?? 'N/A'},
            ]} /></Grid>
            <Grid item xs={12} sm={6} md={2}><KpiStack title="Chamados (Exemplo)" defaultColor="info" items={[
                {label: "Closed", value: 49}, 
                {label: "Canceled", value: 59},
                {label: "On Hold", value: 2},
                {label: "In Progress", value: 2}
            ]}/></Grid>
            <Grid item xs={12} sm={6} md={6}>
                <VerticalBarChart
                    icon={{ color: "error", component: "warning" }}
                    title="Visão Geral de Riscos"
                    description="Principais pontos de atenção consolidados"
                    chart={displayData.riscosConsolidadosChart}
                />
            </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                <MDTypography variant="h6">Live Feed</MDTypography>
                <MDBox display="flex" alignItems="center">
                  <MDInput placeholder="Buscar Usuário..." size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ marginRight: 2 }} />
                  <MDButton variant="outlined" color="info" size="small">Filtros <Icon>filter_list</Icon></MDButton>
                </MDBox>
              </MDBox>
              <DataTable table={displayData.unifiedFeed} canSearch={false} entriesPerPage={{defaultValue: 5, entries: [5, 10, 20]}}/>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </DashboardLayout>
  );
}

export default VisaoGeral;