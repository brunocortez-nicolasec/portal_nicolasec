// src/layouts/administrar/usuarios/components/EditUserModal.js

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

function EditUserModal({ open, onClose, user, onSave }) {
  const [userData, setUserData] = useState({ name: "", email: "", role: "" });

  useEffect(() => {
    if (user) {
      setUserData({
        name: user.name || "",
        email: user.email || "",
        role: user.role || "",
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
        <MDBox component="form" role="form" mt={2}>
          <MDBox mb={2}>
            <MDTypography variant="caption">Nome</MDTypography>
            <MDInput type="text" name="name" value={userData.name} onChange={handleChange} fullWidth />
          </MDBox>
          <MDBox mb={2}>
            <MDTypography variant="caption">Email</MDTypography>
            <MDInput type="email" name="email" value={userData.email} onChange={handleChange} fullWidth />
          </MDBox>
          <MDBox mb={2}>
            <MDTypography variant="caption">Função (Role)</MDTypography>
            <MDInput type="text" name="role" value={userData.role} onChange={handleChange} fullWidth />
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

EditUserModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  onSave: PropTypes.func.isRequired,
};

export default EditUserModal;