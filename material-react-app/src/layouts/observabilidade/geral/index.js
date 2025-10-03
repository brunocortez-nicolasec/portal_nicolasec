// material-react-app\src\layouts\observabilidade\geral\index.js

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import { Box } from "@mui/material";
import Modal from "@mui/material/Modal";

// Componentes do Template
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import VerticalBarChart from "examples/Charts/BarCharts/VerticalBarChart";

// Hook do Contexto Principal
import { useMaterialUIController } from "context";

// Componentes locais
import LiveFeed from "./components/LiveFeed";
import Painel from "./components/Painel";

// --- COMPONENTES CUSTOMIZADOS (mantidos) ---
function KpiStack({ title, items, defaultColor = "dark" }) {
    return ( <Card sx={{height: "100%"}}> <MDBox pt={2} px={2} textAlign="center"> <MDTypography variant="button" fontWeight="bold" textTransform="uppercase" color="secondary">{title}</MDTypography> </MDBox> <MDBox p={2} pt={0}> {items.map(item => ( <MDBox key={item.label} mt={2.5} lineHeight={1} textAlign="center"> <MDTypography variant="caption" color="text" fontWeight="light" textTransform="uppercase">{item.label}</MDTypography> <MDTypography variant="h3" fontWeight="bold" color={item.color || defaultColor}>{item.value}</MDTypography> </MDBox> ))} </MDBox> </Card> );
}

