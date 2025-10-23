// src/layouts/observabilidade/politicas/components/SodTab.js

import { useState, useEffect } from "react";
import axios from "axios";

// @mui material components
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React example components
import DataTable from "examples/Tables/DataTable";

// Hook do Contexto Principal
import { useMaterialUIController } from "context";

// Tipos de Regras SOD disponíveis
const ruleTypes = [
  { id: "ROLE_X_ROLE", label: "Role x Role" },
  { id: "ATTR_X_ROLE", label: "Atributo x Role" },
  { id: "ATTR_X_SYSTEM", label: "Atributo x Sistema" },
];

// Objeto de estado inicial para o formulário do modal (atualizado)
const initialState = {
  id: null,
  name: "",
  description: "",
  areaNegocio: "",
  processoNegocio: "",
  owner: "",
  ruleType: ruleTypes[0], // Default: Role x Role
  valueA: null,
  valueB: null,
};

// Componente para renderizar os campos dinâmicos
function DynamicRuleFields({ ruleType, profiles, systems, attributes, values, onChange }) {
  switch (ruleType?.id) {
    case "ROLE_X_ROLE":
      return (
        <>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={profiles}
              getOptionLabel={(option) => option.name || ""}
              value={values.valueA}
              onChange={(event, newValue) => onChange("valueA", newValue)}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderInput={(params) => <TextField {...params} label="Perfil Conflitante A *" required />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={profiles}
              getOptionLabel={(option) => option.name || ""}
              value={values.valueB}
              onChange={(event, newValue) => onChange("valueB", newValue)}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderInput={(params) => <TextField {...params} label="Perfil Conflitante B *" required />}
            />
          </Grid>
        </>
      );
    case "ATTR_X_ROLE":
      return (
        <>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={attributes} // Vem do estado agora
              getOptionLabel={(option) => option.name || ""}
              value={values.valueA}
              onChange={(event, newValue) => onChange("valueA", newValue)}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderInput={(params) => <TextField {...params} label="Atributo Conflitante *" required />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={profiles}
              getOptionLabel={(option) => option.name || ""}
              value={values.valueB}
              onChange={(event, newValue) => onChange("valueB", newValue)}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderInput={(params) => <TextField {...params} label="Perfil Conflitante *" required />}
            />
          </Grid>
        </>
      );
    case "ATTR_X_SYSTEM":
      return (
        <>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={attributes} // Vem do estado agora
              getOptionLabel={(option) => option.name || ""}
              value={values.valueA}
              onChange={(event, newValue) => onChange("valueA", newValue)}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderInput={(params) => <TextField {...params} label="Atributo Conflitante *" required />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={systems}
              getOptionLabel={(option) => option.name || ""}
              value={values.valueB}
              onChange={(event, newValue) => onChange("valueB", newValue)}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              renderInput={(params) => <TextField {...params} label="Sistema Conflitante *" required />}
            />
          </Grid>
        </>
      );
    default:
      // Renderiza placeholders ou nada se nenhum tipo estiver selecionado (não deve acontecer com disableClearable)
      return (
          <Grid item xs={12}>
              <MDTypography variant="caption" color="text">
                  Selecione um Tipo de Regra para ver os campos de comparação.
              </MDTypography>
          </Grid>
      );
  }
}

function SodTab() {
  const [controller] = useMaterialUIController();
  const { token } = controller;

  // --- Estados da Aba SOD ---
  const [loadingData, setLoadingData] = useState(true);
  const [sodRules, setSodRules] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [allSystems, setAllSystems] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]); // Inicializado vazio
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRule, setCurrentRule] = useState(initialState);

  // --- Estado do Snackbar ---
  const [snackbar, setSnackbar] = useState({
    open: false,
    color: "info",
    title: "",
    message: "",
  });
  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });

  // --- Funções de API da Aba SOD ---
  const fetchInitialData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const rulesPromise = axios.get("/sod-rules", { headers: { Authorization: `Bearer ${token}` } });
      const profilesPromise = axios.get("/profiles", { headers: { Authorization: `Bearer ${token}` } });
      const systemsPromise = axios.get("/systems", { headers: { Authorization: `Bearer ${token}` } });
      const attributesPromise = axios.get("/identity-attributes", { headers: { Authorization: `Bearer ${token}` } });

      const [rulesResponse, profilesResponse, systemsResponse, attributesResponse] = await Promise.all([
        rulesPromise,
        profilesPromise,
        systemsPromise,
        attributesPromise,
      ]);

      setSodRules(rulesResponse.data);
      setAllProfiles(profilesResponse.data);
      setAllSystems(systemsResponse.data);
      setAllAttributes(attributesResponse.data);
    } catch (error) {
      console.error("Erro ao buscar dados iniciais de SOD:", error);
      setSnackbar({
        open: true,
        color: "error",
        title: "Erro de Rede",
        message: "Não foi possível carregar os dados necessários. Verifique a API.",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Carrega os dados quando o componente montar
  useEffect(() => {
    if (token) {
      fetchInitialData();
    }
  }, [token]);

  // --- Handlers do Modal SOD ---
  const handleOpenModal = (rule = null) => {
    if (rule) {
      setIsEditing(true);
      // TODO: Ajustar o carregamento dos dados para edição!
      // Encontrar o tipo, valorA e valorB corretos nas listas com base nos IDs/Tipos vindos do 'rule'
      const type = ruleTypes.find(t => t.id === rule.ruleType) || ruleTypes[0];
      let loadedValueA = null;
      let loadedValueB = null;

      // Lógica para encontrar o objeto ValueA
      if (rule.valueAType === 'PROFILE') {
        loadedValueA = allProfiles.find(p => p.id === parseInt(rule.valueAId, 10));
      } else if (rule.valueAType === 'ATTRIBUTE') {
        loadedValueA = allAttributes.find(a => a.id === rule.valueAId);
      }

      // Lógica para encontrar o objeto ValueB
       if (rule.valueBType === 'PROFILE') {
        loadedValueB = allProfiles.find(p => p.id === parseInt(rule.valueBId, 10));
      } else if (rule.valueBType === 'SYSTEM') {
        loadedValueB = allSystems.find(s => s.id === parseInt(rule.valueBId, 10));
      } else if (rule.valueBType === 'ATTRIBUTE') {
           // Adicionado caso falte: Atributo x Atributo (se aplicável no futuro)
           loadedValueB = allAttributes.find(a => a.id === rule.valueBId);
       }


      setCurrentRule({
        id: rule.id,
        name: rule.name,
        description: rule.description || "",
        areaNegocio: rule.areaNegocio || "",
        processoNegocio: rule.processoNegocio || "",
        owner: rule.owner || "",
        ruleType: type,
        valueA: loadedValueA || null, // Carrega o objeto encontrado
        valueB: loadedValueB || null, // Carrega o objeto encontrado
      });
    } else {
      setIsEditing(false);
      setCurrentRule(initialState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentRule(initialState);
  };

  const handleFormChange = (e, fieldName = null, newValue = null) => {
    if (fieldName && newValue !== undefined) {
      setCurrentRule((prev) => ({
        ...prev,
        [fieldName]: newValue,
        valueA: null,
        valueB: null,
      }));
    } else {
      const { name, value } = e.target;
      setCurrentRule((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleDynamicValueChange = (field, value) => {
    setCurrentRule((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const { id, name, description, areaNegocio, processoNegocio, owner, ruleType, valueA, valueB } = currentRule;

    if (!name || !ruleType || !valueA || !valueB) {
      setSnackbar({
        open: true, color: "warning", title: "Campos Obrigatórios",
        message: "Nome, Tipo e os dois campos de comparação são obrigatórios.",
      });
      return;
    }

    // Envia o objeto selecionado inteiro para o backend
    // O backend (services/sod/index.js -> extractDynamicValues) extrairá o ID correto.
    const payload = {
      name,
      description,
      areaNegocio,
      processoNegocio,
      owner,
      ruleTypeId: ruleType.id,
      valueA: valueA, // Envia o objeto {id, name} ou string
      valueB: valueB, // Envia o objeto {id, name} ou string
    };

    try {
      if (isEditing) {
        await axios.patch(`/sod-rules/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post("/sod-rules", payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      setSnackbar({ open: true, color: "success", title: "Sucesso", message: `Regra ${isEditing ? 'atualizada' : 'criada'}.` });
      handleCloseModal();
      fetchInitialData(); // Recarrega tudo
    } catch (error) {
      console.error("Erro ao salvar regra:", error);
      setSnackbar({ open: true, color: "error", title: "Erro ao Salvar", message: error.response?.data?.message || "Ocorreu um erro inesperado." });
    }
  };

  const handleDelete = async (ruleId) => {
    if (window.confirm("Tem certeza que deseja deletar esta regra?")) {
      try {
        await axios.delete(`/sod-rules/${ruleId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setSnackbar({
          open: true,
          color: "success",
          title: "Sucesso",
          message: "Regra de SOD deletada com sucesso.",
        });
        fetchInitialData();
      } catch (error) {
        console.error("Erro ao deletar regra:", error);
        setSnackbar({
          open: true,
          color: "error",
          title: "Erro ao Deletar",
          message: error.response?.data?.message || "Ocorreu um erro inesperado.",
        });
      }
    }
  };

  // --- Definição da Tabela SOD ---
  // Função helper para buscar o nome correspondente ao ID e Tipo
  const getValueName = (type, id) => {
      if (!type || !id) return "N/A";
      let list;
      let keyField = 'id'; // Campo a ser comparado (geralmente 'id')
      let idToCompare = id; // ID a ser comparado

      switch (type) {
          case 'PROFILE':
              list = allProfiles;
              idToCompare = parseInt(id, 10); // ID do perfil é número
              break;
          case 'SYSTEM':
              list = allSystems;
               idToCompare = parseInt(id, 10); // ID do sistema é número
              break;
          case 'ATTRIBUTE':
              list = allAttributes;
              // ID do atributo já é string ('userType', 'status', etc.)
              break;
          default:
              return id; // Retorna o ID se o tipo for desconhecido
      }
      const found = list.find(item => item[keyField] === idToCompare);
      return found ? found.name : id; // Retorna o nome ou o ID se não encontrar
  };

  const sodColumns = [
    { Header: "Nome da Regra", accessor: "name", width: "20%" },
    { Header: "Tipo", accessor: "ruleType", Cell: ({value}) => ruleTypes.find(rt => rt.id === value)?.label || value },
    { Header: "Valor A", accessor: "valueAId", Cell: ({ row }) => getValueName(row.original.valueAType, row.original.valueAId) },
    { Header: "Valor B", accessor: "valueBId", Cell: ({ row }) => getValueName(row.original.valueBType, row.original.valueBId) },
    { Header: "Owner", accessor: "owner", Cell: ({value})=> value || "N/A", width: "15%" },
    {
      Header: "Ações",
      accessor: "actions",
      align: "center",
      Cell: ({ row: { original } }) => (
        <MDBox>
          <Tooltip title="Editar">
            <IconButton onClick={() => handleOpenModal(original)}>
              <Icon>edit</Icon>
            </IconButton>
          </Tooltip>
          <Tooltip title="Deletar">
            <IconButton color="error" onClick={() => handleDelete(original.id)}>
              <Icon>delete</Icon>
            </IconButton>
          </Tooltip>
        </MDBox>
      ),
    },
  ];

  return (
    <>
      {/* Botão Adicionar e Tabela */}
      <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <MDTypography variant="h5">Gerenciar Regras de SOD</MDTypography>
        <MDButton variant="gradient" color="info" onClick={() => handleOpenModal(null)}>
          <Icon sx={{ mr: 1 }}>add</Icon>
          Adicionar Regra
        </MDButton>
      </MDBox>

      {/* Seção da Tabela */}
      {loadingData ? (
        <MDBox p={3} sx={{ textAlign: "center" }}>
          <CircularProgress color="info" />
          <MDTypography variant="body2" color="text" sx={{ mt: 2 }}>
            Carregando regras de SOD...
          </MDTypography>
        </MDBox>
       ) : (
        <DataTable
          table={{ columns: sodColumns, rows: sodRules }}
          isSorted={true}
          entriesPerPage={true}
          showTotalEntries={true}
          canSearch={true}
          pagination={{ variant: "gradient", color: "info" }}
        />
       )}

      {/* --- Modal de Criação/Edição SOD --- */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="md">
        <DialogTitle>{isEditing ? "Editar Regra de SOD" : "Criar Nova Regra de SOD"}</DialogTitle>
        <DialogContent>
          <MDBox component="form" role="form" p={2}>
            <Grid container spacing={3}>
              {/* Campos Estáticos */}
              <Grid item xs={12}>
                <TextField label="Nome da Regra *" name="name" value={currentRule.name} onChange={handleFormChange} fullWidth required />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Área de negócio" name="areaNegocio" value={currentRule.areaNegocio} onChange={handleFormChange} fullWidth />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Processo de negócio" name="processoNegocio" value={currentRule.processoNegocio} onChange={handleFormChange} fullWidth />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Owner" name="owner" value={currentRule.owner} onChange={handleFormChange} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Descrição" name="description" value={currentRule.description} onChange={handleFormChange} fullWidth multiline rows={2} />
              </Grid>

              {/* Seletor de Tipo */}
              <Grid item xs={12}>
                <Autocomplete
                  options={ruleTypes}
                  getOptionLabel={(option) => option.label || ""}
                  value={currentRule.ruleType}
                  onChange={(event, newValue) => handleFormChange(event, "ruleType", newValue)}
                  isOptionEqualToValue={(option, value) => option.id === value?.id}
                  renderInput={(params) => <TextField {...params} label="Tipo de Regra *" required />}
                  disableClearable
                />
              </Grid>

              {/* Campos Dinâmicos Renderizados */}
              <DynamicRuleFields
                ruleType={currentRule.ruleType}
                profiles={allProfiles}
                systems={allSystems}
                attributes={allAttributes} // Passando estado atualizado
                values={{ valueA: currentRule.valueA, valueB: currentRule.valueB }}
                onChange={handleDynamicValueChange}
              />

            </Grid>
          </MDBox>
        </DialogContent>
        <DialogActions>
          <MDButton onClick={handleCloseModal} color="secondary"> Cancelar </MDButton>
          <MDButton onClick={handleSubmit} variant="gradient" color="info">
            {isEditing ? "Salvar Alterações" : "Criar Regra"}
          </MDButton>
        </DialogActions>
      </Dialog>

      {/* --- Snackbar para Notificações --- */}
      <MDSnackbar
        color={snackbar.color}
        icon={snackbar.color === "success" ? "check" : "warning"}
        title={snackbar.title}
        content={snackbar.message}
        dateTime="agora"
        open={snackbar.open}
        onClose={closeSnackbar}
        close={closeSnackbar}
      />
    </>
  );
}

export default SodTab;