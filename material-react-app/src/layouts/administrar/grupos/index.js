// src/layouts/administrar/grupos/index.js

import { useState, useEffect } from "react";
import axios from "axios";

import AddGroupModal from "./components/AddGroupModal";
import EditGroupModal from "./components/EditGroupModal";
import ViewMembersModal from "./components/ViewMembersModal";

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
    const formattedData = groupsTableData(
      groups,
      handleViewClick,
      handleEditClick,
      handleDeleteClick
    );
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

  const handleViewClick = (group) => {
    setSelectedGroup(group);
    setIsViewModalOpen(true);
  };
  const handleCloseViewModal = () => {
    setSelectedGroup(null);
    setIsViewModalOpen(false);
  };

  const handleCreateGroup = async (newGroupData) => {
    try {
      await api.post("/groups", newGroupData);
      setNotification({ show: true, color: "success", message: "Grupo criado com sucesso!" });
      fetchGroups();
    } catch (error) {
      const message = error.response?.data?.message || "Erro ao criar o grupo.";
      setNotification({ show: true, color: "error", message });
    }
  };

  // --- FUNÇÃO DE ATUALIZAÇÃO (COM DEBUG) ---
  const handleUpdateGroup = async (groupId, updatedData) => {
    try {
      await api.patch(`/groups/${groupId}`, updatedData);
      setNotification({ show: true, color: "success", message: "Grupo atualizado com sucesso!" });
      fetchGroups();
    } catch (error) {
      console.error("Erro ao salvar grupo:", error);
      const message = error.response?.data?.message || "Erro ao atualizar o grupo.";
      setNotification({ show: true, color: "error", message });
    }
  };

  const handleDeleteClick = async (groupId) => {
    if (window.confirm("Tem certeza que deseja deletar este grupo?")) {
      try {
        await api.delete(`/groups/${groupId}`);
        setNotification({ show: true, color: "success", message: "Grupo deletado com sucesso!" });
        fetchGroups();
      } catch (error) {
        const message = error.response?.data?.message || "Erro ao deletar o grupo.";
        setNotification({ show: true, color: "error", message });
      }
    }
  };

  return (
    <AdminPageLayout
      title="Gerenciamento de Grupos"
      buttonText="Adicionar Grupo"
      onButtonClick={handleAddGroupClick}
    >
      <MDBox mt={2} mb={2}>
        {notification.show && (
          <MDAlert
            color={notification.color}
            dismissible
            onClose={() => setNotification({ ...notification, show: false })}
          >
            <MDTypography variant="body2" color="white">
              {notification.message}
            </MDTypography>
          </MDAlert>
        )}
      </MDBox>

      {loading ? (
        <MDTypography variant="body2" textAlign="center">
          Carregando grupos...
        </MDTypography>
      ) : (
        <DataTable
          table={tableData}
          isSorted={false}
          entriesPerPage={false}
          showTotalEntries={false}
          noEndBorder
        />
      )}

      <AddGroupModal open={isAddModalOpen} onClose={handleCloseAddModal} onSave={handleCreateGroup} />

      <EditGroupModal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        onSave={handleUpdateGroup}
        group={selectedGroup}
      />

      <ViewMembersModal
        open={isViewModalOpen}
        onClose={handleCloseViewModal}
        group={selectedGroup}
      />
    </AdminPageLayout>
  );
}

export default GerenciarGrupos;