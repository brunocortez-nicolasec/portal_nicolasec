// material-react-app/src/layouts/observabilidade/mapeamentoDados/index.js

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

// Componentes
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import MDAlert from "components/MDAlert";
import CircularProgress from "@mui/material/CircularProgress";
import { Autocomplete } from "@mui/material";
import Icon from "@mui/material/Icon";
import MDInput from "components/MDInput";
import DataTable from "examples/Tables/DataTable";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

// ======================= INÍCIO DA ALTERAÇÃO =======================
// REMOVIDO: Mapas de tradução (SYSTEM_UI_TO_DB_KEY, SYSTEM_DB_TO_UI_KEY)

// Definição dos nossos esquemas de destino (usando nomes EXATOS do schema.prisma)
const SCHEMA_MAP = {
  RH: [
    "identity_id_hr", "name_hr", "email_hr", "status_hr", "user_type_hr", "cpf_hr", "extra_data_hr"
  ],
  IDM: [
    "identity_id_idm", "name_idm", "email_idm", "status_idm", "extra_data_idm"
  ],
  // Nomes EXATOS do model DataMappingSystem
  SISTEMA_CONTAS: [
    "accounts_id_in_system", 
    "accounts_name", 
    "accounts_email", 
    "accounts_status", 
    "accounts_identity_id"
  ],
  SISTEMA_RECURSOS: [
    "resources_name", 
    "resources_description"
    // "resources_id_in_system" (removido, pois o nome é a chave)
  ],
};

// Definição dos campos obrigatórios (usando nomes EXATOS do schema.prisma)
const REQUIRED_FIELDS_MAP = {
  RH: ["identity_id_hr", "email_hr", "status_hr"],
  IDM: ["identity_id_idm", "email_idm", "status_idm"],
  SISTEMA_CONTAS: ["accounts_id_in_system", "accounts_identity_id"],
  SISTEMA_RECURSOS: ["resources_name"],
};
// ======================== FIM DA ALTERAÇÃO =========================


