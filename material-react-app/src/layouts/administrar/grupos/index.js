// src/layouts/administrar/grupos/index.js

import { useState, useEffect } from "react";
import axios from "axios";

import AddGroupModal from "./components/AddGroupModal";
import EditGroupModal from "./components/EditGroupModal";
import ViewMembersModal from "./components/ViewMembersModal"; // 1. Importa o novo modal

import AdminPageLayout from "layouts/administrar/components/AdminPageLayout";
import DataTable from "examples/Tables/DataTable";
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";
import MDAlert from "components/MDAlert";
import groupsTableData from "./data/groupsTableData";

function GerenciarGrupos() {
  const [groups, setGroups] = useState([]);
  const [tableData, setTableData] = useState({ columns: [], rows: [] });
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, color: "info", message: "" });
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  // --- 2. Novos estados para o modal de visualização ---
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const api = axios.create({
    baseURL: "/",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await api.get("/groups");
      setGroups(response.data);
    } catch (error) {
      console.error("Erro ao buscar grupos:", error);
      setNotification({ show: true, color: "error", message: "Erro ao carregar grupos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    // --- 3. Passa a nova função 'handleViewClick' para a tabela ---
    const formattedData = groupsTableData(groups, handleViewClick, handleEditClick, handleDeleteClick);
    setTableData(formattedData);
  }, [groups]);

  const handleAddGroupClick = () => setIsAddModalOpen(true);
  const handleCloseAddModal = () => setIsAddModalOpen(false);
  
  const handleEditClick = (group) => {
    setSelectedGroup(group);
    setIsEditModalOpen(true);
  };
  const handleCloseEditModal = () => {
    setSelectedGroup(null);
    setIsEditModalOpen(false);
  };

  // --- 4. Novas funções para controlar o modal de visualização ---
  const handleViewClick = (group) => {
    setSelectedGroup(group);
    setIsViewModalOpen(true);
  };
  const handleCloseViewModal = () => {
    setSelectedGroup(null);
    setIsViewModalOpen(false);
  };
  
  const handleCreateGroup = async (newGroupData) => { /* ... (sem alterações) ... */ };
  const handleUpdateGroup = async (groupId, updatedData) => { /* ... (sem alterações) ... */ };
  const handleDeleteClick = async (groupId) => { /* ... (sem alterações) ... */ };

  return (
    <AdminPageLayout
      title="Gerenciamento de Grupos"
      buttonText="Adicionar Grupo"
      onButtonClick={handleAddGroupClick}
    >
      <MDBox mt={2} mb={2}>
        {/* ... (notificações sem alterações) ... */}
      </MDBox>
      
      {loading ? (
        <MDTypography variant="body2" textAlign="center">Carregando grupos...</MDTypography>
      ) : (
        <DataTable table={tableData} isSorted={false} entriesPerPage={false} showTotalEntries={false} noEndBorder />
      )}
      
      <AddGroupModal
        open={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleCreateGroup}
      />

      <EditGroupModal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleUpdateGroup}
        group={selectedGroup}
      />
      
      {/* --- 5. Renderiza o novo modal de visualização --- */}
      <ViewMembersModal
        open={isViewModalOpen}
        onClose={handleCloseViewModal}
        group={selectedGroup}
      />

    </AdminPageLayout>
  );
}

export default GerenciarGrupos;