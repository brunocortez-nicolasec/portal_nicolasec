// material-react-app/src/layouts/observabilidade/geral/index.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import { Box } from "@mui/material";
import Modal from "@mui/material/Modal";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";

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
import RiskAnalysisWidgets from "./components/RiskAnalysisWidgets";
import KpiStack from "./components/KpiStack";

// --- COMPONENTES DE MODAL ---

const ModalContent = React.forwardRef(({ title, data, onClose, darkMode }, ref) => (
    <Box ref={ref} tabIndex={-1}>
        <Card sx={{ width: "80vw", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto" }}>
            <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
                <MDTypography variant="h6">{title}</MDTypography>
                {/* <<< INÍCIO DA ALTERAÇÃO >>> */}
                <Icon
                    sx={({ typography: { size }, palette: { dark, white } }) => ({
                        fontSize: `${size.lg} !important`,
                        color: darkMode ? white.main : dark.main,
                        stroke: "currentColor",
                        strokeWidth: "2px",
                        cursor: "pointer",
                    })}
                    onClick={onClose}
                >
                    close
                </Icon>
                {/* <<< FIM DA ALTERAÇÃO >>> */}
            </MDBox>
            <MDBox p={2} pt={0}>
                <DataTable table={data} isSorted={false} entriesPerPage={{ defaultValue: 10, entries: [5, 10, 25] }} showTotalEntries canSearch />
            </MDBox>
        </Card>
    </Box>
));

const DrillDownModal = React.forwardRef(({ title, data, isLoading, onIgnore, onIgnoreAll, onClose, darkMode }, ref) => {
    const columns = [
        { Header: "Nome", accessor: "name", Cell: ({ value }) => <MDTypography variant="caption">{value}</MDTypography> },
        { Header: "Email", accessor: "email", Cell: ({ value }) => <MDTypography variant="caption">{value}</MDTypography> },
        { Header: "Sistema", accessor: "sourceSystem", align: "center", Cell: ({ value }) => <MDTypography variant="caption">{value}</MDTypography> },
        { Header: "Ações", accessor: "id", align: "center", disableGlobalFilter: true,
            Cell: ({ row }) => (
                <MDButton variant="outlined" color="info" size="small" onClick={() => onIgnore(row.original)}>Ignorar</MDButton>
            )
        },
    ];

    return (
        <Box ref={ref} tabIndex={-1}>
            <Card sx={{ width: "80vw", maxWidth: "900px", maxHeight: "90vh", overflowY: "auto" }}>
                <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
                    <MDTypography variant="h6">{title}</MDTypography>
                    <MDBox display="flex" alignItems="center">
                        {data.length > 0 && !isLoading && (
                            <MDButton variant="gradient" color="info" size="small" onClick={onIgnoreAll} sx={{ mr: 2 }}>
                                Ignorar Todos
                            </MDButton>
                        )}
                        {/* <<< INÍCIO DA ALTERAÇÃO >>> */}
                        <Icon
                            sx={({ typography: { size }, palette: { dark, white } }) => ({
                                fontSize: `${size.lg} !important`,
                                color: darkMode ? white.main : dark.main,
                                stroke: "currentColor",
                                strokeWidth: "2px",
                                cursor: "pointer",
                            })}
                            onClick={onClose}
                        >
                            close
                        </Icon>
                        {/* <<< FIM DA ALTERAÇÃO >>> */}
                    </MDBox>
                </MDBox>
                <MDBox p={2} pt={0}>
                    {isLoading ? (
                        <MDBox display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: '200px' }}><CircularProgress color="info" /></MDBox>
                    ) : (
                        <DataTable table={{ columns, rows: data }} isSorted entriesPerPage={{ defaultValue: 5 }} showTotalEntries canSearch />
                    )}
                </MDBox>
            </Card>
        </Box>
    );
});

// ... (o resto do arquivo permanece o mesmo, sem alterações)
const JustificationModal = ({ open, onClose, onSubmit }) => {
    const [justification, setJustification] = useState("");
    const handleSubmit = () => { onSubmit(justification); setJustification(""); };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>Justificar Exceção</DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ mb: 2 }}>
                    Por favor, forneça uma justificativa para ignorar esta divergência. Esta ação será registrada para fins de auditoria.
                </DialogContentText>
                <TextField autoFocus margin="dense" id="justification" label="Justificativa" type="text" fullWidth multiline rows={4} variant="outlined" value={justification} onChange={(e) => setJustification(e.target.value)} />
            </DialogContent>
            <DialogActions>
                <MDButton onClick={onClose} color="secondary">Cancelar</MDButton>
                <MDButton onClick={handleSubmit} color="info" variant="gradient" disabled={!justification.trim()}>Salvar Exceção</MDButton>
            </DialogActions>
        </Dialog>
    );
};