function MapeamentoDados() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loadingList, setLoadingList] = useState(true);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [error, setError] = useState(null);

  const [allDataSources, setAllDataSources] = useState([]);
  const [selectedDataSource, setSelectedDataSource] = useState(null);

  const [selectedOrigem, setSelectedOrigem] = useState(null);
  const origemOptions = ["RH", "IDM", "SISTEMA"];

  const [mappingTarget, setMappingTarget] = useState("CONTAS"); 
  
  const handleMappingTargetChange = (event, newTarget) => {
    if (newTarget !== null) {
      setMappingTarget(newTarget);
      setMappings({}); 
    }
  };

  // Filtra a lista de fontes de dados com base na origem selecionada
  const filteredDataSources = useMemo(() => {
    if (!selectedOrigem) {
      return [];
    }
    return allDataSources.filter(ds => ds.origem_datasource === selectedOrigem);
  }, [allDataSources, selectedOrigem]);

  const [csvHeader, setCsvHeader] = useState([]);
  const [targetSchema, setTargetSchema] = useState([]); // Agora contém chaves do DB
  const [mappings, setMappings] = useState({}); // Agora contém chaves do DB

  const [notification, setNotification] = useState({ open: false, color: "info", message: "" });


  const api = axios.create({
    baseURL: "/",
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  useEffect(() => {
    const fetchAllDataSources = async () => {
      setLoadingList(true);
      setError(null);
      try {
        const response = await api.get("/systems");
        const data = response.data || [];
        setAllDataSources(data);

        if (id) {
          const idAsNumber = parseInt(id, 10);
          const sourceFromUrl = data.find(s => s.id === idAsNumber);
          if (sourceFromUrl) {
            setSelectedOrigem(sourceFromUrl.origem_datasource);
            setSelectedDataSource(sourceFromUrl);
          } else {
            setError(`Fonte de dados com ID ${id} não encontrada.`);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar fontes de dados:", err);
        setError(err.response?.data?.message || "Erro ao buscar lista de fontes.");
      } finally {
        setLoadingList(false);
      }
    };
    fetchAllDataSources();
  }, [id]);

  // Este useEffect agora depende do 'mappingTarget' (Contas/Recursos)
  useEffect(() => {
    const fetchMappingData = async () => {
      if (!selectedDataSource) {
        setCsvHeader([]);
        setTargetSchema([]);
        setMappings({});
        return;
      }

      try {
        setLoadingMapping(true);
        setError(null);

        const origem = selectedDataSource.origem_datasource;
        
        let savedMappingsDB = {}; // Mapeamento salvo (chaves do DB)
        let schemaKey = origem;   // Chave do schema (chaves da UI/DB)
        let diretorio = null;
        
        // ======================= INÍCIO DA ALTERAÇÃO (fetch) =======================
        // A lógica de tradução foi removida
        
        const savedMappingsUI = {}; // O estado local

        if (origem === "RH" && selectedDataSource.hrConfig) {
          savedMappingsDB = selectedDataSource.mappingRH || {};
          diretorio = selectedDataSource.hrConfig.diretorio_hr;
          Object.assign(savedMappingsUI, savedMappingsDB); // Sem tradução
          
        } else if (origem === "IDM" && selectedDataSource.idmConfig) {
          savedMappingsDB = selectedDataSource.mappingIDM || {};
          Object.assign(savedMappingsUI, savedMappingsDB); // Sem tradução
          
        } else if (origem === "SISTEMA" && selectedDataSource.systemConfig) {
          
          savedMappingsDB = selectedDataSource.mappingSystem || {}; // Pega o map *completo*
          
          if (mappingTarget === "CONTAS") {
            schemaKey = "SISTEMA_CONTAS";
            diretorio = selectedDataSource.systemConfig.diretorio_contas;
            // Filtra o map salvo para incluir apenas chaves de Contas
            Object.keys(savedMappingsDB).forEach(key => {
              if (key.startsWith("accounts_")) { // <-- Usa o prefixo do schema
                savedMappingsUI[key] = savedMappingsDB[key];
              }
            });
            
          } else if (mappingTarget === "RECURSOS") {
            schemaKey = "SISTEMA_RECURSOS";
            diretorio = selectedDataSource.systemConfig.diretorio_recursos;
            // Filtra o map salvo para incluir apenas chaves de Recursos
            Object.keys(savedMappingsDB).forEach(key => {
              if (key.startsWith("resources_")) { // <-- Usa o prefixo do schema
                savedMappingsUI[key] = savedMappingsDB[key];
              }
            });
          }
        }
        
        // Limpa campos de ID (eles vêm do DB mas não são mapeáveis)
        delete savedMappingsUI.id;
        delete savedMappingsUI.dataSourceId;
        
        setMappings(savedMappingsUI); // Salva o estado
        // ======================== FIM DA ALTERAÇÃO (fetch) =========================
        
        if (SCHEMA_MAP[schemaKey]) {
          setTargetSchema(SCHEMA_MAP[schemaKey]); 
        } else {
          throw new Error(`Esquema de mapeamento '${schemaKey}' desconhecido.`);
        }

        // Se a fonte for CSV (lógica de diretório)
        if (diretorio) {
          const responseHeader = await api.post("/datasources/test-csv", { diretorio });
          setCsvHeader(responseHeader.data.header.split(','));
        } else if (origem === "RH" || (origem === "SISTEMA" && mappingTarget)) {
           throw new Error(`Diretório (diretorio_hr ou diretorio_${mappingTarget.toLowerCase()}) não encontrado.`);
        } else {
           setCsvHeader(["Mapeamento não-CSV ainda não implementado."]);
        }

      } catch (err) {
        const message = err.response?.data?.message || err.message || "Erro ao carregar dados do mapeamento.";
        console.error("Erro no Mapeamento:", err);
        setError(message);
      } finally {
        setLoadingMapping(false);
      }
    };

    fetchMappingData();
  }, [selectedDataSource, mappingTarget]); 


  // Handler para o SEGUNDO dropdown (Fonte de Dados)
  const handleDropdownChange = (event, newValue) => {
    setSelectedDataSource(newValue);
    if (newValue) {
      navigate(`/observabilidade/mapeamento-dados/${newValue.id}`);
    } else {
      navigate(`/observabilidade/mapeamento-dados`);
    }
  };

  // Novo handler para o PRIMEIRO dropdown (Origem)
  const handleOrigemChange = (event, newValue) => {
    setSelectedOrigem(newValue);
    setMappingTarget("CONTAS"); 
    
    if (selectedDataSource) {
      setSelectedDataSource(null);
    }
    navigate(`/observabilidade/mapeamento-dados`);
  };

  const handleMappingChange = (schemaColumn, csvColumnValue) => {
    setMappings((prev) => ({
      ...prev,
      [schemaColumn]: csvColumnValue,
    }));
  };

  // Salvar agora mescla o mapeamento atual com o mapeamento completo
  const handleSaveMapping = async () => {
    if (!selectedDataSource) {
      setError("Nenhuma fonte de dados selecionada.");
      return;
    }

    setLoadingMapping(true); 

    let finalMappingPayload = mappings; // Para RH e IDM

    // ======================= INÍCIO DA ALTERAÇÃO (Salvar) =======================
    // Lógica de tradução removida. Agora apenas mesclamos.
    if (selectedDataSource.origem_datasource === "SISTEMA") {
      const fullSavedMap = selectedDataSource.mappingSystem || {};
      
      const otherTargetKeys = {};
      if (mappingTarget === "CONTAS") {
        // Mantém as chaves de RECURSOS salvas
        Object.keys(fullSavedMap).forEach(key => {
          if (key.startsWith("resources_")) {
            otherTargetKeys[key] = fullSavedMap[key];
          }
        });
      } else {
        // Mantém as chaves de CONTAS salvas
        Object.keys(fullSavedMap).forEach(key => {
          if (key.startsWith("accounts_")) {
            otherTargetKeys[key] = fullSavedMap[key];
          }
        });
      }
      
      // O payload final é o outro target (salvo) + o target atual (do estado 'mappings')
      finalMappingPayload = { 
        ...otherTargetKeys, 
        ...mappings // 'mappings' state já tem as chaves corretas (ex: 'accounts_name')
      };
      
      delete finalMappingPayload.id;
      delete finalMappingPayload.dataSourceId;
    }
    // ======================== FIM DA ALTERAÇÃO (Salvar) =========================

    try {
      await api.post(`/systems/${selectedDataSource.id}/mapping`, finalMappingPayload); 

      // Atualiza o 'selectedDataSource' no estado local com o payload salvo
      if (selectedDataSource.origem_datasource === "SISTEMA") {
        setSelectedDataSource(prev => ({
          ...prev,
          mappingSystem: finalMappingPayload
        }));
      }
      
      setNotification({
        open: true,
        color: "success",
        message: "Mapeamento salvo com sucesso!"
      });

    } catch (err) {
      const message = err.response?.data?.message || "Erro ao salvar o mapeamento.";
      console.error("Erro ao salvar mapeamento:", err);
      setError(message); 
    } finally {
      setLoadingMapping(false);
    }
  };
  

  // Formata os dados do cabeçalho do CSV para o DataTable
  const csvTableData = useMemo(() => {
    return {
      columns: [
        { Header: `Colunas de: ${selectedDataSource?.name_datasource || "CSV"}`, accessor: "columnName", width: "100%" },
      ],
      rows: csvHeader.map((headerName) => ({
        columnName: (
          <MDTypography variant="button" fontWeight="medium">
            {headerName}
          </MDTypography>
        ),
      })),
    };
  }, [csvHeader, selectedDataSource]);


  // Memo para verificar se o botão 'Salvar' deve ser desabilitado
  const isSaveDisabled = useMemo(() => {
    if (!selectedDataSource) return true;

    const origem = selectedDataSource.origem_datasource;
    let schemaKey = origem;
    if (origem === "SISTEMA") {
      schemaKey = `SISTEMA_${mappingTarget}`;
    }
    const requiredFields = REQUIRED_FIELDS_MAP[schemaKey] || [];

    for (const field of requiredFields) {
      if (!mappings[field]) {
        return true; 
      }
    }

    return false; 
  }, [mappings, selectedDataSource, mappingTarget]); 


  // Formata os dados do esquema de destino para o DataTable
  const targetTableData = useMemo(() => {
    const origem = selectedDataSource?.origem_datasource;
    let schemaKey = origem;
    if (origem === "SISTEMA") {
      schemaKey = `SISTEMA_${mappingTarget}`;
    }
    const requiredFields = REQUIRED_FIELDS_MAP[schemaKey] || [];
    const schema = SCHEMA_MAP[schemaKey] || []; 

    const selectedValues = Object.values(mappings).filter(Boolean); 

    return {
      columns: [
        { Header: `Colunas da Aplicação (${origem === "SISTEMA" ? mappingTarget : origem})`, accessor: "schemaColumn", width: "50%" },
        { Header: "Mapear para Coluna do CSV", accessor: "mappingDropdown", width: "50%" },
      ],
      rows: schema.map((schemaName) => { 
        const isRequired = requiredFields.includes(schemaName);
        const currentValue = mappings[schemaName] || null;

        return {
          schemaColumn: (
            <MDTypography variant="button" fontWeight="medium" sx={{ pl: 1 }}>
              {schemaName}
              {isRequired && (
                <MDTypography component="span" variant="button" fontWeight="medium" color="error" sx={{ ml: 0.5 }}>
                  *
                </MDTypography>
              )}
            </MDTypography>
          ),
          mappingDropdown: (
            <Autocomplete
              options={csvHeader}
              value={currentValue} 
              onChange={(event, newValue) => {
                handleMappingChange(schemaName, newValue);
              }}
              getOptionDisabled={(option) =>
                selectedValues.includes(option) && option !== currentValue
              }
              renderInput={(params) => (
                <MDInput {...params} label="Selecionar Coluna" variant="standard" />
              )}
              sx={{ minWidth: "200px" }}
            />
          )
        };
      }),
    };
  }, [csvHeader, mappings, selectedDataSource, mappingTarget]); 

  const closeNotification = () => setNotification({ ...notification, open: false });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2} mt={-3} py={3} px={2}
                variant="gradient" bgColor="info" borderRadius="lg" coloredShadow="info"
                display="flex" justifyContent="space-between" alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  Mapeamento de Dados
                </MDTypography>
              </MDBox>

              <MDBox p={3}>
                <MDBox mb={3}>
                  <MDTypography variant="h5">Selecionar Fonte de Dados</MDTypography>
                  <MDTypography variant="body2" color="text" mt={1} mb={2}>
                    Selecione o tipo de origem e a fonte de dados para iniciar o mapeamento.
                  </MDTypography>
                  
                  {loadingList ? (
                    <MDBox display="flex" justifyContent="center"><CircularProgress color="info" /></MDBox>
                  ) : (
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          options={origemOptions}
                          value={selectedOrigem}
                          onChange={handleOrigemChange} 
                          renderInput={(params) => (
                            <MDInput {...params} label="1. Selecionar Tipo de Origem" />
                          )}
                          fullWidth
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Autocomplete
                          options={filteredDataSources} 
                          getOptionLabel={(option) => option.name_datasource || "Nome não encontrado"}
                          value={selectedDataSource}
                          disabled={!selectedOrigem || filteredDataSources.length === 0} 
                          onChange={handleDropdownChange} 
                          renderInput={(params) => (
                            <MDInput {...params} label="2. Selecionar Fonte de Dados" />
                          )}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  )}
                </MDBox>

                {/* A condição agora é (origem é SISTEMA E uma fonte de dados foi selecionada) */}
                {selectedOrigem === "SISTEMA" && selectedDataSource && (
                  <MDBox mb={3}>
                    <MDTypography variant="h6" fontSize="0.875rem">3. Selecionar Tipo de Mapeamento</MDTypography>
                    <ToggleButtonGroup
                      color="info"
                      value={mappingTarget}
                      exclusive
                      onChange={handleMappingTargetChange}
                      aria-label="Tipo de Mapeamento"
                      sx={{ mt: 1 }}
                    >
                      <ToggleButton value="CONTAS">Contas</ToggleButton>
                      <ToggleButton value="RECURSOS">Recursos</ToggleButton>
                    </ToggleButtonGroup>
                  </MDBox>
                )}


                {error && (
                  <MDAlert color="error" sx={{ mb: 2 }}>
                    <MDTypography variant="body2" color="white">{error}</MDTypography>
                  </MDAlert>
                )}
                
                {!loadingList && selectedDataSource && selectedOrigem && (
                  <MDBox mt={3}>
                    {loadingMapping ? (
                      <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="20vh">
                        <CircularProgress color="info" />
                      </MDBox>
                    ) : (
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={5}>
                          <DataTable
                            table={csvTableData}
                            isSorted={false}
                            entriesPerPage={false}
                            showTotalEntries={false}
                            noEndBorder
                          />
                        </Grid>
                        <Grid item xs={12} md={2} sx={{ textAlign: "center", alignSelf: "center" }}>
                          <Icon fontSize="large" color="info">arrow_forward</Icon>
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <DataTable
                            table={targetTableData}
                            isSorted={false}
                            entriesPerPage={false}
                            showTotalEntries={false}
                            noEndBorder
                          />
                        </Grid>

                        <Grid item xs={12}>
                          <MDBox display="flex" justifyContent="flex-end" mt={3}>
                            <MDButton 
                              variant="gradient" 
                              color="info" 
                              onClick={handleSaveMapping}
                              disabled={isSaveDisabled || loadingMapping}
                            >
                              {loadingMapping ? "Salvando..." : "Salvar Mapeamento"}
                            </MDButton> 
                          </MDBox>
                        </Grid>

                      </Grid>
                    )}
                  </MDBox>
                )}
                
              </MDBox>
            </Card>
          </Grid>
        </Grid>
        
        <MDSnackbar
          color={notification.color}
          icon={notification.color === "success" ? "check" : "notifications"}
          title="Mapeamento de Dados"
          content={notification.message}
          dateTime="agora"
          open={notification.open}
          onClose={closeNotification}
          close={closeNotification}
        />
        
      </MDBox>
    </DashboardLayout>
  );
}

export default MapeamentoDados;