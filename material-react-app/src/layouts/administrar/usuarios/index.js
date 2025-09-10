import { useState, useEffect } from "react";
import axios from "axios";

// --- NOVOS IMPORTS ---
import MDAlert from "components/MDAlert";
import EditUserModal from "./components/EditUserModal"; // O modal de edição

// Componentes do template (sem alterações)
import AdminPageLayout from "layouts/administrar/components/AdminPageLayout";
import DataTable from "examples/Tables/DataTable";
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";

// Importa a função que formata os dados para a tabela (sem alterações)
import usersTableData from "./data/usersTableData";

function GerenciarUsuarios() {
  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState({ show: false, color: "info", message: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [tableData, setTableData] = useState({ columns: [], rows: [] });
  const [loading, setLoading] = useState(true);

  // --- MUDANÇA NECESSÁRIA AQUI ---
  // A URL base agora é relativa ("/"), fazendo com que as chamadas vão para o Nginx.
  const api = axios.create({
    baseURL: "/", 
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      setNotification({ show: true, color: "error", message: "Erro ao carregar usuários." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const formattedData = usersTableData(users, handleEditClick, handleDeleteClick);
    setTableData(formattedData);
  }, [users]);

  // Funções de Ação (sem alterações)
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const handleSaveUser = async (id, updatedData) => {
    try {
      await api.patch(`/users/${id}`, updatedData);
      setNotification({ show: true, color: "success", message: "Usuário atualizado com sucesso!" });
      fetchUsers();
    } catch (error) {
      setNotification({ show: true, color: "error", message: "Erro ao salvar alterações." });
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Tem certeza que deseja deletar este usuário? Esta ação é irreversível.")) {
      try {
        await api.delete(`/users/${id}`);
        setNotification({ show: true, color: "success", message: "Usuário deletado com sucesso!" });
        fetchUsers();
      } catch (error) {
        const message = error.response?.data?.message || "Erro ao deletar o usuário.";
        setNotification({ show: true, color: "error", message });
      }
    }
  };

  const handleAddUser = () => {
    alert("Função 'Adicionar Novo Usuário' a ser implementada.");
  };

  return (
    <AdminPageLayout
      title="Gerenciamento de Usuários"
      buttonText="Adicionar Usuário"
      onButtonClick={handleAddUser}
    >
      <MDBox mt={2} mb={2}>
        {notification.show && (
          <MDAlert color={notification.color} dismissible onClose={() => setNotification({ ...notification, show: false })}>
            <MDTypography variant="body2" color="white">
              {notification.message}
            </MDTypography>
          </MDAlert>
        )}
      </MDBox>
      
      {loading ? (
        <MDTypography variant="body2" textAlign="center">Carregando usuários...</MDTypography>
      ) : (
        <DataTable table={tableData} isSorted={false} entriesPerPage={false} showTotalEntries={false} noEndBorder />
      )}

      {selectedUser && (
        <EditUserModal
          open={isModalOpen}
          onClose={handleCloseModal}
          user={selectedUser}
          onSave={handleSaveUser}
        />
      )}
    </AdminPageLayout>
  );
}

export default GerenciarUsuarios;