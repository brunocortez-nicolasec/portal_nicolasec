// material-react-app/src/layouts/observabilidade/mapeamentoDados/index.js

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useMaterialUIController } from "context"; // Necessário para o Modo Escuro
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText"; // Para a lista de colunas
// ======================= INÍCIO DA ALTERAÇÃO (Novos Imports) =======================
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
// ======================== FIM DA ALTERAÇÃO (Novos Imports) =========================

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
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";
// import ToggleButton from "@mui/material/ToggleButton"; // <-- Removido
// import ToggleButtonGroup from "@mui/material/ToggleButtonGroup"; // <-- Removido

// Definição dos nossos esquemas de destino (usando nomes EXATOS do schema.prisma)
const SCHEMA_MAP = {
  RH: [
    "identity_id_hr", "name_hr", "email_hr", "status_hr", "user_type_hr", "cpf_hr", "extra_data_hr"
  ],
  IDM: [
    "identity_id_idm", "name_idm", "email_idm", "status_idm", "extra_data_idm"
  ],
  SISTEMA_CONTAS: [
    "accounts_id_in_system", 
    "accounts_name", 
    "accounts_email", 
    "accounts_cpf", 
    "accounts_status", 
    "accounts_identity_id",
    "accounts_resource_name" 
  ],
  SISTEMA_RECURSOS: [
    "resources_name", 
    "resources_description",
    "resources_permissions"
  ],
};

// Definição dos campos obrigatórios (usando nomes EXATOS do schema.prisma)
const REQUIRED_FIELDS_MAP = {
  RH: ["identity_id_hr", "email_hr", "status_hr"],
  IDM: ["identity_id_idm", "email_idm", "status_idm"], 
  SISTEMA_CONTAS: [
    "accounts_id_in_system", 
    "accounts_email", 
    "accounts_identity_id",
    "accounts_resource_name" 
  ], 
  SISTEMA_RECURSOS: ["resources_name", "resources_permissions"],
};

// Definição das descrições (Helper Text)
const DESCRIPTION_MAP = {
  // RH
  "identity_id_hr": "Obrigatório. Chave única da identidade (ex: Matrícula, ID Único).",
  "name_hr": "Opcional. Nome completo do colaborador.",
  "email_hr": "Obrigatório. Email corporativo (usado para vínculo se o ID falhar).",
  "status_hr": "Obrigatório. Situação no RH (ex: 'Ativo', 'Inativo', 'Ferias').",
  "user_type_hr": "Opcional. Tipo de colaborador (ex: 'Funcionario', 'Terceiro').",
  "cpf_hr": "Opcional, mas recomendado. CPF (usado para vínculo e divergências).",
  "extra_data_hr": "Opcional. Outros dados que deseja armazenar (ex: Centro de Custo).",
  
  // IDM (Se for usar)
  "identity_id_idm": "Obrigatório. ID único no IDM.",
  "name_idm": "Opcional. Nome no IDM.",
  "email_idm": "Obrigatório. Email no IDM.",
  "status_idm": "Obrigatório. Status no IDM.",
  
  // SISTEMA_CONTAS
  "accounts_id_in_system": "Obrigatório. Chave única da conta no sistema (ex: 'ASILVA', 'bruno.cortez').",
  "accounts_name": "Opcional. Nome de exibição da conta (ex: 'Ana S. (SAP)').",
  "accounts_email": "Obrigatório. Email da conta no sistema.",
  "accounts_cpf": "Opcional. CPF registrado no sistema (usado para encontrar divergências).",
  "accounts_status": "Opcional. Status da conta no sistema (ex: 'Ativo', 'Bloqueado').",
  "accounts_identity_id": "Obrigatório. O ID do RH (Matrícula) para vincular esta conta à identidade correta.",
  "accounts_resource_name": "Obrigatório. Lista de perfis/recursos, separados por ponto-e-vírgula (ex: \"PERFIL_A;PERFIL_B\").",

  // SISTEMA_RECURSOS
  "resources_name": "Obrigatório. Nome/ID único do recurso/perfil (ex: 'SAP_FIN_LEITURA').",
  "resources_description": "Opcional. Descrição do que o recurso faz.",
  "resources_permissions": "Obrigatório. Lista de permissões, separadas por ponto-e-vírgula (ex: \"leitura;escrita\")."
};


