// src/layouts/administrar/funcoes/components/EditRoleModal.js

import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";

function EditRoleModal({ open, onClose, onSave, role }) {
  const [name, setName] = useState("");

  // Popula o campo com o nome da função atual quando o modal abre
  useEffect(() => {
    if (role) {
      setName(role.name);
    }
  }, [role]);

  const handleSave = () => {
    // Envia o ID e o novo nome para a função onSave do componente pai
    onSave(role.id, { name });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar Função</DialogTitle>
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
          Salvar Alterações
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

EditRoleModal.defaultProps = {
  role: null,
};

EditRoleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  role: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
  }),
};

export default EditRoleModal;