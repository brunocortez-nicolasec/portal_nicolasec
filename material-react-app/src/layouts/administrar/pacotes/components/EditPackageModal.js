// src/layouts/administrar/pacotes/components/EditPackageModal.js

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import axios from "axios";

import Autocomplete from "@mui/material/Autocomplete";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import MDBox from "components/MDBox";

function EditPackageModal({ open, onClose, onSave, pkg }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [allPlatforms, setAllPlatforms] = useState([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);

  useEffect(() => {
    const fetchPlatforms = async () => {
      try {
        const api = axios.create({
          baseURL: "/",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const response = await api.get("/platforms");
        setAllPlatforms(response.data);
      } catch (error) {
        console.error("Erro ao buscar plataformas:", error);
      }
    };

    if (open) {
      fetchPlatforms();
      // Popula o formulário com os dados do pacote a ser editado
      if (pkg) {
        setName(pkg.name || "");
        setDescription(pkg.description || "");
        setSelectedPlatforms(pkg.platforms || []);
      }
    }
  }, [open, pkg]);

  const handleSave = () => {
    const platformIds = selectedPlatforms.map(p => p.id);
    onSave(pkg.id, { name, description, platformIds });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Editar Pacote</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" pt={2}>
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="Nome do Pacote"
              fullWidth
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </MDBox>
          <MDBox mb={2}>
            <MDInput
              type="text"
              label="Descrição (Opcional)"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </MDBox>
          <MDBox mb={2}>
            <Autocomplete
              multiple
              options={allPlatforms}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={selectedPlatforms}
              onChange={(event, newValue) => {
                setSelectedPlatforms(newValue);
              }}
              renderInput={(params) => (
                <MDInput {...params} label="Plataformas Inclusas" />
              )}
            />
          </MDBox>
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={onClose} color="secondary">Cancelar</MDButton>
        <MDButton onClick={handleSave} color="info">Salvar Alterações</MDButton>
      </DialogActions>
    </Dialog>
  );
}

EditPackageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  pkg: PropTypes.object,
};

export default EditPackageModal;