function MapeamentoDados() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [controller] = useMaterialUIController();
  const { darkMode } = controller;

  const [loadingList, setLoadingList] = useState(true);
  const [loadingMapping, setLoadingMapping] = useState(false);
  const [error, setError] = useState(null);

  const [allDataSources, setAllDataSources] = useState([]);
  const [selectedDataSource, setSelectedDataSource] = useState(null);

  const [selectedOrigem, setSelectedOrigem] = useState(null);
  const origemOptions = ["RH", "IDM", "SISTEMA"];

  const [mappingTarget, setMappingTarget] = useState("CONTAS"); 
  
  // ======================= INÍCIO DA ALTERAÇÃO (Abas) =======================
  // O ToggleButton enviava "CONTAS" ou "RECURSOS".
  // O Tab envia um índice (0 ou 1).
  const handleMappingTargetChange = (event, newIndex) => {
    const newTarget = newIndex === 0 ? "CONTAS" : "RECURSOS";
    if (newTarget !== null) {
      setMappingTarget(newTarget);
      setMappings({}); 
    }
  };
  // ======================== FIM DA ALTERAÇÃO (Abas) =========================

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
        
        const savedMappingsUI = {}; // O estado local

        if (origem === "RH" && selectedDataSource.hrConfig) {
          savedMappingsDB = selectedDataSource.mappingRH || {};
          diretorio = selectedDataSource.hrConfig.diretorio_hr;
          Object.assign(savedMappingsUI, savedMappingsDB); // Sem tradução
          
        } else if (origem === "IDM" && selectedDataSource.idmConfig) {
          savedMappingsDB = selectedDataSource.mappingIDM || {};
          Object.assign(savedMappingsUI, savedMappingsDB); 
          
        } else if (origem === "SISTEMA" && selectedDataSource.systemConfig) {
          
          savedMappingsDB = selectedDataSource.mappingSystem || {}; // Pega o map *completo*
          
          if (mappingTarget === "CONTAS") {
            schemaKey = "SISTEMA_CONTAS";
            diretorio = selectedDataSource.systemConfig.diretorio_contas;
            Object.keys(savedMappingsDB).forEach(key => {
              if (key.startsWith("accounts_")) { 
                savedMappingsUI[key] = savedMappingsDB[key];
              }
            });
            
          } else if (mappingTarget === "RECURSOS") {
            schemaKey = "SISTEMA_RECURSOS";
            diretorio = selectedDataSource.systemConfig.diretorio_recursos;
            Object.keys(savedMappingsDB).forEach(key => {
              if (key.startsWith("resources_")) { 
                savedMappingsUI[key] = savedMappingsDB[key];
              }
            });
          }
        }
        
        delete savedMappingsUI.id;
        delete savedMappingsUI.dataSourceId;
        
        setMappings(savedMappingsUI); 
        
        if (SCHEMA_MAP[schemaKey]) {
          setTargetSchema(SCHEMA_MAP[schemaKey]); 
        } else {
          throw new Error(`Esquema de mapeamento '${schemaKey}' desconhecido.`);
        }

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

    if (selectedDataSource.origem_datasource === "SISTEMA") {
      const fullSavedMap = selectedDataSource.mappingSystem || {};
      
      const otherTargetKeys = {};
      if (mappingTarget === "CONTAS") {
        Object.keys(fullSavedMap).forEach(key => {
          if (key.startsWith("resources_")) {
            otherTargetKeys[key] = fullSavedMap[key];
          }
        });
      } else {
        Object.keys(fullSavedMap).forEach(key => {
          if (key.startsWith("accounts_")) {
            otherTargetKeys[key] = fullSavedMap[key];
          }
        });
      }
      
      finalMappingPayload = { 
        ...otherTargetKeys, 
        ...mappings
      };
      
      delete finalMappingPayload.id;
      delete finalMappingPayload.dataSourceId;
    }

    try {
      await api.post(`/systems/${selectedDataSource.id}/mapping`, finalMappingPayload); 

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


  // A lógica de `targetTableData` foi movida para `mappingFields`
  // para ser usada no novo layout de Lista.
  const mappingFields = useMemo(() => {
    const origem = selectedDataSource?.origem_datasource;
    let schemaKey = origem;
    if (origem === "SISTEMA") {
      schemaKey = `SISTEMA_${mappingTarget}`;
    }
    const requiredFields = REQUIRED_FIELDS_MAP[schemaKey] || [];
    const schema = SCHEMA_MAP[schemaKey] || []; 

    const selectedValues = Object.values(mappings).filter(Boolean); 

    return schema.map((schemaName) => { 
      const isRequired = requiredFields.includes(schemaName);
      const currentValue = mappings[schemaName] || null;
      const description = DESCRIPTION_MAP[schemaName] || null;

      // Retorna os componentes JSX puros para serem usados na Lista
      return {
        key: schemaName,
        label: (
          <MDTypography variant="button" fontWeight="medium" color="text">
            {schemaName}
            {isRequired && (
              <MDTypography component="span" variant="button" fontWeight="medium" color="error" sx={{ ml: 0.5 }}>
                *
              </MDTypography>
            )}
          </MDTypography>
        ),
        dropdown: (
          <Autocomplete
            options={csvHeader}
            value={currentValue} 
            onChange={(event, newValue) => {
              handleMappingChange(schemaName, newValue);
            }}
            getOptionDisabled={(option) =>
              selectedValues.includes(option) && option !== currentValue
            }
            // Adiciona suporte ao Modo Escuro
            ListboxProps={{
              sx: {
                backgroundColor: darkMode ? "grey.800" : "white",
              },
            }}
            renderInput={(params) => (
              <MDInput 
                {...params} 
                label="Selecionar Coluna do CSV" 
                variant="outlined" // 1. Variante corrigida para 'outlined'
                helperText={description} // 2. Helper text adicionado
                FormHelperTextProps={{ // 3. Estilo para o helper text
                  sx: { 
                    color: (theme) => theme.palette.text.secondary,
                    fontSize: '0.75rem',
                    marginLeft: 0 // Remove o recuo padrão do helper text
                  } 
                }}
              /> 
            )}
            sx={{ minWidth: "200px" }}
          />
        )
      };
    });
  }, [csvHeader, mappings, selectedDataSource, mappingTarget, darkMode]);

  const closeNotification = () => setNotification({ ...notification, open: false });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            {/* Card 1: Seleção (Topo da Página) */}
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
                          // Adiciona suporte ao Modo Escuro
                          ListboxProps={{
                            sx: {
                              backgroundColor: darkMode ? "grey.800" : "white",
                            },
                          }}
                          renderInput={(params) => (
                            <MDInput {...params} label="1. Selecionar Tipo de Origem" variant="outlined" />
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
                          // Adiciona suporte ao Modo Escuro
                          ListboxProps={{
                            sx: {
                              backgroundColor: darkMode ? "grey.800" : "white",
                            },
                          }}
                          renderInput={(params) => (
                            <MDInput {...params} label="2. Selecionar Fonte de Dados" variant="outlined" />
                          )}
                          fullWidth
                        />
                      </Grid>
                    </Grid>
                  )}
                </MDBox>

                {/* Seletor de Alvo (Contas/Recursos) (Passo 2) */}
                {selectedOrigem === "SISTEMA" && selectedDataSource && (
// ======================= INÍCIO DA ALTERAÇÃO (Troca por Abas) =======================
                  // 1. O MDBox agora contém as Abas
                  <MDBox mb={3}>
                    <MDTypography variant="h6" fontSize="0.875rem" mb={1}>3. Selecionar Tipo de Mapeamento</MDTypography>
                    <Tabs
                      value={mappingTarget === "CONTAS" ? 0 : 1} // Controla a aba ativa
                      onChange={handleMappingTargetChange}
                      textColor="inherit"
                      indicatorColor="info" // Usa a cor 'info' para a linha
                      aria-label="Tipo de Mapeamento"
                    >
                      <Tab
                        label="Contas"
                        icon={<Icon fontSize="small" sx={{ mr: 1 }}>person</Icon>}
                        iconPosition="start"
                      />
                      <Tab
                        label="Recursos"
                        icon={<Icon fontSize="small" sx={{ mr: 1 }}>workspaces</Icon>}
                        iconPosition="start"
                      />
                    </Tabs>
                  </MDBox>
// ======================== FIM DA ALTERAÇÃO (Troca por Abas) =========================
                )}

                {/* Alerta de Erro */}
                {error && (
                  <MDAlert color="error" sx={{ mb: 2 }}>
                    <MDTypography variant="body2" color="white">{error}</MDTypography>
                  </MDAlert>
                )}
              </MDBox>
            </Card>
          </Grid>
          
          {/* Seção de Mapeamento (Passo 3) - SÓ APARECE SE TUDO ESTIVER OK */}
          {!loadingList && selectedDataSource && selectedOrigem && (
            <Grid item xs={12} mt={3}> 
              {loadingMapping ? (
                <MDBox display="flex" justifyContent="center" alignItems="center" minHeight="20vh">
                  <CircularProgress color="info" />
                </MDBox>
              ) : (
                <Grid container spacing={3}>
                  
                  {/* Card ÚNICO de Mapeamento */}
                  <Grid item xs={12}>
                    <Card sx={{ height: "100%" }}>
                      <MDBox
                        variant="gradient"
                        bgColor="info" // Mudado para 'info' para combinar com o topo
                        borderRadius="lg"
                        coloredShadow="info" // Mudado para 'info'
                        p={2}
                        mx={2}
                        mt={-3}
                      >
                        <MDTypography variant="h6" color="white">
                          Colunas da Aplicação ({selectedDataSource?.origem_datasource === "SISTEMA" ? mappingTarget : selectedDataSource?.origem_datasource})
                        </MDTypography>
                      </MDBox>
                      <MDBox pt={3} px={3}>
                        <MDTypography variant="body2" color="text" mb={2}>
                          Mapeie as colunas do seu arquivo (disponíveis no dropdown) para os campos obrigatórios (*) e opcionais da aplicação.
                        </MDTypography>
                        <List>
                          {mappingFields.map((field) => (
                            <ListItem 
                              key={field.key} 
                              sx={{ 
                                display: 'flex', 
                                flexDirection: { xs: 'column', sm: 'row' }, // Empilha em telas pequenas
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                py: 1.5, 
                                px: 0, 
                                borderBottom: '1px solid', 
                                borderColor: 'divider' 
                              }}
                            >
                              <MDBox flex="1 1 40%" pr={2} mb={{ xs: 1.5, sm: 0 }} sx={{width: '100%'}}>
                                {field.label}
                              </MDBox>
                              <MDBox flex="1 1 60%" sx={{width: '100%'}}>
                                {field.dropdown}
                              </MDBox>
                            </ListItem>
                          ))}
                        </List>
                      </MDBox>
                    </Card>
                  </Grid>

                  {/* Botão Salvar */}
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
            </Grid>
          )}
          
        </Grid>
      </MDBox>
      
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
      
    </DashboardLayout>
  );
}

export default MapeamentoDados;