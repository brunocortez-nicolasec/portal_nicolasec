import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";

// @mui material components
import Modal from "@mui/material/Modal";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
// --- MODIFICAÇÃO 1: Importações alteradas ---
import Autocomplete from "@mui/material/Autocomplete"; // Usaremos este
// import Select from "@mui/material/Select"; // Não mais necessário
// import MenuItem from "@mui/material/MenuItem"; // Não mais necessário
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput"; // Usaremos este para o Autocomplete
import MDButton from "components/MDButton";

function DataSourceModal({ open, onClose, onSave, initialData, darkMode }) {
  const theme = useTheme();

  const defaultState = {
    name: "",
    databaseType: "CSV",
    description: "",
    origem: "", // Campo "Origem"
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

  // --- MODIFICAÇÃO 2: Opções para os Autocompletes ---
  const tipoFonteOptions = [
    "CSV",
    "PostgreSQL",
    "Oracle",
    "Microsoft SQL Server",
    "Other"
  ];

  const origemOptions = ["RH", "IDM", "Sistema"];

  const checkboxLabelStyles = {
    "& .MuiTypography-root": {
      color: darkMode ? theme.palette.white.main : theme.palette.text.primary,
      fontSize: "0.875rem",
    },
  };

  useEffect(() => {
    if (open) {
      if (initialData) {
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
  
  // --- MODIFICAÇÃO 3: Handler para o Autocomplete ---
  const handleAutocompleteChange = (name, newValue) => {
    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  const renderDynamicFields = () => {
    switch (formData.databaseType) {
      case "CSV":
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
              <Autocomplete
                options={origemOptions}
                value={formData.origem || null}
                onChange={(event, newValue) => {
                  handleAutocompleteChange("origem", newValue);
                }}
                renderInput={(params) => (
                  <MDInput {...params} label="Origem" />
                )}
                fullWidth
              />
            </Grid>

            <Grid item xs={12}>
              <Autocomplete
                options={tipoFonteOptions}
                value={formData.databaseType || null}
                onChange={(event, newValue) => {
                  handleAutocompleteChange("databaseType", newValue);
                }}
                renderInput={(params) => (
                  <MDInput {...params} label="Tipo de Fonte" />
                )}
                fullWidth
              />
            </Grid>

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