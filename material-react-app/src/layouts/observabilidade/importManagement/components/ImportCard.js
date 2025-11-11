// material-react-app/src/layouts/observabilidade/importManagement/components/ImportCard.js

import React, { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
// @mui/material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel"; 
import Switch from "@mui/material/Switch"; 
import CircularProgress from "@mui/material/CircularProgress"; 
// ======================= INÍCIO DA ALTERAÇÃO =======================
// REMOVIDO: Imports para o seletor de ToggleButton
// ======================== FIM DA ALTERAÇÃO =========================

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDAlert from "components/MDAlert"; 
import Dropzone from "./Dropzone";


function ImportCard({ 
  onProcessUpload, 
  onProcessDirectory, 
  dataSourceOptions, // Agora contém TODAS as fontes
  isLoading, 
  onOpenTemplate 
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedDataSource, setSelectedDataSource] = useState(null); 
  const [importMode, setImportMode] = useState("directory"); // 'directory' ou 'upload'
  
  // ======================= INÍCIO DA ALTERAÇÃO (Lógica 3 Passos) =======================
  const [selectedOrigem, setSelectedOrigem] = useState(null);
  const [processingTarget, setProcessingTarget] = useState("CONTAS"); // "CONTAS" ou "RECURSOS"
  const origemOptions = ["RH", "IDM", "SISTEMA"];
  const targetOptions = ["CONTAS", "RECURSOS"];

  // Filtra a lista de fontes de dados com base na origem selecionada
  const filteredDataSources = useMemo(() => {
    if (!selectedOrigem) {
      return [];
    }
    // Filtra DataSources pela Origem E se elas têm um tipo de conexão CSV (por enquanto)
    return dataSourceOptions.filter(ds => {
        if (ds.origem_datasource !== selectedOrigem) return false;
        
        if (selectedOrigem === "RH") return ds.hrConfig?.diretorio_hr;
        if (selectedOrigem === "IDM") return false; // IDM não é CSV
        if (selectedOrigem === "SISTEMA") {
           // Inclui se *qualquer* uma das configs for CSV
           return ds.systemConfig?.tipo_fonte_contas === "CSV" || ds.systemConfig?.tipo_fonte_recursos === "CSV";
        }
        return false;
    });
  }, [dataSourceOptions, selectedOrigem]);

  // Handler para o PRIMEIRO dropdown (Origem)
  const handleOrigemChange = (event, newValue) => {
    setSelectedOrigem(newValue);
    setSelectedDataSource(null); 
    setProcessingTarget("CONTAS"); 
    setSelectedFile(null); 
  };

  // Handler para o SEGUNDO dropdown (Fonte de Dados)
  const handleDataSourceChange = (event, newValue) => {
    setSelectedDataSource(newValue);
    setProcessingTarget("CONTAS"); 
    setSelectedFile(null); 
  };
  
  // Handler para o TERCEIRO dropdown (Contas/Recursos)
  const handleProcessingTargetChange = (event, newTarget) => {
    if (newTarget !== null) {
      setProcessingTarget(newTarget);
      setSelectedFile(null); 
    }
  };
  // ======================== FIM DA ALTERAÇÃO (Lógica 3 Passos) =========================


  // Lógica de verificação de mapeamento (atualizada para o fluxo de 3 passos)
  const [isMappingMissing, setIsMappingMissing] = useState(false);
  const [mappingMissingMessage, setMappingMissingMessage] = useState("");

  useEffect(() => {
    if (!selectedDataSource) {
      setIsMappingMissing(false);
      setMappingMissingMessage("");
      return;
    }

    const { origem_datasource, mappingRH, mappingIDM, mappingSystem } = selectedDataSource;
    let missing = false;
    let message = 'O mapeamento de dados para esta fonte não foi configurado.';

    // ======================= INÍCIO DA CORREÇÃO (Bug Mapeamento) =======================
    // Corrigido para usar os nomes de campo corretos (sem 'map_')
    if (origem_datasource === "RH") {
      if (!mappingRH || !mappingRH.identity_id_hr) { // Verifica campo obrigatório
        missing = true;
      }
    } else if (origem_datasource === "IDM") {
      if (!mappingIDM || !mappingIDM.identity_id_idm) { // Verifica campo obrigatório
        missing = true;
      }
    } else if (origem_datasource === "SISTEMA") {
      const map = mappingSystem || {};
      if (processingTarget === "CONTAS" && (!map.accounts_id_in_system || !map.accounts_identity_id)) {
        missing = true;
        message = 'O mapeamento de "Contas" para este sistema está pendente.';
      } else if (processingTarget === "RECURSOS" && !map.resources_name) {
        missing = true;
        message = 'O mapeamento de "Recursos" para este sistema está pendente.';
      }
    }
    // ======================== FIM DA CORREÇÃO (Bug Mapeamento) =========================
    
    setIsMappingMissing(missing);
    setMappingMissingMessage(message);

  }, [selectedDataSource, processingTarget]); // Agora depende do target


  const handleModeChange = (event) => {
    setImportMode(event.target.checked ? "upload" : "directory");
    setSelectedFile(null); 
  };

  const handleProcessClick = () => {
    const callback = (errorOcurred = false) => {
      if (!errorOcurred) {
        setSelectedFile(null);
        setSelectedDataSource(null);
        setSelectedOrigem(null);
        setProcessingTarget("CONTAS");
      }
    };

    if (!selectedDataSource) return;

    if (importMode === "upload") {
      onProcessUpload(selectedFile, selectedDataSource.id, processingTarget, callback);
    } else {
      onProcessDirectory(selectedDataSource.id, processingTarget, callback);
    }
  };
  
  // Verifica o tipo de fonte correto (CSV, DB, etc.)
  const currentSourceType = useMemo(() => {
    if (!selectedDataSource) return null;
    if (selectedOrigem === "RH") return selectedDataSource.hrConfig?.diretorio_hr ? "CSV" : null;
    if (selectedOrigem === "IDM") return "API"; // IDM é sempre API
    if (selectedOrigem === "SISTEMA" && selectedDataSource.systemConfig) {
      return processingTarget === "CONTAS" 
        ? selectedDataSource.systemConfig.tipo_fonte_contas 
        : selectedDataSource.systemConfig.tipo_fonte_recursos;
    }
    return null;
  }, [selectedDataSource, selectedOrigem, processingTarget]);
  
  // O modo de upload (dropzone) só é permitido se o tipo da fonte for CSV
  const allowUploadMode = currentSourceType === "CSV";
  // Se não for CSV, força o modo "directory" (que agora significa "via conexão")
  useEffect(() => {
    if (!allowUploadMode) {
      setImportMode("directory");
    }
  }, [allowUploadMode]);


  const isButtonDisabled = 
    isLoading || 
    !selectedDataSource || 
    (importMode === "upload" && !selectedFile) ||
    isMappingMissing; 

  return (
    <Card>
      <MDBox 
        mx={2} mt={-3} py={2} px={2} 
        variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info"
        display="flex" justifyContent="space-between" alignItems="center"
      >
        <MDTypography variant="h6" color="white">
          {currentSourceType === "CSV" ? "Nova Importação de CSV" : "Novo Processamento de Dados"}
        </MDTypography>
        <MDButton variant="contained" color="dark" onClick={onOpenTemplate}>
          Ajuda
        </MDButton>
      </MDBox>
      <MDBox p={3}>
        <Grid container spacing={3} alignItems="flex-start">
          {/* Lado Esquerdo: Controles */}
          <Grid item xs={12} md={6}>
            {/* ======================= INÍCIO DA ALTERAÇÃO (Layout 3 Passos) ======================= */}
            <MDBox mb={2}>
              {/* Dropdown 1: Origem */}
              <Autocomplete 
                options={origemOptions}
                value={selectedOrigem}
                disabled={isLoading} 
                onChange={handleOrigemChange} 
                renderInput={(params) => (
                  <TextField {...params} label="1. Selecione a Origem" />
                )} 
              />
            </MDBox>
            
            <MDBox mb={2}>
              {/* Dropdown 2: Fonte de Dados */}
              <Autocomplete 
                options={filteredDataSources}
                getOptionLabel={(option) => option.name_datasource || "Nome não encontrado"}
                value={selectedDataSource}
                disabled={isLoading || !selectedOrigem} 
                onChange={handleDataSourceChange} 
                renderInput={(params) => (
                  <TextField {...params} label="2. Selecione a Fonte de Dados" />
                )} 
              />
            </MDBox>

            {/* Seletor 3: Contas/Recursos (Agora é um Dropdown) */}
            {selectedOrigem === "SISTEMA" && selectedDataSource && (
              <MDBox mb={2}>
                 <Autocomplete 
                    options={targetOptions}
                    value={processingTarget}
                    disabled={isLoading} 
                    onChange={handleProcessingTargetChange} 
                    renderInput={(params) => (
                      <TextField {...params} label="3. Selecione o Alvo do Processamento" />
                    )} 
                  />
              </MDBox>
            )}
            {/* ======================== FIM DA ALTERAÇÃO (Layout 3 Passos) ========================= */}
            
            {/* Alerta de Mapeamento Faltando */}
            {isMappingMissing && (
              <MDAlert color="warning" sx={{ mt: 2, mb: 1 }}>
                <MDTypography variant="body2" color="white" fontWeight="medium">
                  Mapeamento Pendente: 
                </MDTypography>
                <MDTypography variant="body2" color="white">
                  {mappingMissingMessage}
                </MDTypography>
              </MDAlert>
            )}

            {/* Switch de Modo (Upload) */}
            {allowUploadMode && (
              <MDBox mb={2}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={importMode === "upload"} 
                      onChange={handleModeChange} 
                      disabled={isLoading}
                    />
                  }
                  label="Fazer upload manual de arquivo"
                />
              </MDBox>
            )}
            
            {/* Botão de Processar */}
            <MDButton 
              variant="gradient" color="info" fullWidth
              onClick={handleProcessClick} 
              disabled={isButtonDisabled}
            >
              {isLoading ? (
                <CircularProgress size={20} color="white" />
              ) : (
                <>
                  <Icon>play_arrow</Icon>&nbsp;
                  {importMode === 'upload' ? "Processar Arquivo" : 
                   (currentSourceType === "CSV" ? "Processar via Diretório" : "Processar via Conexão")}
                </>
              )}
            </MDButton>
          </Grid>

          {/* Lado Direito: Dropzone (Condicional) */}
          <Grid item xs={12} md={6}>
            {importMode === 'upload' && allowUploadMode ? (
              <Dropzone 
                file={selectedFile}
                onFileSelect={setSelectedFile}
                system={selectedDataSource ? selectedDataSource.name_datasource : null}
                disabled={!selectedDataSource || isLoading}
                disabledText="Selecione uma fonte de dados primeiro"
              />
            ) : (
              <MDBox 
                display="flex" 
                flexDirection="column" 
                justifyContent="center" 
                alignItems="center" 
                p={3} 
                sx={{ 
                  border: "2px dashed", 
                  borderColor: "grey.400", 
                  borderRadius: "md", 
                  minHeight: "150px", 
                  backgroundColor: "grey.100" 
                }}
              >
                <Icon fontSize="large" color="secondary">
                  {currentSourceType === "CSV" ? "folder_open" : "settings_ethernet"}
                </Icon>
                <MDTypography variant="h6" color="secondary" mt={1}>
                  {currentSourceType === "CSV" ? "Processamento via Diretório" : "Processamento via Conexão"}
                </MDTypography>
                <MDTypography variant="body2" color="text" align="center" mt={1}>
                  {currentSourceType === "CSV" 
                    ? "O arquivo será lido do diretório configurado na Fonte de Dados."
                    : "Os dados serão buscados da conexão de banco de dados configurada."}
                </MDTypography>
              </MDBox>
            )}
          </Grid>
        </Grid>
      </MDBox>
    </Card>
  );
}

// PropTypes atualizados
ImportCard.propTypes = {
  onProcessUpload: PropTypes.func.isRequired,
  onProcessDirectory: PropTypes.func.isRequired,
  dataSourceOptions: PropTypes.arrayOf(PropTypes.object).isRequired,
  isLoading: PropTypes.bool,
  onOpenTemplate: PropTypes.func.isRequired,
};

ImportCard.defaultProps = {
  isLoading: false,
};

export default ImportCard;