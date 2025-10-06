import React, { useEffect, useState } from "react";
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

// Hook do Contexto Principal
import { useMaterialUIController } from "context";

// Componentes locais
import LiveFeed from "./components/LiveFeed";
import Painel from "./components/Painel";
import RisksChartCard from "./components/RisksChartCard";
import useDashboardData from "./hooks/useDashboardData";
import FinancialCards from "./components/FinancialCards";

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
    
    const [liveFeedData, setLiveFeedData] = useState([]);
    
    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!token) return;
            setIsLoading(true);

            const metricsPromise = axios.get(`/metrics/${plataformaSelecionada}`, {
                headers: { "Authorization": `Bearer ${token}` },
            });

            const liveFeedParams = {};
            if (plataformaSelecionada.toLowerCase() !== 'geral') {
                liveFeedParams.system = plataformaSelecionada;
            }
            
            const liveFeedPromise = axios.get('/live-feed', {
                headers: { "Authorization": `Bearer ${token}` },
                params: liveFeedParams
            });

            try {
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

    const displayData = useDashboardData(metrics, isLoading);

    const handlePlatformChange = (plataforma) => {
        setPlataformaSelecionada(plataforma);
    };

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);
    
    const handleFinancialCardClick = (cardType) => {
        const breakdownData = metrics?.riscos?.prejuizoBreakdown;
        if (!breakdownData) {
            console.log("Dados de detalhamento do prejuízo não disponíveis.");
            return;
        }

        const title = cardType === 'prejuizo' 
            ? "Detalhes do Cálculo de Prejuízo Potencial"
            : "Detalhes do Cálculo de Valor Mitigado";

        const columns = [
            { Header: "Tipo de Risco", accessor: "label" },
            { Header: "Quantidade", accessor: "count" },
            { Header: "Custo Unitário", accessor: "costPerUnit" },
            { Header: "Subtotal", accessor: "subTotal" },
        ];

        const multiplier = cardType === 'mitigado' ? 0.95 : 1;

        const rows = breakdownData
            .filter(item => item.count > 0)
            .map(item => ({
                label: item.label,
                count: item.count,
                costPerUnit: `R$ ${item.costPerUnit.toLocaleString('pt-BR')}`,
                subTotal: `R$ ${(item.subTotal * multiplier).toLocaleString('pt-BR')}`,
            }));

        setModalContent({
            title: title,
            data: { columns, rows },
        });

        handleOpenModal();
    };

    // ======================= INÍCIO DA ALTERAÇÃO =======================
    const handlePieChartClick = async (event, elements) => {
        if (!elements || elements.length === 0 || !token) return;
        const { index } = elements[0];
        const clickedLabel = displayData.imDisplay.tiposChart.labels[index];
        if (!clickedLabel) return;
        
        try {
          // Lógica corrigida: sempre envia o `clickedLabel` como `userType`.
          // O backend será responsável por interpretar "Não categorizado" corretamente.
          const params = {
            userType: clickedLabel,
          };

          if (plataformaSelecionada !== "Geral") {
            params.sourceSystem = plataformaSelecionada;
          }

          const response = await axios.get('/identities', { 
            headers: { "Authorization": `Bearer ${token}` }, 
            params 
          });

          setModalContent({
            title: `Detalhes: Tipo de Usuário "${clickedLabel}"`,
            data: { 
              columns: [ 
                { Header: "ID", accessor: "identityId" }, 
                { Header: "Nome", accessor: "name" }, 
                { Header: "Email", accessor: "email" }, 
                { Header: "Status", accessor: "status" }, 
              ], 
              rows: response.data, 
            },
          });
          handleOpenModal();
        } catch (error) {
          console.error("Erro ao buscar detalhes das identidades:", error);
        }
    };
    // ======================== FIM DA ALTERAÇÃO =======================

    const handleBarChartClick = async (event, elements) => {
        if (!elements || elements.length === 0 || !token) return;
        const { index } = elements[0];
        const clickedLabel = displayData.riscosConsolidadosChart.labels[index];
        let endpoint = "";
        let requestParams = {};
        let columns = [];
        const modalTitle = `Detalhes: ${clickedLabel}`;
        switch (index) {
          case 0: endpoint = '/pam/risks/acessos-indevidos'; columns = [ { Header: "Usuário", accessor: "user" }, { Header: "Origem", accessor: "source" }, { Header: "Destino", accessor: "destination" }, { Header: "Data/Hora", accessor: "timestamp" }, { Header: "Detalhes", accessor: "details" }, ]; break;
          case 1: endpoint = '/divergences/rh-inativo-app-ativo'; if (plataformaSelecionada !== "Geral") { requestParams.system = plataformaSelecionada; } columns = [ { Header: "Sistema", accessor: "sourceSystem" }, { Header: "ID", accessor: "identityId" }, { Header: "Nome", accessor: "name" }, { Header: "Email", accessor: "email" }, { Header: "Status App", accessor: "app_status" }, { Header: "Status RH", accessor: "rh_status" } ]; break;
          case 2: endpoint = '/divergences/divergencia-login'; if (plataformaSelecionada !== "Geral") { requestParams.system = plataformaSelecionada; } columns = [ { Header: "Sistema", accessor: "sourceSystem" }, { Header: "ID", accessor: "identityId" }, { Header: "Nome", accessor: "name" }, { Header: "Login App", accessor: "app_login" }, { Header: "Login Padrão RH", accessor: "rh_login" }, ]; break;
          default: console.log(`Clique na barra '${clickedLabel}' (index ${index}) ainda não implementado.`); return;
        }
        try {
          const response = await axios.get(endpoint, { headers: { "Authorization": `Bearer ${token}` }, params: requestParams, });
          setModalContent({ title: modalTitle, data: { columns, rows: response.data }, });
          handleOpenModal();
        } catch (error) {
          console.error(`Erro ao buscar detalhes do endpoint ${endpoint}:`, error);
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

                    <FinancialCards 
                        prejuizoPotencial={displayData.prejuizoPotencial}
                        valorMitigado={displayData.prejuizoMitigado}
                        plataformaSelecionada={plataformaSelecionada}
                        onClick={handleFinancialCardClick}
                    />

                </Grid>
                
                <Grid container spacing={3} sx={{ mb: 3 }} alignItems="stretch">
                    <Grid item xs={12} sm={6} md={2}>
                        <KpiStack 
                            title="Crítico" 
                            defaultColor="error" 
                            items={[ { label: "Acessos Indevidos", value: displayData.pamDisplay.riscos.acessosIndevidos ?? 0 }, { label: "Divergência de Login", value: displayData.imDisplay.divergencias.login ?? 0 }, { label: "Divergência de CPF", value: displayData.imDisplay.divergencias.cpf ?? 0 } ]} 
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <KpiStack 
                            title="Divergências" 
                            defaultColor="warning" 
                            items={[ { label: "Acessos Previstos Não Concedidos", value: displayData.imDisplay.divergencias.acessoPrevistoNaoConcedido ?? 0 }, { label: "Divergência de Nome", value: displayData.imDisplay.divergencias.nome ?? 0 }, { label: "Divergência de E-mail", value: displayData.imDisplay.divergencias.email ?? '-' } ]} 
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <KpiStack 
                            title="Chamados" 
                            defaultColor="info" 
                            items={[ {label: "Fechados", value: 49}, {label: "Cancelados", value: 59}, {label: "Em espera", value: 2}, {label: "Em progresso", value: 2} ]}
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={6}>
                        <RisksChartCard 
                            chart={displayData.riscosConsolidadosChart}
                            onClick={handleBarChartClick}
                        />
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