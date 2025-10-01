import React, { useMemo, useState } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import { Box, Divider } from "@mui/material";
import Modal from "@mui/material/Modal";

// Componentes do Template
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";
import VerticalBarChart from "examples/Charts/BarCharts/VerticalBarChart";
import { useDashboard } from "context/DashboardContext";

// Componentes refatorados importados
import LiveFeed from "./components/LiveFeed";
import Painel from "./components/Painel";

// --- COMPONENTES CUSTOMIZADOS ---
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
    const { 
        plataformasData, 
        plataformaSelecionada, 
        setPlataformaSelecionada, 
        updatePlataformaData 
    } = useDashboard();
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: "", data: { columns: [], rows: [] } });

    const handlePlatformChange = (plataforma) => {
        setPlataformaSelecionada(plataforma);
    };

    const handleCsvImport = (plataforma, dados) => {
        const targetPlatform = plataforma === "Geral" ? "TruIM" : plataforma;
        updatePlataformaData(targetPlatform, dados);
        alert(`Dados para a plataforma ${targetPlatform} foram importados com sucesso!`);
    };

    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const displayData = useMemo(() => {
        let imData = [];
        if (plataformaSelecionada === "Geral") {
            imData = Object.values(plataformasData).flat();
        } else {
            imData = plataformasData[plataformaSelecionada] || [];
        }
        
        const pamData = plataformasData["TruPAM"] || [];

        // --- LÓGICA DO ÍNDICE DE CONFORMIDADE CORRIGIDA ---
        const temDivergencia = (r) => {
            let isDormente = false;
            if (r.status_app === 'ativo' && r.ultimo_login) {
                const ultimoLogin = new Date(r.ultimo_login);
                const diffTime = Math.abs(new Date() - ultimoLogin);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                isDormente = diffDays > 90;
            }
            return ( (r.status_rh === 'inativo' && r.status_app === 'ativo') || !r.status_rh || (r.login_esperado && r.login_atual && r.login_esperado !== r.login_atual) || (r.cpf_rh && r.cpf_app && r.cpf_rh !== r.cpf_app) || (r.email_rh && r.email_app && r.email_rh !== r.email_app) || isDormente );
        };

        const totalComDivergencia = imData.filter(temDivergencia).length;
        const totalIdentidades = imData.length;
        const indiceConformidade = totalIdentidades > 0 ? (((totalIdentidades - totalComDivergencia) / totalIdentidades) * 100).toFixed(1) : '100.0';
        const riscosEmContasPrivilegiadas = imData.filter(r => r.perfil === 'admin' && temDivergencia(r)).length;
        // --- FIM DA CORREÇÃO ---

        const custoPorDivergencia = 25000;
        const inativosRHAtivosAppCount = imData.filter(r => r.status_rh === 'inativo' && r.status_app === 'ativo').length;
        const prejuizoCalculado = inativosRHAtivosAppCount * custoPorDivergencia;
        const valorMitigado = (prejuizoCalculado * 0.95);
        const prejuizoPotencial = prejuizoCalculado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const prejuizoMitigado = valorMitigado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const imDisplay = {
            pills: { 
                total: imData.length, 
                ativos: imData.filter(r => r.status_app === 'ativo').length, 
                inativos: imData.filter(r => r.status_app === 'inativo').length, 
                // --- LÓGICA DO "DESCONHECIDO" CORRIGIDA ---
                desconhecido: imData.filter(r => !r.tipo_usuario).length, 
            },
            tipos: imData.reduce((acc, r) => {
                const key = r.tipo_usuario || "Desconhecido";
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {}),
            divergencias: { 
                inativosRHAtivosApp: inativosRHAtivosAppCount, 
                ativosNaoEncontradosRH: imData.filter(r => !r.status_rh && r.status_app === 'ativo').length,
                ativosNaoEncontradosTruIM: imData.filter(r => !r.status_idm && r.status_app === 'ativo').length,
                login: imData.filter(r => r.login_esperado && r.login_atual && r.login_esperado !== r.login_atual).length, 
                acessoPrevistoNaoConcedido: imData.filter(r => r.acesso_previsto === 'true' && r.status_app !== 'ativo').length, 
                cpf: imData.filter(r => r.cpf_rh && r.cpf_app && r.cpf_rh !== r.cpf_app).length, 
                email: imData.filter(r => r.email_rh && r.email_app && r.email_rh !== r.email_app).length, 
            },
            kpisAdicionais: { 
                contasDormentes: imData.filter(r => { if (r.status_app !== 'ativo' || !r.ultimo_login) return false; const ultimoLogin = new Date(r.ultimo_login); const diffTime = Math.abs(new Date() - ultimoLogin); const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); return diffDays > 90; }).length, 
                acessoPrivilegiado: imData.filter(r => r.perfil === 'admin' && r.status_app === 'ativo').length, 
            },
            tiposChart: (() => {
                const tipos = imData.reduce((acc, r) => {
                    const key = r.tipo_usuario || "Desconhecido";
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {});
                return { labels: Object.keys(tipos), datasets: { label: "Tipos", backgroundColors: ["info", "primary", "warning", "secondary", "error", "light"], data: Object.values(tipos) }, };
            })(),
        };
        
        const tiposList = Object.entries(imDisplay.tipos).map(([key, val]) => ({ label: key, value: val, }));
        tiposList.push({ label: "Ativo Não Encontrado", value: imDisplay.divergencias.ativosNaoEncontradosRH, color: "error", });
        const inativosNaoEncontradosRH = imData.filter(r => !r.status_rh && r.status_app === 'inativo').length;
        tiposList.push({ label: "Inativo Não Encontrado", value: inativosNaoEncontradosRH, color: "warning", });
        imDisplay.tiposList = tiposList;

        const pamDisplay = { riscos: { acessosIndevidos: pamData.filter(r => r.acesso_indevido === 'sim').length, } };
        const riscosConsolidadosChart = { labels: ["Acessos Indevidos (PAM)", "RH Inativo/App Ativo (IM)", "Divergência de Login (IM)"], datasets: [{ label: "Total de Eventos de Risco", color: "error", data: [ pamDisplay.riscos.acessosIndevidos, imDisplay.divergencias.inativosRHAtivosApp, imDisplay.divergencias.login, ] }] };

        return { imDisplay, pamDisplay, riscosConsolidadosChart, prejuizoPotencial, prejuizoMitigado, indiceConformidade, riscosEmContasPrivilegiadas };
    }, [plataformasData, plataformaSelecionada]);

    const handlePieChartClick = (event, elements) => {
        if (!elements || elements.length === 0 || !displayData) return;
        const currentData = plataformaSelecionada === "Geral" ? Object.values(plataformasData).flat() : (plataformasData[plataformaSelecionada] || []);
        if (!currentData.length) return;

        const { index } = elements[0];
        const clickedLabel = displayData.imDisplay.tiposChart.labels[index];
        if (clickedLabel) {
            const filteredData = currentData.filter(user => (user.tipo_usuario || "Desconhecido") === clickedLabel);
            setModalContent({
                title: `Detalhes: Tipo de Usuário "${clickedLabel}"`,
                data: {
                    columns: [ { Header: "ID do Usuário", accessor: "id_usuario" }, { Header: "Nome", accessor: "nome_colaborador" }, { Header: "E-mail App", accessor: "email_app" }, { Header: "Status App", accessor: "status_app" }, ],
                    rows: filteredData,
                }
            });
            handleOpenModal();
        }
    };
    
    const handleBarChartClick = (event, elements) => {
        if (!elements || elements.length === 0 || !displayData) return;
        
        const pamData = plataformasData["TruPAM"] || [];
        const imData = Object.values(plataformasData).filter(key => key !== 'TruPAM' && key !== 'TruAM').flat();

        const { index } = elements[0];
        const clickedLabel = displayData.riscosConsolidadosChart.labels[index];
        let filteredData = [];
        let columns = [];

        switch (index) {
            case 0:
                filteredData = pamData.filter(r => r.acesso_indevido === 'sim');
                columns = [ { Header: "Usuário Privilegiado", accessor: "usuario_privilegiado" }, { Header: "Sistema", accessor: "sistema" }, { Header: "Data do Evento", accessor: "data_evento" }, ];
                break;
            case 1:
                filteredData = imData.filter(r => r.status_rh === 'inativo' && r.status_app === 'ativo');
                columns = [ { Header: "ID do Usuário", accessor: "id_usuario" }, { Header: "Nome", accessor: "nome_colaborador" }, { Header: "Status RH", accessor: "status_rh" }, { Header: "Status App", accessor: "status_app" }, ];
                break;
            case 2:
                filteredData = imData.filter(r => r.login_esperado && r.login_atual && r.login_esperado !== r.login_atual);
                columns = [ { Header: "ID do Usuário", accessor: "id_usuario" }, { Header: "Nome", accessor: "nome_colaborador" }, { Header: "Login Esperado", accessor: "login_esperado" }, { Header: "Login Atual", accessor: "login_atual" }, ];
                break;
            default:
                return;
        }
        setModalContent({ title: `Detalhes: ${clickedLabel}`, data: { columns, rows: filteredData } });
        handleOpenModal();
    };

    const allDataForLiveFeed = useMemo(() => Object.values(plataformasData).flat(), [plataformasData]);

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
                                onCsvImport={handleCsvImport}
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
                                                <MDTypography variant="h2" fontWeight="bold" color="success"> {displayData.indiceConformidade}%</MDTypography>
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
                        <LiveFeed 
                            truIMData={allDataForLiveFeed}
                            truPAMData={plataformasData["TruPAM"] || []}
                            truAMData={plataformasData["TruAM"] || []}
                        />
                    </Grid>
                </Grid>
            </MDBox>
        </DashboardLayout>
    );
}

export default VisaoGeral;