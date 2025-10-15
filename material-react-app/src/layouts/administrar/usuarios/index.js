// material-react-app/src/layouts/administrar/usuarios/index.js

import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Collapse from "@mui/material/Collapse";
import AddUserModal from "./components/AddUserModal";
import EditUserModal from "./components/EditUserModal";
import MDAlert from "components/MDAlert";
import AdminPageLayout from "layouts/administrar/components/AdminPageLayout";
import DataTable from "examples/Tables/DataTable";
import MDTypography from "components/MDTypography";
import MDBox from "components/MDBox";
import usersTableData from "./data/usersTableData";
import MDInput from "components/MDInput";

function GerenciarUsuarios() {
    const [users, setUsers] = useState([]);
    const [notification, setNotification] = useState({ show: false, color: "info", message: "" });
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [tableData, setTableData] = useState({ columns: [], rows: [] });
    const [loading, setLoading] = useState(true);
    
    const [searchText, setSearchText] = useState("");

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
        if (notification.show) {
            const timer = setTimeout(() => {
                setNotification((prevState) => ({ ...prevState, show: false }));
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const filteredUsers = useMemo(() =>
        users.filter(user =>
            user.name.toLowerCase().includes(searchText.toLowerCase())
        ), [users, searchText]);

    useEffect(() => {
        const formattedData = usersTableData(filteredUsers, handleEditClick, handleDeleteClick);
        setTableData(formattedData);
    }, [filteredUsers]);

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };
    const handleCloseEditModal = () => {
        setIsEditModalOpen(false);
        setSelectedUser(null);
    };
    const handleAddClick = () => {
        setIsAddModalOpen(true);
    };
    const handleCloseAddModal = () => {
        setIsAddModalOpen(false);
    };

    const handleSaveUser = async (id, updatedData) => {
        try {
            await api.patch(`/users/${id}`, updatedData);
            setNotification({ show: true, color: "success", message: "Usuário atualizado com sucesso!" });
            fetchUsers();
            handleCloseEditModal();
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            setNotification({ show: true, color: "error", message: "Erro ao salvar alterações." });
        }
    };

    const handleCreateUser = async (newUserData) => {
        try {
            await api.post("/users", newUserData);
            setNotification({ show: true, color: "success", message: "Usuário criado com sucesso!" });
            fetchUsers();
            handleCloseAddModal();
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
            onButtonClick={handleAddClick}
        >
            <MDBox mt={2} mb={2}>
                <Collapse in={notification.show}>
                    <MDAlert color={notification.color}>
                        <MDTypography variant="body2" color="white">
                            {notification.message}
                        </MDTypography>
                    </MDAlert>
                </Collapse>
            </MDBox>

            {/* <<< INÍCIO DA ALTERAÇÃO >>> */}
            <MDBox mb={2} sx={{ width: { xs: "100%", md: "200px" }, ml: "auto" }}>
                <MDInput 
                    label="Pesquisar por nome..."
                    fullWidth
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                />
            </MDBox>
            {/* <<< FIM DA ALTERAÇÃO >>> */}
            
            {loading ? (
                <MDTypography variant="body2" textAlign="center">Carregando usuários...</MDTypography>
            ) : (
                <DataTable table={tableData} isSorted={false} entriesPerPage={false} showTotalEntries={false} noEndBorder />
            )}

            {selectedUser && (
                <EditUserModal
                    open={isEditModalOpen}
                    onClose={handleCloseEditModal}
                    user={selectedUser}
                    onSave={handleSaveUser}
                />
            )}
            <AddUserModal
                open={isAddModalOpen}
                onClose={handleCloseAddModal}
                onSave={handleCreateUser}
            />
        </AdminPageLayout>
    );
}

export default GerenciarUsuarios;