const ModalContent = React.forwardRef(({ title, data, onClose }, ref) => (
    <Box ref={ref} tabIndex={-1}>
        <Card sx={{ width: "80vw", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto" }}>
            <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
                <MDTypography variant="h6">{title}</MDTypography>
                <MDButton iconOnly onClick={onClose}><Icon>close</Icon></MDButton>
            </MDBox>
            <MDBox p={2} pt={0}>
                <DataTable table={data} isSorted={false} entriesPerPage={{ defaultValue: 10, entries: [5, 10, 25] }} showTotalEntries canSearch />
            </MDBox>
        </Card>
    </Box>
));

function VisaoGeral() {
    const [controller] = useMaterialUIController();
    const { token } = controller;

    const [plataformaSelecionada, setPlataformaSelecionada] = useState("Geral");
    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // --- NOVO ESTADO E LÓGICA PARA O LIVE FEED ---
    const [liveFeedData, setLiveFeedData] = useState([]);
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) return;
            setIsLoading(true);

            // Prepara a chamada de métricas
            const metricsPromise = axios.get(`/metrics/${plataformaSelecionada}`, {
                headers: { "Authorization": `Bearer ${token}` },
            });

            // <<< ALTERAÇÃO AQUI: Lógica de busca do Live Feed corrigida
            // Monta os parâmetros para a chamada do live-feed dinamicamente
            const liveFeedParams = {};
            if (plataformaSelecionada.toLowerCase() !== 'geral') {
                liveFeedParams.system = plataformaSelecionada;
            }

            // A chamada para a API agora acontece sempre
            const liveFeedPromise = axios.get('/live-feed', {
                headers: { "Authorization": `Bearer ${token}` },
                params: liveFeedParams
            });
            // FIM DA ALTERAÇÃO

            try {
                // Executa as duas chamadas em paralelo
                const [metricsResponse, liveFeedResponse] = await Promise.all([metricsPromise, liveFeedPromise]);
                setMetrics(metricsResponse.data);
                setLiveFeedData(liveFeedResponse.data);
            } catch (error) {
                console.error("Erro ao buscar dados do dashboard:", error);
                setMetrics(null);
                setLiveFeedData([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [plataformaSelecionada, token]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: "", data: { columns: [], rows: [] } });

    const handlePlatformChange = (plataforma) => {
        setPlataformaSelecionada(plataforma);
    };

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const displayData = useMemo(() => {
        const defaultData = {
            imDisplay: {
                pills: { total: 0, ativos: 0, inativos: 0, desconhecido: 0 },
                tiposChart: { labels: [], datasets: { data: [] } },
                tiposList: [],
                divergencias: { inativosRHAtivosApp: 0, login: 0, cpf: 0, email: 0, acessoPrevistoNaoConcedido: 0, ativosNaoEncontradosRH: 0, ativosNaoEncontradosTruIM: 0 },
                kpisAdicionais: { contasDormentes: 0, acessoPrivilegiado: 0 },
            },
            pamDisplay: { riscos: { acessosIndevidos: 0 } },
            riscosConsolidadosChart: { labels: ["Acessos Indevidos (PAM)", "RH Inativo/App Ativo (IM)", "Divergência de Login (IM)"], datasets: [{ label: "Total de Eventos de Risco", color: "error", data: [0, 0, 0] }] },
            prejuizoPotencial: "R$ 0,00",
            prejuizoMitigado: "R$ 0,00",
            indiceConformidade: isLoading ? "..." : "100.0",
            riscosEmContasPrivilegiadas: 0,
        };

        if (!metrics) {
            return defaultData;
        }

        const imDisplay = {
            pills: metrics.pills,
            tiposChart: {
                labels: metrics.tiposDeUsuario.map(t => t.tipo),
                datasets: {
                    label: "Tipos de Usuário",
                    backgroundColors: ["info", "primary", "warning", "secondary", "error", "light"],
                    data: metrics.tiposDeUsuario.map(t => t.total),
                },
            },
            tiposList: metrics.tiposDeUsuario.map(t => ({ label: t.tipo, value: t.total })),
            kpisAdicionais: metrics.kpisAdicionais || defaultData.imDisplay.kpisAdicionais,
            divergencias: { ...defaultData.imDisplay.divergencias, ...metrics.divergencias },
        };

        const riscosConsolidadosChart = {
            labels: ["Acessos Indevidos (PAM)", "RH Inativo/App Ativo (IM)", "Divergência de Login (IM)"],
            datasets: [{
                label: "Total de Eventos de Risco",
                color: "error",
                data: [
                    0, 
                    metrics.divergencias?.inativosRHAtivosApp || 0,
                    0,
                ]
            }]
        };
        
        return { 
            imDisplay,
            pamDisplay: defaultData.pamDisplay,
            riscosConsolidadosChart,
            prejuizoPotencial: metrics.riscos?.prejuizoPotencial || "R$ 0,00",
            prejuizoMitigado: metrics.riscos?.valorMitigado || "R$ 0,00",
            indiceConformidade: metrics.riscos?.indiceConformidade || "100.0",
            riscosEmContasPrivilegiadas: metrics.riscos?.riscosEmContasPrivilegiadas || 0,
        };
    }, [metrics, isLoading]);
    
    const handlePieChartClick = async (event, elements) => {
        if (!elements || elements.length === 0 || !token) return;
        const { index } = elements[0];
        const clickedLabel = displayData.imDisplay.tiposChart.labels[index];
        if (!clickedLabel) return;
        try {
          const params = { userType: clickedLabel === "Não categorizado" ? "" : clickedLabel };
          if (plataformaSelecionada !== "Geral") {
            params.sourceSystem = plataformaSelecionada;
          }
          const response = await axios.get('/identities', { headers: { "Authorization": `Bearer ${token}` }, params });
          setModalContent({
            title: `Detalhes: Tipo de Usuário "${clickedLabel}"`,
            data: {
              columns: [
                { Header: "ID", accessor: "identityId" }, { Header: "Nome", accessor: "name" }, { Header: "Email", accessor: "email" }, { Header: "Status", accessor: "status" },
              ],
              rows: response.data,
            },
          });
          handleOpenModal();
        } catch (error) {
          console.error("Erro ao buscar detalhes das identidades:", error);
        }
    };

    const handleBarChartClick = async (event, elements) => {
      if (!elements || elements.length === 0 || !token) return;
      const { index } = elements[0];
      const clickedLabel = displayData.riscosConsolidadosChart.labels[index];
      let divergenceType = "";
      let modalTitle = `Detalhes: ${clickedLabel}`;
      let columns = [];
      switch (index) {
        case 1: // RH Inativo/App Ativo (IM)
          divergenceType = 'rh-inativo-app-ativo';
          columns = [
            { Header: "ID", accessor: "identityId" }, { Header: "Nome", accessor: "name" }, { Header: "Email", accessor: "email" }, { Header: "Status App", accessor: "status" },
          ];
          break;
        default:
          return;
      }
      try {
        const response = await axios.get(`/divergences/${divergenceType}`, {
          headers: { "Authorization": `Bearer ${token}` },
          params: { system: plataformaSelecionada === "Geral" ? 'TruIM' : plataformaSelecionada },
        });
        setModalContent({
          title: modalTitle,
          data: { columns, rows: response.data },
        });
        handleOpenModal();
      } catch (error) {
        console.error(`Erro ao buscar detalhes da divergência ${divergenceType}:`, error);
      }
    };

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <Modal open={isModalOpen} onClose={handleCloseModal} sx={{ display: "grid", placeItems: "center" }}>
                <ModalContent title={modalContent.title} data={modalContent.data} onClose={handleCloseModal} />
            </Modal>
            <MDBox py={3}>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} lg={7}>
                        {displayData && (
                            <Painel 
                                imDisplay={displayData.imDisplay}
                                onPieChartClick={handlePieChartClick}
                                onPlatformChange={handlePlatformChange}
                                selectedPlatform={plataformaSelecionada}
                            />
                        )}
                    </Grid>
                    
                    <Grid item xs={12} lg={2}>
                        <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                            <MDBox p={2} pt={0} sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                                    <Grid item xs={12} sx={{ display: 'flex' }}>
                                        <Card sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                            <MDBox p={1} textAlign="center">
                                                <MDTypography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Índice de Conformidade</MDTypography>
                                                <MDTypography variant="h2" fontWeight="bold" color={displayData.indiceConformidade < 100 ? "warning" : "success"}> {displayData.indiceConformidade}%</MDTypography>
                                                <MDTypography variant="body2" color="text" sx={{mb: 3}}>das identidades estão íntegras.</MDTypography>
                                            </MDBox>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={12} sx={{ display: 'flex' }}>
                                        <Card sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                                            <MDBox p={1} textAlign="center">
                                                <MDTypography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Riscos em Contas Privilegiadas</MDTypography>
                                                <MDTypography variant="h2" fontWeight="bold" color={displayData.riscosEmContasPrivilegiadas > 0 ? "error" : "success"}>
                                                    {displayData.riscosEmContasPrivilegiadas}
                                                </MDTypography>
                                                <MDTypography variant="body2" color="text" sx={{mb: 3}}>contas admin com divergências.</MDTypography>
                                            </MDBox>
                                        </Card>
                                    </Grid>
                                </Grid>
                            </MDBox>
                        </Card>
                    </Grid>

                    <Grid item xs={12} lg={3}>
                        <Grid container spacing={3} direction="column">
                            <Grid item>
                                <Card>
                                    <MDBox p={2} textAlign="center">
                                        <MDBox display="grid" justifyContent="center" alignItems="center" bgColor="error" color="white" width="4rem" height="4rem" shadow="md" borderRadius="lg" variant="gradient" sx={{ mt: -3, mb: 2, mx: 'auto' }}>
                                            <Icon fontSize="large">money_off</Icon>
                                        </MDBox>
                                        <MDTypography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Prejuízo Potencial (Mensal)</MDTypography>
                                        <MDTypography variant="body2" color="text" sx={{mb: 3}}> Custo com riscos devido a contas &apos;RH Inativo / App Ativo&apos;. </MDTypography>
                                        <Card>
                                            <MDBox p={1}>
                                                <MDTypography variant="h2" fontWeight="bold" color="error"> {displayData.prejuizoPotencial} </MDTypography>
                                            </MDBox>
                                        </Card>
                                    </MDBox>
                                </Card>
                            </Grid>
                            <Grid item>
                                <Card>
                                    <MDBox p={2} textAlign="center">
                                        <MDBox display="grid" justifyContent="center" alignItems="center" bgColor="success" color="white" width="4rem" height="4rem" shadow="md" borderRadius="lg" variant="gradient" sx={{ mt: -3, mb: 2, mx: 'auto' }}>
                                            <Icon fontSize="large">savings</Icon>
                                        </MDBox>
                                        <MDTypography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>Valor Mitigado com TruIM</MDTypography>
                                        <MDTypography variant="body2" color="text" sx={{mb: 3}}> Redução de 95% do prejuízo potencial com governança. </MDTypography>
                                        <Card>
                                            <MDBox p={1}>
                                                <MDTypography variant="h2" fontWeight="bold" color="success"> {displayData.prejuizoMitigado} </MDTypography>
                                            </MDBox>
                                        </Card>
                                    </MDBox>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
                
                <Grid container spacing={3} sx={{ mb: 3 }} alignItems="stretch">
                    <Grid item xs={12} sm={6} md={2}><KpiStack title="Crítico" defaultColor="error" items={[{label: "Acessos Indevidos (PAM)", value: displayData.pamDisplay.riscos.acessosIndevidos ?? 'N/A'}, {label: "Divergência de Login (IM)", value: displayData.imDisplay.divergencias.login ?? 'N/A'}, {label: "Divergência de CPF (IM)", value: displayData.imDisplay.divergencias.cpf ?? 'N/A'}]} /></Grid>
                    <Grid item xs={12} sm={6} md={2}><KpiStack title="Divergências" defaultColor="warning" items={[{label: "RH Inativo / App Ativo (IM)", value: displayData.imDisplay.divergencias.inativosRHAtivosApp ?? 'N/A'}, {label: "Acessos Previstos Não Concedidos", value: displayData.imDisplay.divergencias.acessoPrevistoNaoConcedido ?? 'N/A'}, {label: "Divergência de E-mail (IM)", value: displayData.imDisplay.divergencias.email ?? 'N/A'}]} /></Grid>
                    <Grid item xs={12} sm={6} md={2}><KpiStack title="Chamados" defaultColor="info" items={[{label: "Fechados", value: 49}, {label: "Cancelados", value: 59}, {label: "Em espera", value: 2}, {label: "Em progresso", value: 2}]}/></Grid>
                    <Grid item xs={12} sm={6} md={6}>
                        <Card sx={{ height: "100%" }}>
                            <VerticalBarChart icon={{ color: "error", component: "warning" }} title="Visão Geral de Riscos" description="Principais pontos de atenção consolidados" chart={displayData.riscosConsolidadosChart} onClick={handleBarChartClick} />
                        </Card>
                    </Grid>
                </Grid>

                <Grid container spacing={3}>
                    <Grid item xs={12}>
                        <LiveFeed data={liveFeedData} />
                    </Grid>
                </Grid>
            </MDBox>
        </DashboardLayout>
    );
}

export default VisaoGeral;