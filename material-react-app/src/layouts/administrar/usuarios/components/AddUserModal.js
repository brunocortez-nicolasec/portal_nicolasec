import { useState, useEffect } from "react";
import PropTypes from "prop-types";
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
  
  const [isPasswordValid, setIsPasswordValid] = useState(false);

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

    if (name === "password") {
      setIsPasswordValid(value.length >= 8);
    }
  };

  const handleSave = () => {
    if (!isPasswordValid) {
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
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="Nome Completo"
              name="name"
              fullWidth
              value={userData.name}
              onChange={handleChange}
              // --- MUDANÇA: Adiciona espaço reservado para alinhamento ---
              helperText=" "
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
              // --- MUDANÇA: Adiciona espaço reservado para alinhamento ---
              helperText=" "
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
              error={userData.password.length > 0 && !isPasswordValid}
              helperText="A senha deve ter no mínimo 8 caracteres."
              FormHelperTextProps={{ style: { opacity: 1, fontWeight: '400' } }}
            />
          </MDBox>

          {/* O Dropdown não precisa de helperText pois seu espaçamento é diferente */}
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
        <MDButton onClick={handleSave} color="info" disabled={!isPasswordValid}>
          Salvar
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

AddUserModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default AddUserModal;