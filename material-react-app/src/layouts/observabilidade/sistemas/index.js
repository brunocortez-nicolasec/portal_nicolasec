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

// Componente do novo modal dinâmico
import DataSourceModal from "./components/DataSourceModal";

function GerenciarDataSources() {
    // ======================= INÍCIO DA ALTERAÇÃO 1 =======================
    const [controller] = useMaterialUIController();
    const { token, darkMode } = controller; // Adicionado 'darkMode'
    // ======================== FIM DA ALTERAÇÃO 1 =========================
    
    const [systems, setSystems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [notification, setNotification] = useState({ open: false, color: "info", title: "", content: "" });
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [systemToDelete, setSystemToDelete] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDataSource, setEditingDataSource] = useState(null);

    const fetchSystems = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await axios.get('/systems', {
                headers: { "Authorization": `Bearer ${token}` },
            });
            setSystems(response.data);
        } catch (error) {
            console.error("Erro ao buscar fontes de dados:", error);
            setNotification({ open: true, color: "error", title: "Erro de Rede", content: "Não foi possível carregar as fontes de dados." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchSystems();
        }
    }, [token]);

    const handleOpenModal = () => {
      setEditingDataSource(null);
      setIsModalOpen(true);
    };

    const handleEditClick = (dataSource) => {
      setEditingDataSource(dataSource);
      setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingDataSource(null);
    };

    const handleSaveDataSource = (formData) => {
        console.log("Salvando Fonte de Dados:", formData);
        const action = formData.id ? "atualizada" : "criada";
        setNotification({ open: true, color: "success", title: "Sucesso", content: `Fonte de dados "${formData.name}" ${action} com sucesso!` });
        handleCloseModal();
        fetchSystems();
    };

    const handleOpenDeleteDialog = (system) => {
        setSystemToDelete(system);
        setIsDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setSystemToDelete(null);
        setIsDeleteDialogOpen(false);
    };

    const handleConfirmDelete = async () => {
        if (!systemToDelete) return;
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

    const columns = useMemo(() => [
        { 
            Header: "Nome da Fonte", 
            accessor: "name",
            Cell: ({ value }) => <MDTypography variant="h8" fontWeight="medium">{value}</MDTypography>
        },
        { 
            Header: "Tipo", 
            accessor: "type",
            align: "center",
            Cell: ({ value }) => <MDTypography variant="caption">{value || "CSV"}</MDTypography>
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
            Cell: ({ row: { original: dataSource } }) => (
                <MDBox display="flex" justifyContent="center" alignItems="center" sx={{ gap: 2 }}>
                    <MDTypography component="a" color="info" sx={{ cursor: "pointer" }} onClick={() => handleEditClick(dataSource)}>
                        <Icon>edit</Icon>
                    </MDTypography>
                    <MDTypography component="a" color="error" sx={{ cursor: "pointer" }} onClick={() => handleOpenDeleteDialog(dataSource)}>
                        <Icon>delete</Icon>
                    </MDTypography>
                </MDBox>
            )
        },
    ], []);

    const rows = useMemo(() => systems, [systems]);

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
                                    isSorted={false}
                                    entriesPerPage={{ defaultValue: 10 }}
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

            {/* ======================= INÍCIO DA ALTERAÇÃO 2 ======================= */}
            {isModalOpen && (
              <DataSourceModal
                open={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveDataSource}
                initialData={editingDataSource}
                darkMode={darkMode} 
              />
            )}
            {/* ======================== FIM DA ALTERAÇÃO 2 ========================= */}
            
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