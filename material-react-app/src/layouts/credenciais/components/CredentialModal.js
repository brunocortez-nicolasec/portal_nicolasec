// src/layouts/credenciais/components/CredentialModal.js

import { useState } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MDBox from "components/MDBox";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDTypography from "components/MDTypography";

function CredentialModal({ open, onClose, onSave }) {
  const [formData, setFormData] = useState({ name: "", credential: "", value: "" });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // No futuro, aqui chamaremos a API
    console.log("Salvando credencial:", formData);
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar Nova Credencial</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" mt={2}>
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
};

export default CredentialModal;