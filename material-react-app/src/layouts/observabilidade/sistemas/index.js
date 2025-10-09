// material-react-app/src/layouts/observabilidade/sistemas/index.js

import { useState, useEffect } from "react";
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
import MDInput from "components/MDInput";

// Material Dashboard 2 React example components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";


function GerenciarSistemas() {
  const [controller] = useMaterialUIController();
  const { token } = controller;
  
  const [systems, setSystems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ open: false, color: "info", title: "", content: "" });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSystemData, setNewSystemData] = useState({ name: "", description: "" });
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [systemToDelete, setSystemToDelete] = useState(null);

  // --- 1. ADICIONAR ESTADOS PARA O MODAL DE EDIÇÃO ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [systemToEdit, setSystemToEdit] = useState(null);


  const fetchSystems = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const response = await axios.get('/systems', {
        headers: { "Authorization": `Bearer ${token}` },
      });
      setSystems(response.data);
    } catch (error) {
      console.error("Erro ao buscar sistemas:", error);
      setNotification({ open: true, color: "error", title: "Erro de Rede", content: "Não foi possível carregar a lista de sistemas." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSystems();
    }
  }, [token]);

  const handleOpenAddModal = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setNewSystemData({ name: "", description: "" });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setNewSystemData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!newSystemData.name) {
      setNotification({ open: true, color: "warning", title: "Atenção", content: "O nome do sistema é obrigatório." });
      return;
    }

    try {
      await axios.post('/systems', newSystemData, {
        headers: { "Authorization": `Bearer ${token}` },
      });
      
      setNotification({ open: true, color: "success", title: "Sucesso", content: `Sistema "${newSystemData.name}" criado com sucesso!` });
      handleCloseAddModal();
      fetchSystems();
    } catch (error) {
      console.error("Erro ao criar sistema:", error);
      const errorMessage = error.response?.data?.message || "Não foi possível criar o sistema.";
      setNotification({ open: true, color: "error", title: "Erro", content: errorMessage });
    }
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

      setNotification({ open: true, color: "success", title: "Sucesso", content: `Sistema "${systemToDelete.name}" excluído.` });
      handleCloseDeleteDialog();
      fetchSystems();
    } catch (error) {
      console.error("Erro ao excluir sistema:", error);
      const errorMessage = error.response?.data?.message || "Não foi possível excluir o sistema.";
      setNotification({ open: true, color: "error", title: "Erro", content: errorMessage });
      handleCloseDeleteDialog();
    }
  };

  // --- 2. ADICIONAR FUNÇÕES PARA CONTROLAR A EDIÇÃO ---
  const handleOpenEditModal = (system) => {
    setSystemToEdit(system);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSystemToEdit(null);
    setIsEditModalOpen(false);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setSystemToEdit(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateSubmit = async () => {
    if (!systemToEdit || !systemToEdit.name) {
      setNotification({ open: true, color: "warning", title: "Atenção", content: "O nome do sistema é obrigatório." });
      return;
    }

    try {
      await axios.patch(`/systems/${systemToEdit.id}`, {
        name: systemToEdit.name,
        description: systemToEdit.description,
      }, {
        headers: { "Authorization": `Bearer ${token}` },
      });

      setNotification({ open: true, color: "success", title: "Sucesso", content: `Sistema "${systemToEdit.name}" atualizado.` });
      handleCloseEditModal();
      fetchSystems();
    } catch (error) {
      console.error("Erro ao atualizar sistema:", error);
      const errorMessage = error.response?.data?.message || "Não foi possível atualizar o sistema.";
      setNotification({ open: true, color: "error", title: "Erro", content: errorMessage });
    }
  };


  const closeNotification = () => setNotification({ ...notification, open: false });

  const { columns, rows } = {
    columns: [
      { Header: "Nome do Sistema", accessor: "name", width: "30%", align: "left" },
      { Header: "Descrição", accessor: "description", align: "left" },
      { Header: "Data de Criação", accessor: "createdAt", align: "center" },
      { Header: "Ações", accessor: "actions", align: "center" },
    ],
    // --- 3. ATUALIZAR O onClick DO ÍCONE DE EDIÇÃO ---
    rows: systems.map(system => ({
      name: <MDTypography variant="subtitle2" fontWeight="medium">{system.name}</MDTypography>,
      description: <MDTypography variant="caption">{system.description || "N/A"}</MDTypography>,
      createdAt: <MDTypography variant="caption">{new Date(system.createdAt).toLocaleDateString('pt-BR')}</MDTypography>,
      actions: (
        <MDBox display="flex" justifyContent="center" alignItems="center" sx={{ gap: 2 }}>
          <MDTypography component="a" color="info" sx={{ cursor: "pointer" }} onClick={() => handleOpenEditModal(system)}>
            <Icon>edit</Icon>
          </MDTypography>
          <MDTypography component="a" color="error" sx={{ cursor: "pointer" }} onClick={() => handleOpenDeleteDialog(system)}>
            <Icon>delete</Icon>
          </MDTypography>
        </MDBox>
      )
    }))
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  Gerenciamento de Sistemas (Data Sources)
                </MDTypography>
                <MDButton variant="gradient" color="dark" onClick={handleOpenAddModal}>
                  <Icon sx={{ fontWeight: "bold" }}>add</Icon>
                  &nbsp;Adicionar Sistema
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

      {/* Modal de Adicionar */}
      <Dialog open={isAddModalOpen} onClose={handleCloseAddModal} fullWidth maxWidth="sm">
        <DialogTitle>Adicionar Novo Sistema</DialogTitle>
        <DialogContent>
          <MDBox component="form" role="form" pt={2}>
            <MDBox mb={2}>
              <MDInput
                name="name"
                label="Nome do Sistema"
                value={newSystemData.name}
                onChange={handleFormChange}
                fullWidth
                autoFocus
              />
            </MDBox>
            <MDBox>
              <MDInput
                name="description"
                label="Descrição (Opcional)"
                value={newSystemData.description}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={4}
              />
            </MDBox>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseAddModal} color="secondary">
            Cancelar
          </MDButton>
          <MDButton onClick={handleSubmit} color="info" variant="gradient">
            Salvar
          </MDButton>
        </DialogActions>
      </Dialog>
      
      {/* Modal de Excluir */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você tem certeza que deseja excluir o sistema "<strong>{systemToDelete?.name}</strong>"? Esta ação não pode ser desfeita.
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

      {/* --- 4. ADICIONAR O MODAL DE EDIÇÃO --- */}
      <Dialog open={isEditModalOpen} onClose={handleCloseEditModal} fullWidth maxWidth="sm">
        <DialogTitle>Editar Sistema</DialogTitle>
        <DialogContent>
          <MDBox component="form" role="form" pt={2}>
            <MDBox mb={2}>
              <MDInput
                name="name"
                label="Nome do Sistema"
                value={systemToEdit?.name || ""}
                onChange={handleEditFormChange}
                fullWidth
                autoFocus
              />
            </MDBox>
            <MDBox>
              <MDInput
                name="description"
                label="Descrição (Opcional)"
                value={systemToEdit?.description || ""}
                onChange={handleEditFormChange}
                fullWidth
                multiline
                rows={4}
              />
            </MDBox>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseEditModal} color="secondary">
            Cancelar
          </MDButton>
          <MDButton onClick={handleUpdateSubmit} color="info" variant="gradient">
            Salvar Alterações
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

export default GerenciarSistemas;