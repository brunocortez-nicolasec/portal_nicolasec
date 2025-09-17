import { useState } from "react";
import PropTypes from "prop-types";

// --- MUDANÇA: Imports adicionais para o Dropdown ---
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

// Componentes Material UI e do Template
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";

function AddUserModal({ open, onClose, onSave }) {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Membro", // Valor padrão continua sendo "Membro"
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    onSave(userData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar Novo Usuário</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" mt={2}>
          {/* Campos de Nome, Email e Senha (sem alterações) */}
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="Nome Completo"
              name="name"
              fullWidth
              value={userData.name}
              onChange={handleChange}
            />
          </MDBox>
          <MDBox mb={2}>
            <MDInput
              type="email"
              label="Email"
              name="email"
              fullWidth
              value={userData.email}
              onChange={handleChange}
            />
          </MDBox>
          <MDBox mb={2}>
            <MDInput
              type="password"
              label="Senha"
              name="password"
              fullWidth
              value={userData.password}
              onChange={handleChange}
            />
          </MDBox>

          {/* --- MUDANÇA: Substituição do Input de Função por um Dropdown --- */}
          <MDBox mb={2}>
            <FormControl fullWidth>
              <InputLabel id="role-select-label">Função</InputLabel>
              <Select
                labelId="role-select-label"
                id="role-select"
                name="role" // O 'name' é importante para a função handleChange funcionar
                value={userData.role}
                label="Função"
                onChange={handleChange}
                // Ajuste de estilo para combinar com o template
                sx={{ height: "44px" }} 
              >
                <MenuItem value="Admin">Admin</MenuItem>
                <MenuItem value="Membro">Membro</MenuItem>
                <MenuItem value="Terceiro">Terceiro</MenuItem>
              </Select>
            </FormControl>
          </MDBox>

        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose} color="secondary">
          Cancelar
        </MDButton>
        <MDButton onClick={handleSave} color="info">
          Salvar
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

// PropTypes (sem alterações)
AddUserModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default AddUserModal;