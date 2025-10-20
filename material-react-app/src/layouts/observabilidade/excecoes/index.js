// material-react-app/src/layouts/observabilidade/excecoes/index.js

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useMaterialUIController } from "context";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Modal from "@mui/material/Modal";
import Divider from "@mui/material/Divider";

// Libs para Relatórios
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";
import PropTypes from 'prop-types'; // Adicionado para PropTypes

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

// --- COMPONENTE HELPER PADRONIZADO ---
// (Exatamente o mesmo do DataSourceViewModal)
function DetailItem({ icon, label, value, children, darkMode }) {
  const valueColor = darkMode ? "white" : "text.secondary";

  return (
    <MDBox display="flex" alignItems="center" mb={1.5} lineHeight={1}>
      <Icon color="secondary" fontSize="small" sx={{ mr: 1.5 }}>
        {icon}
      </Icon>
      <MDTypography variant="button" fontWeight="bold" color="text">
        {label}:&nbsp;
      </MDTypography>

      {value != null && value !== '' && ( // Verifica se value não é nulo ou vazio
        <MDTypography variant="button" fontWeight="regular" color={valueColor}>
          {value}
        </MDTypography>
      )}
       {!value && value !== false && !children && ( // Exibe N/A se value for nulo/vazio e não houver children
         <MDTypography variant="button" fontWeight="regular" color={valueColor}>
           N/A
         </MDTypography>
       )}
      {children}
    </MDBox>
  );
}

DetailItem.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  children: PropTypes.node,
  darkMode: PropTypes.bool,
};

