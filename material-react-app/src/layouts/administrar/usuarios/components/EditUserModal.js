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
  // Adiciona 'packageId' ao estado do formulário
  const [userData, setUserData] = useState({ name: "", email: "", role: "", packageId: "" });
  const [roles, setRoles] = useState([]);
  // Novo estado para armazenar a lista de pacotes
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    const api = axios.create({
      baseURL: "/",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    // Busca as Funções (Roles)
    const fetchRoles = async () => {
      try {
        const response = await api.get("/roles");
        setRoles(response.data);
      } catch (error) {
        console.error("Erro ao buscar funções:", error);
      }
    };

    // Busca os Pacotes (Packages)
    const fetchPackages = async () => {
      try {
        const response = await api.get("/packages");
        setPackages(response.data);
      } catch (error) {
        console.error("Erro ao buscar pacotes:", error);
      }
    };

    if (open) {
      fetchRoles();
      fetchPackages();
    }
  }, [open]);

  // Popula o formulário com os dados do usuário quando ele é selecionado
  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || "",
        email: user.email || "",
        role: user.role?.name || "",
        // Define o packageId, ou null se o usuário não tiver pacote
        packageId: user.packageId || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // Ao salvar, passa o objeto completo, incluindo o novo packageId
    onSave(user.id, userData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar Usuário</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" pt={2}>
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

          {/* --- NOVO DROPDOWN DE PACOTES --- */}
          <MDBox mb={2}>
            <FormControl fullWidth>
              <InputLabel id="package-select-label">Pacote</InputLabel>
              <Select
                labelId="package-select-label"
                name="packageId"
                value={userData.packageId}
                label="Pacote"
                onChange={handleChange}
                sx={{ height: "44px" }}
              >
                {/* Opção para remover o pacote do usuário */}
                <MenuItem value="">
                  <em>Nenhum</em>
                </MenuItem>
                {packages.map((pkg) => (
                  <MenuItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
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