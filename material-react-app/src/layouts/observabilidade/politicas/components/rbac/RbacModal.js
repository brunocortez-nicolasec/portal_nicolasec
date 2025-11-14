// material-react-app/src/layouts/observabilidade/politicas/components/rbac/RbacModal.js

import { useState, useEffect, useMemo } from "react"; 
import axios from "axios";
import PropTypes from 'prop-types';

// @mui material components
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";
import FormHelperText from "@mui/material/FormHelperText"; // Import for helper text
import MDInput from "components/MDInput"; // Importar MDInput
import { useMaterialUIController } from "context"; // Importar Context

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

// Componentes Filhos e Configs
import DynamicConditionFields from "./DynamicConditionFields";
import {
  conditionTypes,
  comparisonOperators,
  logicalOperators,
} from "./rbacConfig"; 

// Estado inicial do modal (movido para cá para incluir 'system')
const newInitialRbacState = {
  id: null,
  name: "",
  description: "",
  areaNegocio: "",
  processoNegocio: "",
  owner: "",
  system: null, // Campo para o sistema selecionado
  conditionType: conditionTypes[0],
  logicalOperator: logicalOperators[0],
  requiredProfile: null, // (Será 'requiredResource' no backend)
  singleAttributeCondition: { attribute: null, operator: comparisonOperators[0], value: "" },
  attributeConditions: [{ attribute: null, operator: comparisonOperators[0], value: "" }],
  grantedProfile: null, // (Será 'grantedResource' no backend)
};


