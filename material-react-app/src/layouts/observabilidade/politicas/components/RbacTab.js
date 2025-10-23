// src/layouts/observabilidade/politicas/components/RbacTab.js

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
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDSnackbar from "components/MDSnackbar";

// Material Dashboard 2 React example components
import DataTable from "examples/Tables/DataTable";

// Hook do Contexto Principal
import { useMaterialUIController } from "context";

// Tipos de Condição RBAC
const conditionTypes = [
  { id: "BY_PROFILE", label: "Concessão por Perfil Existente" },
  { id: "BY_SINGLE_ATTRIBUTE", label: "Concessão por Atributo Único" },
  { id: "BY_MULTIPLE_ATTRIBUTES", label: "Concessão por Múltiplos Atributos" },
];

// Objeto de estado inicial para o formulário do modal RBAC
const initialRbacState = {
  id: null,
  name: "",
  description: "",
  areaNegocio: "",
  processoNegocio: "",
  owner: "",
  conditionType: conditionTypes[0], // Default: Por Perfil
  requiredProfile: null,
  requiredAttribute: null,
  attributeValue: "",
  attributeConditions: [{ attribute: null, value: "" }],
  grantedProfile: null,
};

// Componente para renderizar os campos dinâmicos de CONDIÇÃO
function DynamicConditionFields({
  conditionType,
  profiles,
  attributes,
  values,
  onChange, // Recebe o handleFormChange corrigido
  onListChange,
  onAddCondition,
  onRemoveCondition
}) {
  switch (conditionType?.id) {
    case "BY_PROFILE":
      return (
        <Grid item xs={12}>
          <Autocomplete
            options={profiles}
            getOptionLabel={(option) => option.name || ""}
            value={values.requiredProfile}
            onChange={(event, newValue) => onChange(event, "requiredProfile", newValue)} // Passa event, fieldName, newValue
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            renderInput={(params) => <TextField {...params} label="Perfil Requerido *" required />}
          />
        </Grid>
      );
    case "BY_SINGLE_ATTRIBUTE":
      return (
        <>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              options={attributes}
              getOptionLabel={(option) => option.name || ""}
              value={values.requiredAttribute}
              onChange={(event, newValue) => onChange(event, "requiredAttribute", newValue)} // Passa event, fieldName, newValue
              isOptionEqualToValue={(option, value) => option?.id === value?.id}
              renderInput={(params) => <TextField {...params} label="Atributo Requerido *" required />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Valor do Atributo *"
              name="attributeValue" // Nome do campo no estado
              value={values.attributeValue}
              onChange={onChange} // Passa o evento diretamente para handleFormChange
              fullWidth
              required
            />
          </Grid>
        </>
      );
    case "BY_MULTIPLE_ATTRIBUTES":
      return (
        <Grid item xs={12}>
          <MDTypography variant="subtitle2" gutterBottom>Condições de Atributo (Todas devem ser verdadeiras)</MDTypography>
          <List dense>
            {values.attributeConditions.map((condition, index) => (
              <ListItem key={index} disableGutters sx={{ display: 'flex', gap: 2, mb: 1 }}>
                <Autocomplete
                  options={attributes}
                  getOptionLabel={(option) => option.name || ""}
                  value={condition.attribute}
                  onChange={(event, newValue) => onListChange(index, "attribute", newValue)}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  renderInput={(params) => <TextField {...params} label={`Atributo ${index + 1} *`} required sx={{ flexGrow: 1 }}/>}
                  sx={{ width: '45%' }}
                />
                <TextField
                  label={`Valor ${index + 1} *`}
                  value={condition.value}
                  onChange={(e) => onListChange(index, "value", e.target.value)}
                  required
                  sx={{ flexGrow: 1, width: '45%' }}
                />
                 <Tooltip title="Remover Condição">
                    <IconButton
                      onClick={() => onRemoveCondition(index)}
                      color="error"
                      size="small"
                      disabled={values.attributeConditions.length <= 1}
                      sx={{ alignSelf: 'center' }}
                    >
                      <Icon>remove_circle_outline</Icon>
                    </IconButton>
                 </Tooltip>
              </ListItem>
            ))}
          </List>
          <Button startIcon={<Icon>add</Icon>} onClick={onAddCondition} size="small">
            Adicionar Condição de Atributo
          </Button>
        </Grid>
      );
    default:
       return (
          <Grid item xs={12}>
              <MDTypography variant="caption" color="text">
                  Selecione um Tipo de Condição para definir os critérios.
              </MDTypography>
          </Grid>
      );
  }
}

function RbacTab() {
  const [controller] = useMaterialUIController();
  const { token } = controller;

  // --- Estados da Aba RBAC ---
  const [loadingData, setLoadingData] = useState(true);
  const [rbacRules, setRbacRules] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [allAttributes, setAllAttributes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRbacRule, setCurrentRbacRule] = useState(initialRbacState);

  // --- Estado do Snackbar ---
   const [snackbar, setSnackbar] = useState({
    open: false,
    color: "info",
    title: "",
    message: "",
  });
  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });


  // --- Funções de API ---
  const fetchInitialData = async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const rulesPromise = axios.get("/rbac-rules", { headers: { Authorization: `Bearer ${token}` } });
      const profilesPromise = axios.get("/profiles", { headers: { Authorization: `Bearer ${token}` } });
      const attributesPromise = axios.get("/identity-attributes", { headers: { Authorization: `Bearer ${token}` } });

      const [rulesResponse, profilesResponse, attributesResponse] = await Promise.all([
        rulesPromise,
        profilesPromise,
        attributesPromise,
      ]);

      setRbacRules(rulesResponse.data);
      setAllProfiles(profilesResponse.data);
      setAllAttributes(attributesResponse.data);
    } catch (error) {
      console.error("Erro ao buscar dados iniciais para RBAC:", error);
      setSnackbar({
        open: true, color: "error", title: "Erro de Rede",
        message: "Não foi possível carregar os dados necessários para RBAC.",
      });
    } finally {
      setLoadingData(false);
    }
  };

  // Carrega dados ao montar
  useEffect(() => {
    if (token) {
      fetchInitialData();
    }
  }, [token]);

  // --- Handlers do Modal RBAC ---
  const handleOpenModal = (rule = null) => {
    if (rule) {
      setIsEditing(true);
      const type = conditionTypes.find(t => t.id === rule.conditionType) || conditionTypes[0];
      const granted = allProfiles.find(p => p.id === rule.grantedProfileId);
      let reqProfile = null;
      let reqAttribute = null;
      let attrValue = "";
      let attrConditions = [{ attribute: null, value: "" }];

      if (type.id === 'BY_PROFILE') {
          reqProfile = allProfiles.find(p => p.id === rule.requiredProfileId);
      } else if (type.id === 'BY_SINGLE_ATTRIBUTE') {
          reqAttribute = allAttributes.find(a => a.id === rule.requiredAttributeId);
          attrValue = rule.requiredAttributeValue || "";
      } else if (type.id === 'BY_MULTIPLE_ATTRIBUTES' && Array.isArray(rule.attributeConditions)) {
          attrConditions = rule.attributeConditions.map(cond => ({
              attribute: allAttributes.find(a => a.id === cond.attributeId) || null,
              value: cond.attributeValue || ""
          }));
          if (attrConditions.length === 0) attrConditions = [{ attribute: null, value: "" }];
      }

      setCurrentRbacRule({
        id: rule.id,
        name: rule.name,
        description: rule.description || "",
        areaNegocio: rule.areaNegocio || "",
        processoNegocio: rule.processoNegocio || "",
        owner: rule.owner || "",
        conditionType: type,
        requiredProfile: reqProfile,
        requiredAttribute: reqAttribute,
        attributeValue: attrValue,
        attributeConditions: attrConditions,
        grantedProfile: granted,
      });
    } else {
      setIsEditing(false);
      setCurrentRbacRule(initialRbacState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setCurrentRbacRule(initialRbacState);
  };

  // Handler genérico corrigido
  const handleFormChange = (e, fieldName = null, newValue = null) => {
    let nameToUpdate, valueToUpdate;

    if (fieldName) { // Veio de um Autocomplete
      nameToUpdate = fieldName;
      valueToUpdate = newValue;
    } else { // Veio de um TextField
      nameToUpdate = e.target.name;
      valueToUpdate = e.target.value;
    }

    setCurrentRbacRule((prev) => {
      const newState = { ...prev, [nameToUpdate]: valueToUpdate };
      // Limpa campos dinâmicos SÓ se o TIPO mudou
      if (nameToUpdate === 'conditionType') {
        newState.requiredProfile = null;
        newState.requiredAttribute = null;
        newState.attributeValue = "";
        newState.attributeConditions = [{ attribute: null, value: "" }];
      }
      return newState;
    });
  };


  const handleAttributeListChange = (index, field, value) => {
    setCurrentRbacRule((prev) => {
      const newConditions = [...prev.attributeConditions];
      newConditions[index] = { ...newConditions[index], [field]: value };
      return { ...prev, attributeConditions: newConditions };
    });
  };

  const handleAddAttributeCondition = () => {
    setCurrentRbacRule((prev) => ({
      ...prev,
      attributeConditions: [...prev.attributeConditions, { attribute: null, value: "" }],
    }));
  };

   const handleRemoveAttributeCondition = (indexToRemove) => {
    if (currentRbacRule.attributeConditions.length <= 1) return;
    setCurrentRbacRule((prev) => ({
      ...prev,
      attributeConditions: prev.attributeConditions.filter((_, index) => index !== indexToRemove),
    }));
  };

  // Handler de Submit corrigido e descomentado
  const handleSubmit = async () => {
    const { id, name, description, areaNegocio, processoNegocio, owner,
            conditionType, grantedProfile, requiredProfile,
            requiredAttribute, attributeValue, attributeConditions
          } = currentRbacRule;

    if (!name || !conditionType || !grantedProfile) {
        setSnackbar({ open: true, color: "warning", title: "Campos Obrigatórios", message: "Nome, Tipo de Condição e Perfil Concedido são obrigatórios."});
        return;
    }

    const payload = {
        name, description, areaNegocio, processoNegocio, owner,
        conditionType: conditionType.id,
        grantedProfile: grantedProfile, // Envia o objeto {id, name}
        requiredProfile: null,
        requiredAttribute: null,
        attributeValue: null,
        attributeConditions: [],
    };

    try {
        switch (conditionType.id) {
            case 'BY_PROFILE':
                if (!requiredProfile) throw new Error("Perfil Requerido é obrigatório para este tipo.");
                payload.requiredProfile = requiredProfile;
                break;
            case 'BY_SINGLE_ATTRIBUTE':
                if (!requiredAttribute || !attributeValue.trim()) throw new Error("Atributo Requerido e Valor são obrigatórios para este tipo.");
                payload.requiredAttribute = requiredAttribute;
                payload.attributeValue = attributeValue;
                break;
            case 'BY_MULTIPLE_ATTRIBUTES':
                const validConditions = attributeConditions.filter(c => c.attribute && c.value.trim());
                if (validConditions.length === 0) {
                     throw new Error("Pelo menos uma Condição de Atributo válida é obrigatória para este tipo.");
                }
                if (validConditions.some(c => !c.attribute || !c.value.trim())) { // Validação dupla
                    throw new Error("Todos os campos das Condições de Atributo devem ser preenchidos.");
                }
                payload.attributeConditions = validConditions;
                break;
            default:
                 throw new Error("Tipo de Condição inválido.");
        }

        // Chamada API (POST ou PATCH)
        if (isEditing) {
            await axios.patch(`/rbac-rules/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        } else {
            await axios.post("/rbac-rules", payload, { headers: { Authorization: `Bearer ${token}` } });
        }
        setSnackbar({ open: true, color: "success", title: "Sucesso", message: `Regra RBAC ${isEditing ? 'atualizada' : 'criada'}.` });
        handleCloseModal(); // Fecha o modal após sucesso
        fetchInitialData(); // Recarrega a tabela

    } catch (error) {
        console.error("Erro ao salvar regra RBAC:", error);
        const message = error.message.includes("obrigatório") || error.message.includes("inválido")
                        ? error.message
                        : error.response?.data?.message || "Ocorreu um erro inesperado.";
        setSnackbar({ open: true, color: "error", title: "Erro ao Salvar", message: message });
        // Não fecha o modal em caso de erro para o usuário corrigir
    }
  };


  const handleDelete = async (ruleId) => {
     if (window.confirm("Tem certeza que deseja deletar esta regra RBAC?")) {
        try {
            await axios.delete(`/rbac-rules/${ruleId}`, { headers: { Authorization: `Bearer ${token}` } });
            setSnackbar({ open: true, color: "success", title: "Sucesso", message: "Regra RBAC deletada." });
            fetchInitialData();
        } catch (error) {
             console.error("Erro ao deletar regra RBAC:", error);
             setSnackbar({ open: true, color: "error", title: "Erro ao Deletar", message: error.response?.data?.message || "Erro." });
        }
     }
  };


  // --- Definição da Tabela RBAC ---
  const getConditionDisplay = (rule) => {
    switch (rule.conditionType) {
        case 'BY_PROFILE':
            return `Requer Perfil: ${rule.requiredProfile?.name || '(inválido)'}`;
        case 'BY_SINGLE_ATTRIBUTE':
            const attrName = allAttributes.find(a => a.id === rule.requiredAttributeId)?.name || rule.requiredAttributeId;
            return `Atributo: ${attrName} = "${rule.requiredAttributeValue}"`;
        case 'BY_MULTIPLE_ATTRIBUTES':
            if (!Array.isArray(rule.attributeConditions) || rule.attributeConditions.length === 0) {
                return "(Nenhuma condição definida)";
            }
            return rule.attributeConditions.map(cond => {
                 const attrNameCond = allAttributes.find(a => a.id === cond.attributeId)?.name || cond.attributeId;
                 return `${attrNameCond} = "${cond.attributeValue}"`;
            }).join(' E ');
        default:
            return '(Condição desconhecida)';
    }
  };


  const rbacColumns = [
    { Header: "Nome da Regra", accessor: "name", width: "25%" },
    { Header: "Tipo Condição", accessor: "conditionType", Cell: ({value}) => conditionTypes.find(ct => ct.id === value)?.label || value },
    { Header: "Condição", accessor: "conditionDisplay", Cell: ({ row }) => getConditionDisplay(row.original), width: "30%" },
    { Header: "Perfil Concedido", accessor: "grantedProfile.name", Cell: ({value}) => value || '(inválido)'},
    { Header: "Owner", accessor: "owner", Cell: ({value}) => value || "N/A" },
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
        <MDTypography variant="h5">Gerenciar Regras de RBAC</MDTypography>
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
            Carregando regras RBAC...
          </MDTypography>
        </MDBox>
      ) : (
        <DataTable
          table={{ columns: rbacColumns, rows: rbacRules }}
          isSorted={true}
          entriesPerPage={true}
          showTotalEntries={true}
          canSearch={true}
          pagination={{ variant: "gradient", color: "info" }}
        />
      )}

      {/* --- Modal de Criação/Edição RBAC --- */}
      <Dialog open={isModalOpen} onClose={handleCloseModal} fullWidth maxWidth="md">
        <DialogTitle>{isEditing ? "Editar Regra RBAC" : "Criar Nova Regra RBAC"}</DialogTitle>
        <DialogContent>
          <MDBox component="form" role="form" p={2}>
            <Grid container spacing={3}>
              {/* Campos Estáticos */}
              <Grid item xs={12}>
                <TextField label="Nome da Regra *" name="name" value={currentRbacRule.name} onChange={handleFormChange} fullWidth required />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Área de negócio" name="areaNegocio" value={currentRbacRule.areaNegocio} onChange={handleFormChange} fullWidth />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Processo de negócio" name="processoNegocio" value={currentRbacRule.processoNegocio} onChange={handleFormChange} fullWidth />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField label="Owner" name="owner" value={currentRbacRule.owner} onChange={handleFormChange} fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Descrição" name="description" value={currentRbacRule.description} onChange={handleFormChange} fullWidth multiline rows={2} />
              </Grid>

              {/* Seletor de Tipo de Condição */}
              <Grid item xs={12}>
                <Autocomplete
                  options={conditionTypes}
                  getOptionLabel={(option) => option.label || ""}
                  value={currentRbacRule.conditionType}
                  onChange={(event, newValue) => handleFormChange(event, "conditionType", newValue)}
                  isOptionEqualToValue={(option, value) => option?.id === value?.id}
                  renderInput={(params) => <TextField {...params} label="Tipo de Condição *" required />}
                  disableClearable
                />
              </Grid>

              {/* Campos Dinâmicos de CONDIÇÃO Renderizados */}
              <DynamicConditionFields
                conditionType={currentRbacRule.conditionType}
                profiles={allProfiles}
                attributes={allAttributes}
                values={currentRbacRule}
                onChange={handleFormChange}
                onListChange={handleAttributeListChange}
                onAddCondition={handleAddAttributeCondition}
                onRemoveCondition={handleRemoveAttributeCondition}
              />

               {/* Campo Fixo de RESULTADO */}
               <Grid item xs={12}>
                  <Autocomplete
                      options={allProfiles}
                      getOptionLabel={(option) => option.name || ""}
                      value={currentRbacRule.grantedProfile}
                      onChange={(event, newValue) => handleFormChange(event, "grantedProfile", newValue)}
                      isOptionEqualToValue={(option, value) => option?.id === value?.id}
                      renderInput={(params) => <TextField {...params} label="Perfil Concedido *" required />}
                  />
               </Grid>

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

export default RbacTab;