// --- MODAL DE DETALHES DA EXCEÇÃO (REFEITO COM O NOVO LAYOUT) ---
const ExceptionDetailsModal = ({ open, onClose, isLoading, details, getDivergenceLabel, darkMode }) => {
  if (!open) return null;

  // Função interna para renderizar os campos de detalhes específicos da divergência
  const renderDivergenceSpecifics = () => {
    if (!details || !details.divergenceDetails) return null;
    const { divergenceCode, divergenceDetails } = details;
    const { rhData, appData, targetSystem } = divergenceDetails;

    switch (divergenceCode) {
      case "CPF_MISMATCH":
        return (
          <>
            <DetailItem icon="badge" label={`CPF no RH`} value={rhData?.cpf} darkMode={darkMode} />
            <DetailItem icon="badge" label={`CPF em ${appData?.sourceSystem}`} value={appData?.cpf} darkMode={darkMode} />
          </>
        );
      case "NAME_MISMATCH":
        return (
          <>
            <DetailItem icon="person" label={`Nome no RH`} value={rhData?.name} darkMode={darkMode} />
            <DetailItem icon="person" label={`Nome em ${appData?.sourceSystem}`} value={appData?.name} darkMode={darkMode} />
          </>
        );
      case "EMAIL_MISMATCH":
        return (
          <>
            <DetailItem icon="email" label={`Email no RH`} value={rhData?.email} darkMode={darkMode} />
            <DetailItem icon="email" label={`Email em ${appData?.sourceSystem}`} value={appData?.email} darkMode={darkMode} />
          </>
        );
      case "ZOMBIE_ACCOUNT":
        return (
          <>
            <DetailItem icon="toggle_off" label={`Status no RH`} value={rhData?.status} darkMode={darkMode} />
            <DetailItem icon="toggle_on" label={`Status em ${appData?.sourceSystem}`} value={appData?.status} darkMode={darkMode} />
          </>
        );
      case "ACCESS_NOT_GRANTED":
        return <DetailItem icon="link_off" label={`Acesso esperado em`} value={targetSystem} darkMode={darkMode} />;
      default:
        // Mantém a estrutura visual mesmo sem detalhes específicos
        return <DetailItem icon="help_outline" label="Detalhes" value="Nenhuma informação adicional." darkMode={darkMode} />;
    }
  };

  return (
    <Modal open={open} onClose={onClose} sx={{ display: "grid", placeItems: "center" }}>
      <Card sx={{ width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Cabeçalho */}
        <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h5">Detalhes da Exceção</MDTypography>
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
        </MDBox>
        
        {/* Corpo */}
        <MDBox p={3} pt={1}>
          {isLoading ? (
            <MDBox display="flex" justifyContent="center" py={5}><CircularProgress color="info" /></MDBox>
          ) : details ? (
            <>
              {/* Seção Superior: Identidade e Divergência */}
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <MDTypography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>Identidade</MDTypography>
                  <DetailItem icon="person_outline" label="Nome" value={details.identity?.name} darkMode={darkMode} />
                  <DetailItem icon="email" label="Email" value={details.identity?.email} darkMode={darkMode} />
                  <DetailItem icon="badge" label="CPF" value={details.identity?.cpf} darkMode={darkMode} />
                  <DetailItem icon="vpn_key" label="ID de Origem" value={details.identity?.identityId} darkMode={darkMode} />
                  <DetailItem icon="computer" label="Sistema Origem" value={details.identity?.sourceSystem} darkMode={darkMode} /> 
                </Grid>

                <Grid item xs={12} md={6}>
                  <MDTypography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>Divergência Ignorada</MDTypography>
                  <DetailItem icon="warning" label="Tipo" value={getDivergenceLabel(details.divergenceCode)} darkMode={darkMode} />
                  {renderDivergenceSpecifics()}
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              {/* Seção Inferior: Detalhes da Exceção */}
              <MDBox>
                <MDTypography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>Detalhes da Exceção</MDTypography>
                <Grid container spacing={3}>
                    {/* Coluna Esquerda Exceção */}
                    <Grid item xs={12} md={6}>
                        <DetailItem icon="how_to_reg" label="Aprovado por" value={details.user?.name} darkMode={darkMode} />
                        <DetailItem icon="event" label="Data" value={details.createdAt ? new Date(details.createdAt).toLocaleString('pt-BR') : ""} darkMode={darkMode} />
                    </Grid>
                    {/* Coluna Direita Exceção */}
                    <Grid item xs={12} md={6}>
                        <DetailItem icon="comment" label="Justificativa" value={details.justification} darkMode={darkMode} />
                    </Grid>
                </Grid>
              </MDBox>
            </>
          ) : (
            <MDTypography>Não foi possível carregar os detalhes.</MDTypography>
          )}
        </MDBox>
      </Card>
    </Modal>
  );
};


function GerenciarExcecoes() {
    const [controller] = useMaterialUIController();
    const { token, darkMode } = controller;
    const [exceptions, setExceptions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ open: false, color: "info", title: "", content: "" });
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [exceptionToDelete, setExceptionToDelete] = useState(null);
    const [exportMenu, setExportMenu] = useState(null);
    const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
    const [detailsModalState, setDetailsModalState] = useState({ isOpen: false, isLoading: false, data: null });

    const divergenceLabels = {
        ACCESS_NOT_GRANTED: "Acesso Previsto Não Concedido",
        ZOMBIE_ACCOUNT: "Acesso Ativo Indevido",
        CPF_MISMATCH: "Divergência de CPF",
        NAME_MISMATCH: "Divergência de Nome",
        EMAIL_MISMATCH: "Divergência de E-mail",
        DORMANT_ADMIN: "Admin Dormente",
        ORPHAN_ACCOUNT: "Conta Órfã",
    };

    const getDivergenceLabel = (code) => divergenceLabels[code] || code;

    const fetchExceptions = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await axios.get('/divergences/exceptions', {
                headers: { "Authorization": `Bearer ${token}` },
            });
            setExceptions(response.data);
        } catch (error) {
            console.error("Erro ao buscar exceções:", error);
            setNotification({ open: true, color: "error", title: "Erro de Rede", content: "Não foi possível carregar as exceções." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchExceptions();
        }
    }, [token]);

    const handleOpenDetailsModal = async (exceptionId) => {
        setDetailsModalState({ isOpen: true, isLoading: true, data: null });
        try {
            const response = await axios.get(`/divergences/exceptions/${exceptionId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDetailsModalState({ isOpen: true, isLoading: false, data: response.data });
        } catch (error) {
            console.error("Erro ao buscar detalhes da exceção:", error);
            setNotification({ open: true, color: "error", title: "Erro", content: "Não foi possível carregar os detalhes da exceção." });
            setDetailsModalState({ isOpen: false, isLoading: false, data: null });
        }
    };

    const handleCloseDetailsModal = () => setDetailsModalState({ isOpen: false, isLoading: false, data: null });

    const handleOpenDeleteDialog = (exception) => {
        setExceptionToDelete(exception);
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setExceptionToDelete(null);
        setDeleteDialogOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!exceptionToDelete) return;
        try {
            await axios.delete(`/divergences/exceptions/${exceptionToDelete.id}`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            setNotification({ open: true, color: "success", title: "Sucesso", content: "Exceção removida. O risco voltará a ser monitorado." });
            fetchExceptions();
        } catch (error) {
            console.error("Erro ao remover exceção:", error);
            setNotification({ open: true, color: "error", title: "Erro", content: "Não foi possível remover a exceção." });
        } finally {
            handleCloseDeleteDialog();
        }
    };

    const handleOpenBulkDeleteDialog = () => {
        if (exceptions.length > 0) {
            setBulkDeleteDialogOpen(true);
        }
    };

    const handleCloseBulkDeleteDialog = () => {
        setBulkDeleteDialogOpen(false);
    };

    const handleConfirmBulkDelete = async () => {
        const exceptionIds = exceptions.map(ex => ex.id);
        if (exceptionIds.length === 0) return;

        try {
            const payload = { exceptionIds };
            await axios.post('/divergences/exceptions/bulk-delete', payload, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            setNotification({ open: true, color: "success", title: "Sucesso", content: "Todas as exceções foram removidas com sucesso." });
            fetchExceptions();
        } catch (error) {
            console.error("Erro ao remover todas as exceções:", error);
            setNotification({ open: true, color: "error", title: "Erro", content: "Não foi possível remover todas as exceções." });
        } finally {
            handleCloseBulkDeleteDialog();
        }
    };

    const closeNotification = () => setNotification({ ...notification, open: false });
    const openExportMenu = (event) => setExportMenu(event.currentTarget);
    const closeExportMenu = () => setExportMenu(null);

    const handleExportCsv = () => {
        closeExportMenu();
        let csvContent = "data:text/csv;charset=utf-8,";
        const headers = ["Identidade_Nome", "Identidade_Email", "Sistema", "Tipo_Divergencia", "Justificativa", "Aprovado_Por", "Data"];
        csvContent += headers.join(",") + "\r\n";

        exceptions.forEach(ex => {
            const row = [
                `"${ex.identity?.name || "N/A"}"`,
                `"${ex.identity?.email || "N/A"}"`,
                `"${ex.identity?.sourceSystem || ex.targetSystem || "N/A"}"`,
                `"${getDivergenceLabel(ex.divergenceCode)}"`,
                `"${ex.justification.replace(/"/g, '""')}"`,
                `"${ex.user?.name || "N/A"}"`,
                `"${new Date(ex.createdAt).toLocaleDateString('pt-BR')}"`,
            ];
            csvContent += row.join(",") + "\r\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "relatorio_excecoes.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleExportPdf = () => {
        closeExportMenu();
        const doc = new jsPDF();
        const tableColumns = ["Identidade", "Sistema", "Tipo", "Aprovado Por", "Data"];
        const tableRows = [];

        exceptions.forEach(ex => {
            const row = [
                `${ex.identity?.name || "N/A"} (${ex.identity?.email || "N/A"})`,
                ex.identity?.sourceSystem || ex.targetSystem || "N/A",
                getDivergenceLabel(ex.divergenceCode),
                ex.user?.name || "N/A",
                new Date(ex.createdAt).toLocaleDateString('pt-BR')
            ];
            tableRows.push(row);
        });

        doc.text("Relatório de Exceções de Divergência", 14, 15);
        autoTable(doc, { head: [tableColumns], body: tableRows, startY: 20 });
        doc.save("relatorio_excecoes.pdf");
    };

    const columns = useMemo(() => [
        {
            Header: "Identidade",
            accessor: "identity.name",
            width: "25%",
            align: "left",
            Cell: ({ row: { original: ex } }) => (
                <MDBox 
                    lineHeight={1} 
                    onClick={() => handleOpenDetailsModal(ex.id)} 
                    sx={{ cursor: "pointer", "&:hover > .MuiTypography-button": { textDecoration: "underline" } }}
                >
                    <MDTypography display="block" variant="button" fontWeight="medium">{ex.identity?.name || "N/A"}</MDTypography>
                    <MDTypography variant="caption">{ex.identity?.email} ({ex.identity?.sourceSystem || ex.targetSystem})</MDTypography>
                </MDBox>
            ),
        },
        { Header: "Tipo de Divergência", accessor: "divergenceCode", align: "center", Cell: ({ value }) => <MDTypography variant="caption" fontWeight="medium">{getDivergenceLabel(value)}</MDTypography> },
        { Header: "Justificativa", accessor: "justification", align: "left", Cell: ({ value }) => <MDTypography variant="caption" sx={{ whiteSpace: "pre-wrap" }}>{value}</MDTypography> },
        { Header: "Aprovado Por", accessor: "user.name", align: "center", Cell: ({ value }) => <MDTypography variant="caption">{value || "N/A"}</MDTypography> },
        { Header: "Data", accessor: "createdAt", align: "center", Cell: ({ value }) => <MDTypography variant="caption">{new Date(value).toLocaleDateString('pt-BR')}</MDTypography> },
        { 
            Header: "Ações", 
            accessor: "actions", 
            align: "center",
            disableSortBy: true,
            Cell: ({ row: { original: ex } }) => (
                <MDButton variant="text" color="error" onClick={() => handleOpenDeleteDialog(ex)}>
                    <Icon>delete_forever</Icon>&nbsp;Reativar
                </MDButton>
            )
        },
    ], [exceptions]); // Dependência de 'exceptions' adicionada

    const rows = useMemo(() => exceptions, [exceptions]);

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <MDBox pt={6} pb={3}>
                <Grid container spacing={6}>
                    <Grid item xs={12}>
                        <Card>
                            <MDBox
                                mx={2} mt={-3} py={3} px={2}
                                variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info"
                                display="flex" justifyContent="space-between" alignItems="center"
                            >
                                <MDTypography variant="h6" color="white">
                                    Gerenciamento de Exceções
                                </MDTypography>
                                <MDBox>
                                    <MDButton
                                        variant="gradient"
                                        color="error"
                                        onClick={handleOpenBulkDeleteDialog}
                                        disabled={exceptions.length === 0 || isLoading}
                                        sx={{ mr: 1 }}
                                    >
                                        <Icon>delete_sweep</Icon>&nbsp;Reativar Todas
                                    </MDButton>
                                    <MDButton variant="gradient" color="dark" onClick={openExportMenu}>
                                        <Icon>download</Icon>
                                        &nbsp;Exportar Relatório
                                    </MDButton>
                                </MDBox>
                            </MDBox>
                            <MDBox pt={3}>
                                <DataTable
                                    table={{ columns, rows }}
                                    isSorted={false}
                                    entriesPerPage={{ defaultValue: 10, entries: [10, 25, 50] }}
                                    showTotalEntries
                                    noEndBorder
                                    canSearch
                                    isLoading={isLoading}
                                />
                            </MDBox>
                        </Card>
                    </Grid>
                </Grid>
            </MDBox>
            
            <ExceptionDetailsModal 
                open={detailsModalState.isOpen}
                onClose={handleCloseDetailsModal}
                isLoading={detailsModalState.isLoading}
                details={detailsModalState.data}
                getDivergenceLabel={getDivergenceLabel}
                darkMode={darkMode}
            />

            <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
                <DialogTitle>Reativar Risco</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Você tem certeza que deseja reativar o risco para a divergência em "<strong>{exceptionToDelete?.identity?.name}</strong>"?
                        <br/><br/>
                        Isso removerá a exceção e a divergência voltará a ser exibida nos painéis.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <MDButton onClick={handleCloseDeleteDialog} color="secondary">Cancelar</MDButton>
                    <MDButton onClick={handleConfirmDelete} color="error">Confirmar</MDButton>
                </DialogActions>
            </Dialog>
            
            <Dialog open={bulkDeleteDialogOpen} onClose={handleCloseBulkDeleteDialog}>
                <DialogTitle>Reativar Todos os Riscos</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Você tem certeza que deseja reativar <strong>TODAS as {exceptions.length}</strong> exceções listadas?
                        <br/><br/>
                        Esta ação não pode ser desfeita e todas as divergências voltarão a ser exibidas nos painéis.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <MDButton onClick={handleCloseBulkDeleteDialog} color="secondary">Cancelar</MDButton>
                    <MDButton onClick={handleConfirmBulkDelete} color="error">Confirmar e Reativar</MDButton>
                </DialogActions>
            </Dialog>
            
            <MDSnackbar
                color={notification.color} icon="notifications" title={notification.title}
                content={notification.content} dateTime="agora" open={notification.open}
                onClose={closeNotification} close={closeNotification}
            />

            <Menu
                anchorEl={exportMenu}
                open={Boolean(exportMenu)}
                onClose={closeExportMenu}
            >
                <MenuItem onClick={handleExportCsv}>
                    <Icon>description</Icon>&nbsp; Exportar como CSV
                </MenuItem>
                <MenuItem onClick={handleExportPdf}>
                    <Icon>picture_as_pdf</Icon>&nbsp; Exportar como PDF
                </MenuItem>
            </Menu>
        </DashboardLayout>
    );
}

export default GerenciarExcecoes;