function RbacModal({ open, onClose, onRefresh, showSnackbar, token, ruleToEdit, 
  systems, // Lista de todos os sistemas
// ======================= INÍCIO DA CORREÇÃO (Props) =======================
  resources: allResources, // 1. Corrigido
// ======================== FIM DA CORREÇÃO (Props) =========================
  attributes: allAttributes // Lista de atributos da Identity
}) {
  
  const [controller] = useMaterialUIController(); // Modo Escuro
  const { darkMode } = controller; // Modo Escuro

  const [currentRbacRule, setCurrentRbacRule] = useState(newInitialRbacState);
  const [isEditing, setIsEditing] = useState(false);
  const [filteredResources, setFilteredResources] = useState([]); // Corrigido


  useEffect(() => {
    if (open) {
      if (ruleToEdit) {
        setIsEditing(true);

        const systemId = ruleToEdit.systemId; // Corrigido
        const system = systems.find(s => s.id === systemId) || null;
        
// ======================= INÍCIO DA CORREÇÃO (useEffect) =======================
        // 2. Filtra 'allResources'
        const resourcesForThisSystem = system ? allResources.filter(r => r.systemId === system.id) : [];
        setFilteredResources(resourcesForThisSystem); 

        const type = conditionTypes.find((t) => t.id === ruleToEdit.conditionType) || conditionTypes[0];
        // 3. Usa 'grantedResourceId'
        const granted = resourcesForThisSystem.find((p) => p.id === ruleToEdit.grantedResourceId);
// ======================== FIM DA CORREÇÃO (useEffect) =========================
        const logicalOp = logicalOperators.find((lo) => lo.id === ruleToEdit.logicalOperator) || logicalOperators[0];
        let reqProfile = null;
        let singleAttrCond = { attribute: null, operator: comparisonOperators[0], value: "" };
        let multiAttrConds = [{ attribute: null, operator: comparisonOperators[0], value: "" }];

        if (type.id === "BY_PROFILE") {
// ======================= INÍCIO DA CORREÇÃO (useEffect) =======================
          // 4. Usa 'requiredResourceId'
          reqProfile = resourcesForThisSystem.find((p) => p.id === ruleToEdit.requiredResourceId);
// ======================== FIM DA CORREÇÃO (useEffect) =========================
        } else if (type.id === "BY_SINGLE_ATTRIBUTE") {
          singleAttrCond.attribute = allAttributes.find((a) => a.id === ruleToEdit.attributeName); // Corrigido
          singleAttrCond.operator =
            comparisonOperators.find((op) => op.id === ruleToEdit.attributeOperator) || // Corrigido
            comparisonOperators[0];
          singleAttrCond.value = ruleToEdit.attributeValue || ""; // Corrigido
        } else if (type.id === "BY_MULTIPLE_ATTRIBUTES" && Array.isArray(ruleToEdit.attributeConditions)) {
          multiAttrConds = ruleToEdit.attributeConditions.map((cond) => ({
            attribute: allAttributes.find((a) => a.id === cond.attributeName) || null, // Corrigido
            operator: comparisonOperators.find((op) => op.id === cond.operator) || comparisonOperators[0],
            value: cond.attributeValue || "", // Corrigido
          }));
          if (multiAttrConds.length === 0)
            multiAttrConds = [{ attribute: null, operator: comparisonOperators[0], value: "" }];
        }
        
        setCurrentRbacRule({
          id: ruleToEdit.id,
          name: ruleToEdit.name,
          description: ruleToEdit.description || "",
          areaNegocio: ruleToEdit.areaNegocio || "",
          processoNegocio: ruleToEdit.processoNegocio || "",
          owner: ruleToEdit.owner || "",
          system: system,
          conditionType: type,
          logicalOperator: logicalOp,
          requiredProfile: reqProfile,
          singleAttributeCondition: singleAttrCond,
          attributeConditions: multiAttrConds,
          grantedProfile: granted,
        });
      } else {
        setIsEditing(false);
        setCurrentRbacRule(newInitialRbacState);
        setFilteredResources([]); // Corrigido
      }
    }
  }, [open, ruleToEdit, systems, allResources, allAttributes]); // Corrigido

  const handleClose = () => {
    setCurrentRbacRule(newInitialRbacState);
    setFilteredResources([]); // Corrigido
    onClose();
  };

  // Handler unificado para campos de texto (TextField) e Autocomplete
  const handleFormChange = (e, fieldName = null, newValue = null) => {
    let nameToUpdate, valueToUpdate;

    if (fieldName) { // Veio de um Autocomplete (onChange(event, newValue))
      nameToUpdate = fieldName;
      valueToUpdate = newValue;
    } else { // Veio de um TextField (onChange(event))
      nameToUpdate = e.target.name;
      valueToUpdate = e.target.value;
    }

    setCurrentRbacRule((prev) => {
      const newState = { ...prev, [nameToUpdate]: valueToUpdate };

      if (nameToUpdate === 'system') {
          const newSystemId = valueToUpdate ? valueToUpdate.id : null;
// ======================= INÍCIO DA CORREÇÃO (handleFormChange) =======================
          // 5. Filtra 'allResources'
          const resourcesForThisSystem = newSystemId 
              ? allResources.filter(p => p.systemId === newSystemId) 
              : [];
          setFilteredResources(resourcesForThisSystem); // Corrigido
// ======================== FIM DA CORREÇÃO (handleFormChange) =========================
          
          newState.grantedProfile = null;
          newState.requiredProfile = null;
          // Reseta também o tipo de condição para forçar re-seleção
          newState.conditionType = conditionTypes[0]; 
          newState.singleAttributeCondition = { attribute: null, operator: comparisonOperators[0], value: "" };
          newState.attributeConditions = [{ attribute: null, operator: comparisonOperators[0], value: "" }];
      }

      if (nameToUpdate === 'conditionType') {
        newState.requiredProfile = null;
        newState.singleAttributeCondition = { attribute: null, operator: comparisonOperators[0], value: "" };
        newState.attributeConditions = [{ attribute: null, operator: comparisonOperators[0], value: "" }];
        newState.logicalOperator = logicalOperators[0];
      }
      return newState;
    });
  };
  
  const handleSingleAttrChange = (field, value) => {
    setCurrentRbacRule((prev) => ({
      ...prev,
      singleAttributeCondition: { ...prev.singleAttributeCondition, [field]: value }
    }));
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
      attributeConditions: [...prev.attributeConditions, { attribute: null, operator: comparisonOperators[0], value: "" }],
    }));
  };
  const handleRemoveAttributeCondition = (indexToRemove) => {
    if (currentRbacRule.attributeConditions.length <= 1) return;
    setCurrentRbacRule((prev) => ({
      ...prev,
      attributeConditions: prev.attributeConditions.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleSubmit = async () => {
    const {
      id, name, description, areaNegocio, processoNegocio, owner,
      system,
      conditionType, logicalOperator, grantedProfile, requiredProfile,
      singleAttributeCondition, attributeConditions,
    } = currentRbacRule;

    if (!name || !system || !conditionType || !grantedProfile) {
      showSnackbar("warning", "Campos Obrigatórios", "Nome, Sistema, Tipo de Condição e Recurso Concedido são obrigatórios.");
      return;
    }

    const payload = {
      name, description, areaNegocio, processoNegocio, owner,
      systemId: system.id,
      conditionType: conditionType.id,
      grantedProfile: grantedProfile ? { id: grantedProfile.id } : null, // (O backend vai interpretar como Resource)
      requiredProfile: null,
      // Renomeado para corresponder ao backend
      requiredAttribute: null, 
      requiredAttributeOperator: null,
      attributeValue: null,
      logicalOperator: null,
      attributeConditions: null,
    };

    try {
      switch (conditionType.id) {
        case "BY_PROFILE":
          if (!requiredProfile) throw new Error("Recurso Requerido é obrigatório.");
          payload.requiredProfile = requiredProfile ? { id: requiredProfile.id } : null; // (O backend vai interpretar como Resource)
          break;
        case "BY_SINGLE_ATTRIBUTE":
          if (!singleAttributeCondition.attribute || !singleAttributeCondition.operator || !singleAttributeCondition.value.trim())
            throw new Error("Atributo, Operador e Valor são obrigatórios.");
          payload.requiredAttribute = singleAttributeCondition.attribute ? { id: singleAttributeCondition.attribute.id } : null;
          payload.attributeValue = singleAttributeCondition.value;
          payload.requiredAttributeOperator = singleAttributeCondition.operator ? singleAttributeCondition.operator.id : null;
          break;
        case "BY_MULTIPLE_ATTRIBUTES":
          if (!logicalOperator) throw new Error("Operador Lógico (E/OU) é obrigatório.");
          payload.logicalOperator = logicalOperator.id;
          const validConditions = attributeConditions.filter((c) => c.attribute && c.operator && c.value.trim());
          if (validConditions.length === 0) throw new Error("Pelo menos uma Condição válida é obrigatória.");
          if (validConditions.some((c) => !c.attribute || !c.operator || !c.value.trim()))
            throw new Error("Todos os campos das Condições (Atributo, Operador, Valor) devem ser preenchidos.");
          payload.attributeConditions = validConditions.map((c) => ({
            attribute: c.attribute ? { id: c.attribute.id } : null,
            operator: c.operator ? c.operator.id : null,
            value: c.value,
          }));
          break;
        default:
          throw new Error("Tipo de Condição inválido.");
      }

      if (isEditing) {
        await axios.patch(`/rbac-rules/${id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post("/rbac-rules", payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      showSnackbar("success", "Sucesso", `Regra RBAC ${isEditing ? "atualizada" : "criada"}.`);
      handleClose();
      onRefresh();

    } catch (error) {
      console.error("Erro ao salvar regra RBAC:", error);
      const frontendErrorMessage = error.message.includes("obrigatório") || error.message.includes("inválido") || error.message.includes("Condição") || error.message.includes("Não é permitido");
      let displayMessage = "Ocorreu um erro inesperado.";

      if (frontendErrorMessage) {
        displayMessage = error.message;
      } else if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;
        displayMessage = typeof backendMessage === 'string' ? backendMessage : JSON.stringify(backendMessage);
      }
      showSnackbar("error", "Erro ao Salvar", displayMessage);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>{isEditing ? "Editar Regra RBAC" : "Criar Nova Regra RBAC"}</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" p={2}>
          <Grid container spacing={3}>
            {/* Campos Estáticos */}
            <Grid item xs={12}>
              <MDInput
                label="Nome da Regra *" name="name"
                value={currentRbacRule.name} 
                onChange={handleFormChange} 
                fullWidth required variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MDInput
                label="Área de negócio" name="areaNegocio"
                value={currentRbacRule.areaNegocio} 
                onChange={handleFormChange} 
                fullWidth variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MDInput
                label="Processo de negócio" name="processoNegocio"
                value={currentRbacRule.processoNegocio} 
                onChange={handleFormChange} 
                fullWidth variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <MDInput
                label="Owner" name="owner"
                value={currentRbacRule.owner} 
                onChange={handleFormChange} 
                fullWidth variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <MDInput
                label="Descrição" name="description"
                value={currentRbacRule.description} 
                onChange={handleFormChange} 
                fullWidth multiline rows={2} variant="outlined"
              />
            </Grid>

            {/* Seletor de Sistema */}
            <Grid item xs={12}>
              <Autocomplete
                options={systems}
                getOptionLabel={(option) => option.name || ""}
                value={currentRbacRule.system}
                onChange={(event, newValue) => handleFormChange(event, "system", newValue)} 
                isOptionEqualToValue={(option, value) => option.id === value?.id}
                disabled={isEditing}
                ListboxProps={{ sx: { backgroundColor: darkMode ? "grey.800" : "white" } }}
                renderInput={(params) => <MDInput {...params} label="Sistema Alvo *" required variant="outlined" />}
              />
              {isEditing && (
                 <FormHelperText>O sistema não pode ser alterado ao editar uma regra.</FormHelperText>
              )}
            </Grid>

            {/* Seletor de Tipo de Condição */}
            <Grid item xs={12}>
              <Autocomplete
                options={conditionTypes} getOptionLabel={(option) => option.label || ""}
                value={currentRbacRule.conditionType}
                onChange={(event, newValue) => handleFormChange(event, "conditionType", newValue)} 
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                disabled={!currentRbacRule.system}
                ListboxProps={{ sx: { backgroundColor: darkMode ? "grey.800" : "white" } }}
                renderInput={(params) => <MDInput {...params} label="Tipo de Condição *" required variant="outlined" />}
                disableClearable
              />
            </Grid>

            {/* Campos Dinâmicos */}
            <DynamicConditionFields
              conditionType={currentRbacRule.conditionType}
// ======================= INÍCIO DA CORREÇÃO (Props) =======================
              resources={filteredResources} // 6. Passa a prop correta 'filteredResources'
// ======================== FIM DA CORREÇÃO (Props) =========================
              attributes={allAttributes}
              values={currentRbacRule}
              onChange={handleFormChange} 
              onSingleAttrChange={handleSingleAttrChange}
              onListChange={handleAttributeListChange}
              onAddCondition={handleAddAttributeCondition}
              onRemoveCondition={handleRemoveAttributeCondition}
              isDisabled={!currentRbacRule.system}
            />

            {/* Campo Fixo de RESULTADO (Perfil Concedido) */}
            <Grid item xs={12}>
              <Autocomplete
// ======================= INÍCIO DA CORREÇÃO (Props) =======================
                options={filteredResources} // 7. Usa a prop correta 'filteredResources'
                getOptionLabel={(option) => `${option.name_resource} (${option.system?.name_system || 'Global'})` || ""} // 8. Lê o nome do recurso
// ======================== FIM DA CORREÇÃO (Props) =========================
                value={currentRbacRule.grantedProfile}
                onChange={(event, newValue) => handleFormChange(event, "grantedProfile", newValue)}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                disabled={!currentRbacRule.system}
                ListboxProps={{ sx: { backgroundColor: darkMode ? "grey.800" : "white" } }}
                renderInput={(params) => <MDInput {...params} label="Recurso Concedido *" required variant="outlined" />} // Label corrigido
              />
            </Grid>
          </Grid>
        </MDBox>
      </DialogContent>
      <DialogActions>
        <MDButton onClick={handleClose} color="secondary"> Cancelar </MDButton>
        <MDButton onClick={handleSubmit} variant="gradient" color="info">
          {isEditing ? "Salvar Alterações" : "Criar Regra"}
        </MDButton>
      </DialogActions>
    </Dialog>
  );
}

// PropTypes
RbacModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
  showSnackbar: PropTypes.func.isRequired,
  token: PropTypes.string,
  ruleToEdit: PropTypes.object,
  systems: PropTypes.arrayOf(PropTypes.object).isRequired,
// ======================= INÍCIO DA CORREÇÃO (PropTypes) =======================
  resources: PropTypes.arrayOf(PropTypes.object).isRequired, // 9. Corrigido
// ======================== FIM DA CORREÇÃO (PropTypes) =========================
  attributes: PropTypes.arrayOf(PropTypes.object).isRequired, 
};

// ======================= INÍCIO DA CORREÇÃO (DefaultProps) =======================
RbacModal.defaultProps = {
  token: null,
  ruleToEdit: null,
  resources: [], // 10. Corrigido
};
// ======================== FIM DA CORREÇÃO (DefaultProps) =========================

export default RbacModal;