import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

function EditUserModal({ open, onClose, user, onSave }) {
  const [userData, setUserData] = useState({ name: "", email: "", role: "" });
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const api = axios.create({
          baseURL: "/",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const response = await api.get("/roles");
        setRoles(response.data);
      } catch (error) {
        console.error("Erro ao buscar funções:", error);
      }
    };

    if (open) {
      fetchRoles();
    }
  }, [open]);

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || "",
        email: user.email || "",
        role: user.role?.name || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(user.id, userData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar Usuário</DialogTitle>
      <DialogContent>
        {/* --- MUDANÇA PRINCIPAL AQUI --- */}
        <MDBox component="form" role="form" pt={2}>
          {/* 1. Campo 'Nome' agora usa a prop 'label' */}
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="Nome"
              name="name"
              value={userData.name}
              onChange={handleChange}
              fullWidth
            />
          </MDBox>

          {/* 2. Campo 'Email' agora usa a prop 'label' */}
          <MDBox mb={2}>
            <MDInput
              type="email"
              label="Email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              fullWidth
            />
          </MDBox>

          {/* 3. Dropdown de Função (sem alteração de estrutura) */}
          <MDBox mb={2}>
            <FormControl fullWidth>
              <InputLabel id="role-select-label">Função (Role)</InputLabel>
              <Select
                labelId="role-select-label"
                name="role"
                value={userData.role}
                label="Função (Role)"
                onChange={handleChange}
                sx={{ height: "44px" }}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.name}>
                    {role.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MDBox>
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose} color="secondary">
          Cancelar
        </MDButton>
        <MDButton onClick={handleSave} variant="contained" color="info">
          Salvar
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

EditUserModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  onSave: PropTypes.func.isRequired,
};

export default EditUserModal;