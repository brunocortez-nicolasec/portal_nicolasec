// material-react-app/src/layouts/observabilidade/sistemas/index.js

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
import DialogTitle from "@mui/material/DialogTitle";
import DialogContentText from "@mui/material/DialogContentText";
import Tooltip from "@mui/material/Tooltip";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";
import MDBadge from "components/MDBadge";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

// --- Importações dos Modais ---
import DataSourceModal from "./components/DataSourceModal";
import DataSourceViewModal from "./components/DataSourceViewModal";
import SystemProfilesModal from "./components/SystemProfilesModal";

const rhSystem = {
  id: 'rh',
  name: 'RH',
  description: 'Fonte de dados padrão do RH.',
  type: 'Padrão',
  status: 'Ativo',
  lastSync: null,
  connectionDetails: null,
};

function GerenciarDataSources() {
    const [controller] = useMaterialUIController();
    const { token, darkMode } = controller;

    const [systems, setSystems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ open: false, color: "info", title: "", content: "" });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [systemToDelete, setSystemToDelete] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDataSource, setEditingDataSource] = useState(null);

    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [dataSourceToView, setDataSourceToView] = useState(null);

    const [isProfilesModalOpen, setIsProfilesModalOpen] = useState(false);
    const [systemForProfiles, setSystemForProfiles] = useState(null);


    const fetchSystems = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await axios.get('/systems', {
                headers: { "Authorization": `Bearer ${token}` },
            });
            const combinedSystems = [rhSystem, ...response.data];
            setSystems(combinedSystems);
        } catch (error) {
            console.error("Erro ao buscar fontes de dados:", error);
            setSystems([rhSystem]);
            setNotification({ open: true, color: "error", title: "Erro de Rede", content: "Não foi possível carregar as fontes de dados da API." });
        } finally {
            setIsLoading(false);
        }
    };


    useEffect(() => {
        if (token) {
            fetchSystems();
        } else {
           setSystems([rhSystem]);
           setIsLoading(false);
        }
    }, [token]);

    const handleOpenModal = () => {
        setEditingDataSource(null);
        setIsModalOpen(true);
    };
    const handleEditClick = (dataSource) => {
        if (dataSource.id === 'rh') {
            setNotification({ open: true, color: "warning", title: "Ação Inválida", content: "A fonte de dados RH não pode ser editada." });
            return;
        }
        setEditingDataSource(dataSource);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDataSource(null);
    };
    const handleViewClick = (dataSource) => {
        setDataSourceToView(dataSource);
        setIsViewModalOpen(true);
    };
    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setDataSourceToView(null);
    };
    const handleSaveDataSource = async (formData) => {
        try {
            const headers = { "Authorization": `Bearer ${token}` };
            let action = "criada";
            let response;

            if (formData.id) {
                action = "atualizada";
                response = await axios.patch(`/systems/${formData.id}`, formData, { headers });
            } else {
                response = await axios.post('/systems', formData, { headers });
            }

            setNotification({
                open: true,
                color: "success",
                title: "Sucesso",
                content: `Fonte de dados "${response.data.name}" ${action} com sucesso!`
            });

            handleCloseModal();
            fetchSystems();

        } catch (error) {
            console.error("Erro ao salvar fonte de dados:", error);
            const errorMessage = error.response?.data?.message || "Ocorreu um erro inesperado.";
            setNotification({
                open: true,
                color: "error",
                title: "Erro ao Salvar",
                content: errorMessage
            });
        }
    };
    const handleOpenDeleteDialog = (system) => {
        if (system.id === 'rh') {
            setNotification({ open: true, color: "warning", title: "Ação Inválida", content: "A fonte de dados RH não pode ser excluída." });
            return;
        }
        setSystemToDelete(system);
        setIsDeleteDialogOpen(true);
    };
    const handleCloseDeleteDialog = () => {
        setSystemToDelete(null);
        setIsDeleteDialogOpen(false);
    };
    const handleConfirmDelete = async () => {
        if (!systemToDelete || systemToDelete.id === 'rh') return;
        try {
            await axios.delete(`/systems/${systemToDelete.id}`, {
                headers: { "Authorization": `Bearer ${token}` },
            });
            setNotification({ open: true, color: "success", title: "Sucesso", content: `Fonte de dados "${systemToDelete.name}" excluída.` });
            handleCloseDeleteDialog();
            fetchSystems();
        } catch (error) {
            console.error("Erro ao excluir fonte de dados:", error);
            const errorMessage = error.response?.data?.message || "Não foi possível excluir a fonte de dados.";
            setNotification({ open: true, color: "error", title: "Erro", content: errorMessage });
            handleCloseDeleteDialog();
        }
    };
    const closeNotification = () => setNotification({ ...notification, open: false });

    const handleOpenProfilesModal = (system) => {
      setSystemForProfiles(system);
      setIsProfilesModalOpen(true);
    };

    const handleCloseProfilesModal = () => {
      setSystemForProfiles(null);
      setIsProfilesModalOpen(false);
    };

    const columns = useMemo(() => [
        {
            Header: "Nome da Fonte",
            accessor: "name",
            Cell: ({ value }) => <MDTypography variant="caption" fontWeight="medium">{value}</MDTypography>
        },
        {
            Header: "Tipo",
            accessor: "type",
            align: "center",
            Cell: ({ value }) => <MDTypography variant="caption">{value || "N/A"}</MDTypography>
        },
        {
            Header: "Status",
            accessor: "status",
            align: "center",
            Cell: ({ value }) => (
                <MDBadge badgeContent={value || "Ativo"} color={value === "Inativo" ? "error" : "success"} variant="gradient" size="sm" />
            )
        },
        {
            Header: "Última Sincronização",
            accessor: "lastSync",
            align: "center",
            Cell: ({ value }) => <MDTypography variant="caption">{value ? new Date(value).toLocaleString('pt-BR') : "N/A"}</MDTypography>
        },
        {
            Header: "Ações",
            accessor: "actions",
            align: "center",
            disableSortBy: true,
            Cell: ({ row: { original: dataSource } }) => {
                const isRh = dataSource.id === 'rh';
                return (
                    // --- INÍCIO DA MODIFICAÇÃO: Habilitar botão 'people' para RH ---
                    <MDBox display="flex" justifyContent="center" alignItems="center" sx={{ gap: 1 }}>
                        {/* Botão Visualizar */}
                        <Tooltip title="Visualizar Detalhes">
                           <MDTypography component="a" color="text" sx={{ cursor: "pointer" }} onClick={() => handleViewClick(dataSource)}>
                               <Icon fontSize="small">visibility</Icon>
                           </MDTypography>
                        </Tooltip>

                        {/* Botão Listar Identidades (AGORA HABILITADO PARA RH) */}
                        <Tooltip title={"Listar Identidades Associadas"}> {/* Tooltip simplificado */}
                             {/* Removemos o span e a lógica condicional daqui */}
                             <MDTypography component="a" color="dark" sx={{ cursor: 'pointer' }} onClick={() => handleOpenProfilesModal(dataSource)}> {/* onClick direto, cor padrão */}
                                 <Icon fontSize="small">people</Icon>
                             </MDTypography>
                        </Tooltip>

                        {/* Botão Editar (ainda desabilitado para RH) */}
                        <Tooltip title={isRh ? "RH não pode ser editado" : "Editar"}>
                          <span style={{ cursor: isRh ? 'not-allowed': 'pointer' }}>
                             <MDTypography component="a" color={isRh ? "secondary" : "info"} sx={{ cursor: isRh ? 'not-allowed': 'pointer', opacity: isRh ? 0.5 : 1 }} onClick={() => !isRh && handleEditClick(dataSource)}>
                                <Icon fontSize="small">edit</Icon>
                             </MDTypography>
                          </span>
                        </Tooltip>

                         {/* Botão Deletar (ainda desabilitado para RH) */}
                         <Tooltip title={isRh ? "RH não pode ser excluído" : "Excluir"}>
                           <span style={{ cursor: isRh ? 'not-allowed': 'pointer' }}>
                             <MDTypography component="a" color={isRh ? "secondary" : "error"} sx={{ cursor: isRh ? 'not-allowed': 'pointer', opacity: isRh ? 0.5 : 1 }} onClick={() => !isRh && handleOpenDeleteDialog(dataSource)}>
                                 <Icon fontSize="small">delete</Icon>
                             </MDTypography>
                           </span>
                         </Tooltip>
                    </MDBox>
                    // --- FIM DA MODIFICAÇÃO ---
                );
            }
        },
    ], [systems]);

    const rows = useMemo(() => systems.map(system => ({
      ...system,
    })), [systems]);


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
                                    Gerenciamento de Fontes de Dados
                                </MDTypography>
                                <MDButton variant="gradient" color="dark" onClick={handleOpenModal}>
                                    <Icon sx={{ fontWeight: "bold" }}>add</Icon>
                                    &nbsp;Adicionar Fonte de Dados
                                </MDButton>
                            </MDBox>
                            <MDBox pt={3}>
                                <DataTable
                                    table={{ columns, rows }}
                                    isSorted={true}
                                    entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
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

            {/* Modal de Edição/Criação */}
            {isModalOpen && (
              <DataSourceModal
                open={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveDataSource}
                initialData={editingDataSource}
                darkMode={darkMode}
              />
            )}

            {/* Modal de Visualização */}
            {isViewModalOpen && (
              <DataSourceViewModal
                open={isViewModalOpen}
                onClose={handleCloseViewModal}
                dataSource={dataSourceToView}
                darkMode={darkMode}
              />
            )}

            {/* Modal de Perfis/Identidades */}
            {isProfilesModalOpen && (
              <SystemProfilesModal
                open={isProfilesModalOpen}
                onClose={handleCloseProfilesModal}
                system={systemForProfiles}
              />
            )}

            {/* Dialog de Exclusão */}
            <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
                 <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Você tem certeza que deseja excluir a fonte de dados "<strong>{systemToDelete?.name}</strong>"? Esta ação não pode ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <MDButton onClick={handleCloseDeleteDialog} color="secondary">
                        Cancelar
                    </MDButton>
                    <MDButton onClick={handleConfirmDelete} color="error" variant="gradient">
                        Excluir
                    </MDButton>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <MDSnackbar
                color={notification.color}
                icon="notifications"
                title={notification.title}
                content={notification.content}
                dateTime="agora"
                open={notification.open}
                onClose={closeNotification}
                close={closeNotification}
            />

        </DashboardLayout>
    );
}

export default GerenciarDataSources;