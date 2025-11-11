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
  const [userData, setUserData] = useState({ name: "", email: "", role: "", packageId: "" });
  // --- CORRIGIDO: 'roles' -> 'profiles' ---
  const [profiles, setProfiles] = useState([]);
  const [packages, setPackages] = useState([]);

  useEffect(() => {
    const api = axios.create({
      baseURL: "/",
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });

    // --- CORRIGIDO: 'fetchRoles' -> 'fetchProfiles' e endpoint '/profiles' ---
    const fetchProfiles = async () => {
      try {
        const response = await api.get("/profiles"); // Corrigido de '/roles'
        setProfiles(response.data); // Corrigido de 'setRoles'
      } catch (error) {
        console.error("Erro ao buscar perfis:", error); // Mensagem corrigida
      }
    };

    const fetchPackages = async () => {
      try {
        const response = await api.get("/packages");
        setPackages(response.data);
      } catch (error) {
        console.error("Erro ao buscar pacotes:", error);
      }
    };

    if (open) {
      fetchProfiles(); // Corrigido de 'fetchRoles'
      fetchPackages();
    }
  }, [open]);

  useEffect(() => {
    if (user) {
      // --- INÍCIO DA CORREÇÃO ---
      // O 'user' que vem do componente "pai" agora tem 'profile' (do GET /users)
      setUserData({
        name: user.name || "",
        email: user.email || "",
        role: user.profile?.name || "", // Corrigido de 'user.role?.name'
        packageId: user.packageId || "",
      });
      // --- FIM DA CORREÇÃO ---
    }
  }, [user]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // A chave 'role' é mantida no 'userData'
    // pois o backend (POST /users) espera receber a chave 'role' com o nome
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
              <InputLabel id="role-select-label">Função (Perfil)</InputLabel>
              <Select
                labelId="role-select-label"
                name="role" // Mantido como 'role'
                value={userData.role} // Mantido como 'userData.role'
                label="Função (Perfil)"
                onChange={handleChange}
                sx={{ height: "44px" }}
              >
                {/* --- CORRIGIDO: 'roles.map' -> 'profiles.map' --- */}
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.name}>
                    {profile.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MDBox>

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