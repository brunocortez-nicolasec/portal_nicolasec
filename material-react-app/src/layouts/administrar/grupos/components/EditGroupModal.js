// src/layouts/administrar/grupos/components/EditGroupModal.js

import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import axios from "axios";

import { Checkbox } from "@mui/material";
import DataTable from "examples/Tables/DataTable";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDAvatar from "components/MDAvatar";
import defaultAvatar from "assets/images/default-avatar.jpg";

// Componente interno para renderizar o usuário
function User({ image, name }) {
  return (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
      <MDAvatar src={image || defaultAvatar} name={name} size="sm" />
      <MDBox ml={2} lineHeight={1}>
        <MDTypography display="block" variant="button" fontWeight="medium">
          {name}
        </MDTypography>
      </MDBox>
    </MDBox>
  );
}

function EditGroupModal({ open, onClose, onSave, group }) {
  const [name, setName] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [memberIds, setMemberIds] = useState(new Set());
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const api = axios.create({
    baseURL: "/",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!group) return;
      setLoading(true);
      try {
        const [usersResponse, groupDetailsResponse] = await Promise.all([
          api.get("/users"),
          api.get(`/groups/${group.id}`),
        ]);
        setAllUsers(usersResponse.data);
        setName(groupDetailsResponse.data.name);
        const currentMemberIds = new Set(groupDetailsResponse.data.users.map((user) => user.id));
        setMemberIds(currentMemberIds);
      } catch (error) {
        console.error("Erro ao buscar dados para o modal:", error);
      } finally {
        setLoading(false);
      }
    };
    if (open) {
      fetchData();
      setSearchText("");
    }
  }, [open, group]);

  const handleToggleMember = (userId) => {
    const newMemberIds = new Set(memberIds);
    if (newMemberIds.has(userId)) {
      newMemberIds.delete(userId);
    } else {
      newMemberIds.add(userId);
    }
    setMemberIds(newMemberIds);
  };

  const handleSave = () => {
    const userIds = Array.from(memberIds);
    onSave(group.id, { name, userIds });
    onClose();
  };

  // --- LÓGICA DA TABELA AGORA DENTRO DO COMPONENTE ---
  const tableData = useMemo(() => {
    const filteredUsers = allUsers.filter((user) =>
      user.name.toLowerCase().includes(searchText.toLowerCase())
    );

    return {
      columns: [
        {
          Header: "",
          accessor: "id",
          width: "5%",
          align: "center",
          Cell: ({ row }) => (
            <Checkbox
              color="info"
              checked={memberIds.has(row.original.id)}
              onChange={() => handleToggleMember(row.original.id)}
            />
          ),
        },
        {
          Header: "usuário",
          accessor: "name",
          Cell: ({ row }) => <User image={row.original.profile_image} name={row.original.name} />,
        },
        {
          Header: "email",
          accessor: "email",
          Cell: ({ value }) => <MDTypography variant="caption">{value}</MDTypography>,
        },
      ],
      rows: filteredUsers,
    };
  }, [searchText, allUsers, memberIds]); // Recalcula a tabela apenas quando necessário

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Editar Grupo</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" pt={2}>
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="Nome do Grupo"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </MDBox>
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="Pesquisar Usuários na Lista..."
              fullWidth
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </MDBox>

          {loading ? (
            <MDTypography variant="body2" textAlign="center">Carregando...</MDTypography>
          ) : (
            <MDBox sx={{ maxHeight: 440, overflow: "auto" }}>
              <DataTable
                table={tableData}
                isSorted={false}
                entriesPerPage={false}
                showTotalEntries={false}
                noEndBorder
              />
            </MDBox>
          )}
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose} color="secondary">
          Cancelar
        </MDButton>
        <MDButton onClick={handleSave} color="info">
          Salvar Alterações
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

EditGroupModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  group: PropTypes.object,
};

// PropType para o componente User interno
User.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string.isRequired,
};

export default EditGroupModal;