function VisaoGeral() {
    const [controller] = useMaterialUIController();
    const { token, darkMode } = controller; // <<< ALTERAÇÃO: darkMode é extraído do controller

    const [plataformaSelecionada, setPlataformaSelecionada] = useState("Geral");
    const [metrics, setMetrics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [liveFeedData, setLiveFeedData] = useState([]);
    
    const [drillDownState, setDrillDownState] = useState({ isOpen: false, isLoading: false, title: "", data: [], code: "" });
    const [exceptionState, setExceptionState] = useState({ isOpen: false, identity: null, isBulk: false });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState({ title: "", data: { columns: [], rows: [] } });
    const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

    const fetchDashboardData = async () => {
        if (!token) return;
        setIsLoading(true);
        const metricsPromise = axios.get(`/metrics/${plataformaSelecionada}?_=${new Date().getTime()}`, { headers: { "Authorization": `Bearer ${token}` } });
        const liveFeedParams = { system: plataformaSelecionada.toLowerCase() === 'geral' ? undefined : plataformaSelecionada };
        const liveFeedPromise = axios.get('/live-feed', { headers: { "Authorization": `Bearer ${token}` }, params: liveFeedParams });
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

    useEffect(() => {
        if (token) {
            fetchDashboardData();
        }
    }, [plataformaSelecionada, token]);

    const displayData = useDashboardData(metrics, isLoading);
    const handlePlatformChange = (plataforma) => setPlataformaSelecionada(plataforma);
    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    const handleKpiItemClick = async (code, title) => {
        setDrillDownState({ isOpen: true, isLoading: true, title: `Detalhes: ${title}`, data: [], code });
        try {
            const response = await axios.get(`/divergences/by-code/${code}`, {
                headers: { "Authorization": `Bearer ${token}` },
                params: { system: plataformaSelecionada === 'Geral' ? undefined : plataformaSelecionada }
            });
            setDrillDownState(prev => ({ ...prev, isLoading: false, data: response.data }));
        } catch (error) {
            console.error("Erro ao buscar detalhes da divergência:", error);
            setDrillDownState(prev => ({ ...prev, isLoading: false }));
        }
    };

    const handleCloseDrillDownModal = () => setDrillDownState({ isOpen: false, isLoading: false, title: "", data: [], code: "" });
    
    const handleOpenExceptionModal = (identity) => {
        setExceptionState({ isOpen: true, identity, isBulk: false });
    };
    
    const handleCloseExceptionModal = () => setExceptionState({ isOpen: false, identity: null, isBulk: false });

    const handleOpenBulkConfirm = () => setIsBulkConfirmOpen(true);
    const handleCloseBulkConfirm = () => setIsBulkConfirmOpen(false);
    
    const handleConfirmBulkIgnore = () => {
        handleCloseBulkConfirm();
        setExceptionState({ isOpen: true, identity: null, isBulk: true });
    };
    
    const handleConfirmException = async (justification) => {
        const { identity, isBulk } = exceptionState;
        const { code, data } = drillDownState;
    
        if (!code || !justification) return;
    
        try {
            if (isBulk) {
                if (code === 'ACCESS_NOT_GRANTED') {
                    const groupedBySystem = data.reduce((acc, item) => {
                        const system = item.sourceSystem;
                        if (!acc[system]) {
                            acc[system] = [];
                        }
                        const originalId = parseInt(String(item.id).split('-')[0], 10);
                        if (!isNaN(originalId)) {
                            acc[system].push(originalId);
                        }
                        return acc;
                    }, {});
    
                    const promises = Object.entries(groupedBySystem).map(([system, ids]) => {
                        if (ids.length === 0) return Promise.resolve();
                        const payload = {
                            identityIds: ids,
                            divergenceCode: code,
                            justification,
                            targetSystem: system,
                        };
                        return axios.post('/divergences/exceptions/bulk', payload, { headers: { "Authorization": `Bearer ${token}` } });
                    });
    
                    await Promise.all(promises);
    
                } else {
                    const identityIds = data.map(item => item.id);
                    if (identityIds.length === 0) return;
                    
                    const payload = {
                        identityIds,
                        divergenceCode: code,
                        justification,
                    };
                    await axios.post('/divergences/exceptions/bulk', payload, { headers: { "Authorization": `Bearer ${token}` } });
                }
            } else {
                if (!identity) return;
                
                const identityId = code === 'ACCESS_NOT_GRANTED' 
                    ? parseInt(String(identity.id).split('-')[0], 10)
                    : identity.id;
    
                if (isNaN(identityId)) {
                    throw new Error("ID da identidade é inválido.");
                }
    
                const payload = {
                    identityId: identityId,
                    divergenceCode: code,
                    justification,
                };
    
                if (code === 'ACCESS_NOT_GRANTED') {
                    payload.targetSystem = identity.sourceSystem;
                }
                await axios.post('/divergences/exceptions', payload, { headers: { "Authorization": `Bearer ${token}` } });
            }
            
            handleCloseExceptionModal();
            handleCloseDrillDownModal();
            fetchDashboardData();
    
        } catch (error) {
            console.error("Erro ao criar exceção(ões):", error);
        }
    };
    
    const handleFinancialCardClick = (cardType) => {
        const breakdownData = metrics?.riscos?.prejuizoBreakdown;
        if (!breakdownData) { return; }
        const title = cardType === 'prejuizo' ? "Detalhes do Cálculo de Prejuízo Potencial" : "Detalhes do Cálculo de Valor Mitigado";
        const columns = [ { Header: "Tipo de Risco", accessor: "label" }, { Header: "Quantidade", accessor: "count" }, { Header: "Custo Unitário", accessor: "costPerUnit" }, { Header: "Subtotal", accessor: "subTotal" } ];
        const multiplier = cardType === 'mitigado' ? 0.95 : 1;
        const rows = breakdownData.filter(item => item.count > 0).map(item => ({
            label: item.label,
            count: item.count,
            costPerUnit: `R$ ${item.costPerUnit.toLocaleString('pt-BR')}`,
            subTotal: `R$ ${(item.subTotal * multiplier).toLocaleString('pt-BR')}`,
        }));
        setModalContent({ title: title, data: { columns, rows } });
        handleOpenModal();
    };

    const handlePieChartClick = (event, elements) => {
        if (!elements || elements.length === 0) return;
        const { index } = elements[0];
        const clickedLabel = displayData.imDisplay.tiposChart.labels[index];
        if (!clickedLabel) return;
    
        const usersOfType = liveFeedData.filter(user => 
            user.userType === clickedLabel && user.app_status !== 'Não encontrado'
        );
    
        setModalContent({
            title: `Detalhes: Tipo de Usuário "${clickedLabel}"`,
            data: {
                columns: [
                    { Header: "ID", accessor: "identityId" },
                    { Header: "Nome", accessor: "name" },
                    { Header: "Email", accessor: "email" },
                    { Header: "Sistema", accessor: "sourceSystem" },
                    { Header: "Perfil", accessor: "perfil" },
                    { Header: "Status App", accessor: "app_status" },
                ],
                rows: usersOfType,
            },
        });
        handleOpenModal();
    };

    const handleBarChartClick = async (event, elements) => {
        if (!elements || elements.length === 0 || !token) return;
        const { index } = elements[0];
        const clickedLabel = displayData.riscosConsolidadosChart.labels[index];
        if (!clickedLabel) return;
        let columns = [];
        const modalTitle = `Detalhes: ${clickedLabel}`;
        let rowsToShow = [];
        try {
            switch (index) {
                case 0:
                    rowsToShow = liveFeedData.filter(user => user.perfil === 'Admin' && user.divergence);
                    columns = [ { Header: "Sistema", accessor: "sourceSystem" }, { Header: "ID", accessor: "identityId" }, { Header: "Nome", accessor: "name" }, { Header: "Status App", accessor: "app_status" }, { Header: "Status RH", accessor: "rh_status" } ];
                    break;
                case 1:
                    const endpoint = '/divergences/by-code/ZOMBIE_ACCOUNT';
                    const requestParams = { system: plataformaSelecionada === "Geral" ? undefined : plataformaSelecionada };
                    columns = [ { Header: "Sistema", accessor: "sourceSystem" }, { Header: "ID", accessor: "identityId" }, { Header: "Nome", accessor: "name" }, { Header: "Email", accessor: "email" } ];
                    const response = await axios.get(endpoint, { headers: { "Authorization": `Bearer ${token}` }, params: requestParams });
                    rowsToShow = response.data;
                    break;
                case 2:
                    rowsToShow = liveFeedData.filter(user => user.rh_status === 'Não encontrado');
                    columns = [ { Header: "Sistema", accessor: "sourceSystem" }, { Header: "ID", accessor: "identityId" }, { Header: "Nome", accessor: "name" }, { Header: "Email", accessor: "email" }, { Header: "Perfil", accessor: "perfil" } ];
                    break;
                default: return;
            }
            setModalContent({ title: modalTitle, data: { columns, rows: rowsToShow } });
            handleOpenModal();
        } catch (error) {
            console.error(`Erro ao buscar detalhes para '${clickedLabel}':`, error);
        }
    };

    return (
        <DashboardLayout>
            <DashboardNavbar />
            
            <Modal open={drillDownState.isOpen} onClose={handleCloseDrillDownModal} sx={{ display: "grid", placeItems: "center" }}>
                <DrillDownModal 
                    title={drillDownState.title} 
                    data={drillDownState.data} 
                    isLoading={drillDownState.isLoading} 
                    onClose={handleCloseDrillDownModal} 
                    onIgnore={handleOpenExceptionModal}
                    onIgnoreAll={handleOpenBulkConfirm}
                    darkMode={darkMode} // <<< ALTERAÇÃO: Passando o darkMode para o modal
                />
            </Modal>
    
            <JustificationModal open={exceptionState.isOpen} onClose={handleCloseExceptionModal} onSubmit={handleConfirmException} />
            
            <Dialog open={isBulkConfirmOpen} onClose={handleCloseBulkConfirm}>
                <DialogTitle>Confirmar Ação em Massa</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Você tem certeza que deseja ignorar todas as <strong>{drillDownState.data.length}</strong> divergências deste tipo?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <MDButton onClick={handleCloseBulkConfirm} color="secondary">Cancelar</MDButton>
                    <MDButton onClick={handleConfirmBulkIgnore} color="info" variant="gradient">Confirmar</MDButton>
                </DialogActions>
            </Dialog>

            <Modal open={isModalOpen} onClose={handleCloseModal} sx={{ display: "grid", placeItems: "center" }}>
                <ModalContent 
                    title={modalContent.title} 
                    data={modalContent.data} 
                    onClose={handleCloseModal} 
                    darkMode={darkMode} // <<< ALTERAÇÃO: Passando o darkMode para o modal
                />
            </Modal>

            <MDBox py={3}>
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} lg={7}>
                        {displayData && (
                            <Painel imDisplay={displayData.imDisplay} onPieChartClick={handlePieChartClick} onPlatformChange={handlePlatformChange} selectedPlatform={plataformaSelecionada} />
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
                        <RiskAnalysisWidgets 
                            title="Crítico" 
                            defaultColor="error" 
                            onItemClick={handleKpiItemClick}
                            items={[ 
                                { label: "Acessos Ativos Indevidos", value: displayData.imDisplay.divergencias.inativosRHAtivosApp ?? 0, code: 'ZOMBIE_ACCOUNT' },
                                { label: "Divergência de CPF", value: displayData.imDisplay.divergencias.cpf ?? 0, code: 'CPF_MISMATCH' },
                                { label: "Admins Dormentes", value: displayData.imDisplay.kpisAdicionais.adminsDormentes ?? 0, code: 'DORMANT_ADMIN' }
                            ]} 
                        />
                    </Grid>
                    <Grid item xs={12} sm={6} md={2}>
                        <RiskAnalysisWidgets 
                            title="Divergências" 
                            defaultColor="warning" 
                            onItemClick={handleKpiItemClick}
                            items={[ 
                                { label: "Acessos Previstos Não Concedidos", value: displayData.imDisplay.divergencias.acessoPrevistoNaoConcedido ?? 0, code: 'ACCESS_NOT_GRANTED' }, 
                                { label: "Divergência de Nome", value: displayData.imDisplay.divergencias.nome ?? 0, code: 'NAME_MISMATCH' }, 
                                { label: "Divergência de E-mail", value: displayData.imDisplay.divergencias.email ?? 0, code: 'EMAIL_MISMATCH' } 
                            ]} 
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