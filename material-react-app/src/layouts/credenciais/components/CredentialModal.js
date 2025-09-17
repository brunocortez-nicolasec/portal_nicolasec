// src/layouts/credenciais/components/CredentialModal.js - FILTRO FINAL

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";

function CredentialModal({ open, onClose, onSave, policies }) {
  const [formData, setFormData] = useState({ app: "", name: "", credential: "", value: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };
  
  // --- LÓGICA DE FILTRO CORRIGIDA ---
  let appOptions = [];
  if (policies && policies.length > 0 && policies[0].body) {
    // 1. Acessa o array 'body' do primeiro objeto
    const bodyItems = policies[0].body;
    
    // 2. Filtra para pegar apenas os objetos que definem as políticas de apps
    //    (aqueles cujo 'owner' é '/admin' e que possuem um 'body')
    const appPolicies = bodyItems.filter(item => item.owner === '/apps/' && item.body);
    
    // 3. Extrai o 'id' de cada uma dessas políticas
    appOptions = appPolicies.map(item => item.id);
  }

  useEffect(() => {
    if (open && appOptions.length > 0 && !appOptions.includes(formData.app)) {
      setFormData(prevData => ({ ...prevData, app: appOptions[0] }));
    }
  }, [open, policies]); // Depende de 'open' e 'policies' para reavaliar

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar Nova Credencial</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" mt={2}>
          <MDBox mb={2}>
            <FormControl fullWidth>
              <InputLabel id="app-select-label">App</InputLabel>
              <Select
                labelId="app-select-label"
                name="app"
                value={formData.app}
                onChange={handleChange}
                label="App"
                sx={{ height: "45px" }}
              >
                {appOptions.map((appName) => (
                  <MenuItem key={appName} value={appName}>
                    {appName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </MDBox>

          <MDBox mb={2}>
            <MDTypography variant="caption">Nome da Conta</MDTypography>
            <MDInput type="text" name="name" onChange={handleChange} fullWidth placeholder="Ex: API Externa" />
          </MDBox>
          <MDBox mb={2}>
            <MDTypography variant="caption">Credencial</MDTypography>
            <MDInput type="text" name="credential" onChange={handleChange} fullWidth placeholder="Ex: api_key, user, token" />
          </MDBox>
          <MDBox mb={2}>
            <MDTypography variant="caption">Valor</MDTypography>
            <MDInput type="password" name="value" onChange={handleChange} fullWidth />
          </MDBox>
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose} color="secondary">Cancelar</MDButton>
        <MDButton onClick={handleSave} variant="contained" color="info">Salvar</MDButton>
      </DialogActions>
    </Dialog>
  );
}

CredentialModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  policies: PropTypes.array,
};

CredentialModal.defaultProps = {
    policies: [],
};

export default CredentialModal;