import React, { useState, useEffect } from "react";
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

// Recebe a prop 'disableSystemSelect' (que agora só controla o label)
function ImportCard({ onUpload, systemOptions, isLoading, onOpenTemplate, disableSystemSelect }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetSystem, setTargetSystem] = useState(null);

  const handleUploadClick = () => {
    onUpload(selectedFile, targetSystem, () => {
      setSelectedFile(null);
      setTargetSystem(null);
    });
  };

  // Efeito para limpar seleção se as opções mudarem
  useEffect(() => {
    // Se o targetSystem atual não estiver mais na lista de opções (ex: RH foi processado e a lista mudou)
    // ou se o sistema selecionado não for RH e o modo "só RH" for ativado, limpa.
    if (targetSystem && !systemOptions.includes(targetSystem)) {
      setTargetSystem(null);
    }
    if (disableSystemSelect && targetSystem !== "RH") {
      setTargetSystem(null);
    }
  }, [disableSystemSelect, systemOptions, targetSystem]);

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
                // --- INÍCIO DA CORREÇÃO ---
                // O campo só é desabilitado pelo 'isLoading', 
                // não mais pelo 'disableSystemSelect'.
                disabled={isLoading} 
                // --- FIM DA CORREÇÃO ---
                onChange={(event, newValue) => {
                  setTargetSystem(newValue);
                  if (selectedFile) setSelectedFile(null);
                }} 
                renderInput={(params) => (
                    <TextField 
                        {...params} 
                        // O label dinâmico (controlado por disableSystemSelect) continua correto,
                        // informando o usuário POR QUE "RH" é a única opção.
                        label={disableSystemSelect ? "Importe os dados do RH primeiro" : "Selecione o Destino (RH ou Sistema)"} 
                    />
                )} 
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

// PropTypes (incluindo disableSystemSelect)
ImportCard.propTypes = {
  onUpload: PropTypes.func.isRequired,
  systemOptions: PropTypes.arrayOf(PropTypes.string).isRequired,
  isLoading: PropTypes.bool,
  onOpenTemplate: PropTypes.func.isRequired,
  disableSystemSelect: PropTypes.bool,
};

ImportCard.defaultProps = {
  isLoading: false,
  disableSystemSelect: false,
};

export default ImportCard;