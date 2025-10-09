// material-react-app/src/layouts/observabilidade/importManagement/components/ImportCard.js

import React, { useState } from "react";
import PropTypes from "prop-types";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import Dropzone from "./Dropzone";

function ImportCard({ onUpload, systemOptions, isLoading, onOpenTemplate }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetSystem, setTargetSystem] = useState(null);

  const handleUploadClick = () => {
    onUpload(selectedFile, targetSystem, () => {
      setSelectedFile(null);
      setTargetSystem(null);
    });
  };

  return (
    <Card>
      <MDBox 
        mx={2} mt={-3} py={2} px={2} 
        variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info"
        display="flex" justifyContent="space-between" alignItems="center"
      >
        <MDTypography variant="h6" color="white">Nova Importação de CSV</MDTypography>
        <MDButton variant="contained" color="dark" onClick={onOpenTemplate}>
          Visualizar Template
        </MDButton>
      </MDBox>
      <MDBox p={3}>
        <Grid container spacing={3} alignItems="center">
          {/* Lado Esquerdo: Seletor e Botão */}
          <Grid item xs={12} md={6}>
            <MDBox mb={2}>
              <Autocomplete 
                options={systemOptions} 
                value={targetSystem}
                disabled={isLoading}
                onChange={(event, newValue) => {
                  setTargetSystem(newValue);
                  if (selectedFile) setSelectedFile(null);
                }} 
                renderInput={(params) => <TextField {...params} label="Selecione o Destino (RH ou Sistema)" />} 
              />
            </MDBox>
            <MDButton 
              variant="gradient" color="info" fullWidth
              onClick={handleUploadClick} 
              disabled={!selectedFile || !targetSystem || isLoading}
            >
              <Icon>play_arrow</Icon>&nbsp;Processar Arquivo
            </MDButton>
          </Grid>

          {/* Lado Direito: Dropzone */}
          <Grid item xs={12} md={6}>
            <Dropzone 
              file={selectedFile}
              onFileSelect={setSelectedFile}
              system={targetSystem}
              disabled={!targetSystem || isLoading}
              disabledText="Selecione um destino primeiro"
            />
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  );
}

ImportCard.propTypes = {
  onUpload: PropTypes.func.isRequired,
  systemOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  isLoading: PropTypes.bool,
  onOpenTemplate: PropTypes.func.isRequired,
};

ImportCard.defaultProps = {
  isLoading: false,
};

export default ImportCard;