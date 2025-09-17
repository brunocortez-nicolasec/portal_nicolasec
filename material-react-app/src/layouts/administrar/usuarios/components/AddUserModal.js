import { useState, useEffect } from "react"; // --- MUDANÇA: Importa o useEffect
import PropTypes from "prop-types";

// Imports de componentes (sem alterações)
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
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
    role: "Membro",
  });
  
  // --- MUDANÇA: Adiciona um estado para a validade da senha ---
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  // --- MUDANÇA: Efeito para resetar o formulário quando o modal é fechado/aberto ---
  useEffect(() => {
    if (open) {
      setUserData({
        name: "",
        email: "",
        password: "",
        role: "Membro",
      });
      setIsPasswordValid(false);
    }
  }, [open]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));

    // --- MUDANÇA: Validação em tempo real da senha ---
    if (name === "password") {
      setIsPasswordValid(value.length >= 8);
    }
  };

  const handleSave = () => {
    // --- MUDANÇA: Checagem final antes de salvar ---
    if (!isPasswordValid) {
      // Impede o salvamento se a senha for inválida
      return;
    }
    onSave(userData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar Novo Usuário</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" mt={2}>
          {/* Campos de Nome e Email (sem alterações) */}
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

          {/* --- MUDANÇA: Campo de Senha com validação e aviso --- */}
          <MDBox mb={2}>
            <MDInput
              type="password"
              label="Senha"
              name="password"
              fullWidth
              value={userData.password}
              onChange={handleChange}
              // Mostra o erro visual se o campo foi tocado e a senha é inválida
              error={userData.password.length > 0 && !isPasswordValid}
              // Exibe o aviso
              helperText="A senha deve ter no mínimo 8 caracteres."
              // Garante que o helperText esteja sempre visível
              FormHelperTextProps={{ style: { opacity: 1, fontWeight: '400' } }}
            />
          </MDBox>

          {/* Dropdown de Função (sem alterações) */}
          <MDBox mb={2}>
            <FormControl fullWidth>
              <InputLabel id="role-select-label">Função</InputLabel>
              <Select
                labelId="role-select-label"
                id="role-select"
                name="role"
                value={userData.role}
                label="Função"
                onChange={handleChange}
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
        {/* --- MUDANÇA: Botão "Salvar" é desabilitado se a senha for inválida --- */}
        <MDButton onClick={handleSave} color="info" disabled={!isPasswordValid}>
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