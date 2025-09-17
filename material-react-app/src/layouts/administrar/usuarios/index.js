import { useState, useEffect } from "react";
import axios from "axios";

// --- MUDANÇA: Importa o novo modal de adição ---
import AddUserModal from "./components/AddUserModal"; 
import EditUserModal from "./components/EditUserModal"; 
import MDAlert from "components/MDAlert";

// Componentes do template
import AdminPageLayout from "layouts/administrar/components/AdminPageLayout";
import DataTable from "examples/Tables/DataTable";
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";

// Importa a função que formata os dados para a tabela
import usersTableData from "./data/usersTableData";

function GerenciarUsuarios() {
  const [users, setUsers] = useState([]);
  const [notification, setNotification] = useState({ show: false, color: "info", message: "" });
  
  // --- MUDANÇA: Estados para os dois modais ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [tableData, setTableData] = useState({ columns: [], rows: [] });
  const [loading, setLoading] = useState(true);

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

  // Funções para o Modal de Edição
  const handleEditClick = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };
  
  // --- MUDANÇA: Nova função para abrir o modal de adição ---
  const handleAddClick = () => {
    setIsAddModalOpen(true);
  };

  // --- MUDANÇA: Nova função para fechar o modal de adição ---
  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
  };

  const handleSaveUser = async (id, updatedData) => {
    try {
      const payload = {
        data: {
          type: "users",
          attributes: updatedData,
        },
      };
      await api.patch(`/users/${id}`, payload);
      setNotification({ show: true, color: "success", message: "Usuário atualizado com sucesso!" });
      fetchUsers();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      setNotification({ show: true, color: "error", message: "Erro ao salvar alterações." });
    }
  };

  // --- MUDANÇA: Nova função para CRIAR o usuário ---
  const handleCreateUser = async (newUserData) => {
    try {
      // O nosso backend espera um objeto JSON simples, sem o "pacote" data.attributes
      await api.post("/users", newUserData);
      setNotification({ show: true, color: "success", message: "Usuário criado com sucesso!" });
      fetchUsers(); // Atualiza a lista de usuários
    } catch (error) {
      const message = error.response?.data?.message || "Erro ao criar o usuário.";
      console.error("Erro ao criar usuário:", error);
      setNotification({ show: true, color: "error", message });
    }
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm("Tem certeza que deseja deletar este usuário?")) {
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

  return (
    <AdminPageLayout
      title="Gerenciamento de Usuários"
      buttonText="Adicionar Usuário"
      onButtonClick={handleAddClick} // --- MUDANÇA: Chama a função correta
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

      {/* Modal de Edição (sem alterações) */}
      {selectedUser && (
        <EditUserModal
          open={isEditModalOpen}
          onClose={handleCloseEditModal}
          user={selectedUser}
          onSave={handleSaveUser}
        />
      )}

      {/* --- MUDANÇA: Renderiza o novo modal de adição --- */}
      <AddUserModal
        open={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleCreateUser}
      />
    </AdminPageLayout>
  );
}

export default GerenciarUsuarios;