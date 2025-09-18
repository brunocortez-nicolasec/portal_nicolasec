// src/layouts/administrar/funcoes/components/AddRoleModal.js

import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";

function AddRoleModal({ open, onClose, onSave }) {
  const [name, setName] = useState("");

  // Limpa o campo de nome sempre que o modal abre
  useEffect(() => {
    if (open) {
      setName("");
    }
  }, [open]);

  const handleSave = () => {
    // Envia o nome da função para a função onSave do componente pai
    onSave({ name });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Adicionar Nova Função</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" pt={2}>
          <MDInput
            type="text"
            label="Nome da Função"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
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

AddRoleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default AddRoleModal;