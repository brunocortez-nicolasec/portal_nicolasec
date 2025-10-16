// material-react-app/src/layouts/observabilidade/sistemas/components/DataSourceModal.js

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";

// @mui material components
import Modal from "@mui/material/Modal";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";

function DataSourceModal({ open, onClose, onSave, initialData, darkMode }) {
  const theme = useTheme();

  const defaultState = {
    name: "",
    databaseType: "CSV",
    description: "", // Descrição é um campo padrão
    username: "",
    serverName: "",
    port: "",
    database: "",
    serviceName: "",
    isNative: false,
    isJdbcUrlEditable: false,
    jdbcUrl: "",
  };

  const [formData, setFormData] = useState(defaultState);

  // Estilo para corrigir a cor do texto das labels das checkboxes no modo escuro
  const checkboxLabelStyles = {
    "& .MuiTypography-root": {
      color: darkMode ? theme.palette.white.main : theme.palette.text.primary,
      fontSize: "0.875rem",
    },
  };

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Garante que o estado inicialize corretamente, mesclando dados existentes com o padrão
        setFormData({ ...defaultState, ...initialData });
      } else {
        setFormData(defaultState);
      }
    }
  }, [initialData, open]);

  useEffect(() => {
    const defaults = {
      PostgreSQL: "5432",
      Oracle: "1521",
      "Microsoft SQL Server": "1433",
      Other: "",
      CSV: "",
    };
    // Garante que a mudança de porta só ocorra se o usuário não estiver editando
    if (!initialData) {
      if (Object.keys(defaults).includes(formData.databaseType)) {
        setFormData((prev) => ({ ...prev, port: defaults[prev.databaseType] }));
      }
    }
  }, [formData.databaseType, initialData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (e) => {
    setFormData((prev) => ({ ...prev, databaseType: e.target.value }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const renderDynamicFields = () => {
    switch (formData.databaseType) {
      case "CSV":
        // O campo Descrição foi removido daqui
        return null; 
      case "PostgreSQL":
        return (
          <>
            <Grid item xs={12}><MDInput label="Username" name="username" value={formData.username} onChange={handleInputChange} fullWidth /></Grid>
            <Grid item xs={12}><MDInput label="Server Name" name="serverName" value={formData.serverName} onChange={handleInputChange} fullWidth /></Grid>
            <Grid item xs={12}><MDInput label="Port" name="port" value={formData.port} onChange={handleInputChange} fullWidth /></Grid>
            <Grid item xs={12}><MDInput label="Database" name="database" value={formData.database} onChange={handleInputChange} fullWidth /></Grid>
          </>
        );
      case "Oracle":
        return (
          <>
            <Grid item xs={12}><MDInput label="Username" name="username" value={formData.username} onChange={handleInputChange} fullWidth /></Grid>
            <Grid item xs={12}><MDInput label="Server Name" name="serverName" value={formData.serverName} onChange={handleInputChange} fullWidth /></Grid>
            <Grid item xs={12}><MDInput label="Port" name="port" value={formData.port} onChange={handleInputChange} fullWidth /></Grid>
            <Grid item xs={12}><MDInput label="Service Name/SID" name="serviceName" value={formData.serviceName} onChange={handleInputChange} fullWidth /></Grid>
          </>
        );
      case "Microsoft SQL Server":
        return (
          <>
            <Grid item xs={12}>
              <MDInput label="Username" name="username" value={formData.username} onChange={handleInputChange} fullWidth />
              <FormControlLabel
                control={<Checkbox name="isNative" checked={formData.isNative} onChange={handleInputChange} />}
                label="Native"
                sx={checkboxLabelStyles}
              />
            </Grid>
            <Grid item xs={12}><MDInput label="Server Name" name="serverName" value={formData.serverName} onChange={handleInputChange} fullWidth /></Grid>
            <Grid item xs={12}><MDInput label="Port" name="port" value={formData.port} onChange={handleInputChange} fullWidth /></Grid>
            <Grid item xs={12}><MDInput label="Database" name="database" value={formData.database} onChange={handleInputChange} fullWidth /></Grid>
          </>
        );
      case "Other":
        return (
          <>
            <Grid item xs={12}><MDInput label="Username" name="username" value={formData.username} onChange={handleInputChange} fullWidth /></Grid>
            <Grid item xs={12}><MDInput label="JDBC URL" name="jdbcUrl" value={formData.jdbcUrl} onChange={handleInputChange} fullWidth /></Grid>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Modal open={open} onClose={onClose} sx={{ display: "grid", placeItems: "center" }}>
      <Card sx={{ width: "90%", maxWidth: "600px", overflowY: "auto", maxHeight: "90vh" }}>
        <MDBox p={3}>
          <MDTypography variant="h5">Adicionar/Editar Fonte de Dados</MDTypography>
        </MDBox>
        <MDBox component="form" p={3} pt={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <MDInput label="Name" name="name" value={formData.name} onChange={handleInputChange} fullWidth autoFocus />
            </Grid>
            <Grid item xs={12}>
              <MDTypography variant="caption" fontWeight="medium" color="text">Tipo de Fonte</MDTypography>
              <Select name="databaseType" value={formData.databaseType} onChange={handleSelectChange} fullWidth sx={{ minHeight: "44px" }}>
                <MenuItem value="CSV">CSV</MenuItem>
                <MenuItem value="PostgreSQL">PostgreSQL</MenuItem>
                <MenuItem value="Oracle">Oracle</MenuItem>
                <MenuItem value="Microsoft SQL Server">Microsoft SQL Server</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </Grid>

            {/* ======================= INÍCIO DA ALTERAÇÃO ======================= */}
            <Grid item xs={12}>
              <MDInput
                label="Descrição (Opcional)"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            {/* ======================== FIM DA ALTERAÇÃO ========================= */}

            {renderDynamicFields()}

            {!["CSV", "Other"].includes(formData.databaseType) && (
              <Grid item xs={12}>
                <MDInput
                  label="JDBC URL"
                  name="jdbcUrl"
                  value={formData.jdbcUrl}
                  onChange={handleInputChange}
                  disabled={!formData.isJdbcUrlEditable}
                  fullWidth
                  sx={{
                    "& .MuiInputBase-root.Mui-disabled": {
                      backgroundColor: theme.palette.action.disabledBackground,
                    },
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: theme.palette.text.disabled,
                    },
                  }}
                />
                <FormControlLabel
                  control={<Checkbox name="isJdbcUrlEditable" checked={formData.isJdbcUrlEditable} onChange={handleInputChange} />}
                  label="Edit"
                  sx={checkboxLabelStyles}
                />
              </Grid>
            )}
          </Grid>
          <MDBox mt={4} display="flex" justifyContent="flex-end">
            <MDButton variant="gradient" color="secondary" onClick={onClose} sx={{ mr: 2 }}>
              Cancelar
            </MDButton>
            <MDButton variant="gradient" color="info" onClick={handleSave}>
              Salvar
            </MDButton>
          </MDBox>
        </MDBox>
      </Card>
    </Modal>
  );
}

DataSourceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  darkMode: PropTypes.bool,
};

DataSourceModal.defaultProps = {
  initialData: null,
  darkMode: false,
};

export default DataSourceModal;