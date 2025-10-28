// src/layouts/observabilidade/politicas/components/rbac/RbacModal.js

import { useState, useEffect } from "react";
import axios from "axios";

// @mui material components
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDButton from "components/MDButton";

// Componentes Filhos e Configs
import DynamicConditionFields from "./DynamicConditionFields";
import {
  initialRbacState,
  conditionTypes,
  comparisonOperators,
  logicalOperators,
} from "./rbacConfig";

function RbacModal({ open, onClose, onRefresh, showSnackbar, token, ruleToEdit, profiles, attributes }) {
  const [currentRbacRule, setCurrentRbacRule] = useState(initialRbacState);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (open) {
      if (ruleToEdit) {
        setIsEditing(true);
        const type = conditionTypes.find((t) => t.id === ruleToEdit.conditionType) || conditionTypes[0];
        const granted = profiles.find((p) => p.id === ruleToEdit.grantedProfileId);
        const logicalOp = logicalOperators.find((lo) => lo.id === ruleToEdit.logicalOperator) || logicalOperators[0];
        let reqProfile = null;
        let singleAttrCond = { attribute: null, operator: comparisonOperators[0], value: "" };
        let multiAttrConds = [{ attribute: null, operator: comparisonOperators[0], value: "" }];

        if (type.id === "BY_PROFILE") {
          reqProfile = profiles.find((p) => p.id === ruleToEdit.requiredProfileId);
        } else if (type.id === "BY_SINGLE_ATTRIBUTE") {
          singleAttrCond.attribute = attributes.find((a) => a.id === ruleToEdit.requiredAttributeId);
          // Busca o objeto operador correto com base no ID salvo no banco
          singleAttrCond.operator =
            comparisonOperators.find((op) => op.id === ruleToEdit.requiredAttributeOperator) || // Usa o campo do operador
            comparisonOperators[0];
          singleAttrCond.value = ruleToEdit.requiredAttributeValue || "";
        } else if (type.id === "BY_MULTIPLE_ATTRIBUTES" && Array.isArray(ruleToEdit.attributeConditions)) {
          multiAttrConds = ruleToEdit.attributeConditions.map((cond) => ({
            attribute: attributes.find((a) => a.id === cond.attributeId) || null,
            // Busca o objeto operador correto com base no ID salvo no banco
            operator: comparisonOperators.find((op) => op.id === cond.operator) || comparisonOperators[0], // Usa o campo do operador
            value: cond.attributeValue || "",
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
          conditionType: type,
          logicalOperator: logicalOp, // Preenche o operador lógico
          requiredProfile: reqProfile,
          singleAttributeCondition: singleAttrCond,
          attributeConditions: multiAttrConds,
          grantedProfile: granted,
        });
      } else {
        setIsEditing(false);
        setCurrentRbacRule(initialRbacState);
      }
    }
  }, [open, ruleToEdit, profiles, attributes]);

  const handleClose = () => {
    setCurrentRbacRule(initialRbacState);
    onClose();
  };

  // Handlers
  const handleFormChange = (e, fieldName = null, newValue = null) => {
    let nameToUpdate, valueToUpdate;
    if (fieldName) { nameToUpdate = fieldName; valueToUpdate = newValue; }
    else { nameToUpdate = e.target.name; valueToUpdate = e.target.value; }

    setCurrentRbacRule((prev) => {
      const newState = { ...prev, [nameToUpdate]: valueToUpdate };
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

  // Handler de Submit
  const handleSubmit = async () => {
    const {
      id, name, description, areaNegocio, processoNegocio, owner,
      conditionType, logicalOperator, grantedProfile, requiredProfile,
      singleAttributeCondition, attributeConditions,
    } = currentRbacRule;

    if (!name || !conditionType || !grantedProfile) {
      showSnackbar("warning", "Campos Obrigatórios", "Nome, Tipo de Condição e Perfil Concedido são obrigatórios.");
      return;
    }

    // Monta o payload EXATAMENTE como o backend espera agora
    const payload = {
      name, description, areaNegocio, processoNegocio, owner,
      conditionType: conditionType.id,
      grantedProfile: grantedProfile ? { id: grantedProfile.id } : null,
      requiredProfile: null,
      requiredAttribute: null,
      requiredAttributeOperator: null, // <<-- Adicionado para inicializar
      attributeValue: null,
      logicalOperator: null, // <<-- Adicionado para inicializar (para MULTIPLE)
      attributeConditions: null,
    };

    try {
      switch (conditionType.id) {
        case "BY_PROFILE":
          if (!requiredProfile) throw new Error("Perfil Requerido é obrigatório.");
          payload.requiredProfile = requiredProfile ? { id: requiredProfile.id } : null;
          break;

        case "BY_SINGLE_ATTRIBUTE":
          if (!singleAttributeCondition.attribute || !singleAttributeCondition.operator || !singleAttributeCondition.value.trim())
            throw new Error("Atributo, Operador e Valor são obrigatórios.");

          payload.requiredAttribute = singleAttributeCondition.attribute ? { id: singleAttributeCondition.attribute.id } : null;
          payload.attributeValue = singleAttributeCondition.value;
          // --- CORREÇÃO AQUI: Adiciona o operador ao payload ---
          payload.requiredAttributeOperator = singleAttributeCondition.operator ? singleAttributeCondition.operator.id : null;
          break;

        case "BY_MULTIPLE_ATTRIBUTES":
          // Verifica o operador lógico
          if (!logicalOperator) throw new Error("Operador Lógico (E/OU) é obrigatório para Múltiplos Atributos.");
          payload.logicalOperator = logicalOperator.id; // Envia o ID do operador lógico (AND/OR)

          const validConditions = attributeConditions.filter((c) => c.attribute && c.operator && c.value.trim());

          if (validConditions.length === 0) throw new Error("Pelo menos uma Condição válida é obrigatória.");
          if (validConditions.some((c) => !c.attribute || !c.operator || !c.value.trim()))
            throw new Error("Todos os campos das Condições (Atributo, Operador, Valor) devem ser preenchidos.");

          // Mapeia as condições para o formato esperado pelo backend
          payload.attributeConditions = validConditions.map((c) => ({
            attribute: c.attribute ? { id: c.attribute.id } : null,
            operator: c.operator ? c.operator.id : null, // Envia o ID do operador da condição
            value: c.value,
          }));
          break;

        default:
          throw new Error("Tipo de Condição inválido.");
      }

      // Chamada API
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

      const frontendErrorMessage = error.message.includes("obrigatório") || error.message.includes("inválido") || error.message.includes("Condição");
      let displayMessage = "Ocorreu um erro inesperado.";

      if (frontendErrorMessage) {
        displayMessage = error.message;
      } else if (error.response?.data?.message) {
        const backendMessage = error.response.data.message;

        if (typeof backendMessage === 'string') {
          displayMessage = backendMessage;
        } else if (Array.isArray(backendMessage) && backendMessage.length > 0) {
          const firstError = backendMessage[0];
           if (firstError.constraints) {
             displayMessage = Object.values(firstError.constraints)[0];
           }
        }
      }

      showSnackbar("error", "Erro ao Salvar", displayMessage);
    }
  };

  // --- O RESTANTE DO MODAL (return) ---
  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>{isEditing ? "Editar Regra RBAC" : "Criar Nova Regra RBAC"}</DialogTitle>
      <DialogContent>
        <MDBox component="form" role="form" p={2}>
          <Grid container spacing={3}>
            {/* Campos Estáticos */}
            <Grid item xs={12}>
              <TextField
                label="Nome da Regra *" name="name"
                value={currentRbacRule.name} onChange={handleFormChange}
                fullWidth required />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Área de negócio" name="areaNegocio"
                value={currentRbacRule.areaNegocio} onChange={handleFormChange}
                fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Processo de negócio" name="processoNegocio"
                value={currentRbacRule.processoNegocio} onChange={handleFormChange}
                fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Owner" name="owner"
                value={currentRbacRule.owner} onChange={handleFormChange}
                fullWidth />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Descrição" name="description"
                value={currentRbacRule.description} onChange={handleFormChange}
                fullWidth multiline rows={2} />
            </Grid>

            {/* Seletor de Tipo de Condição */}
            <Grid item xs={12}>
              <Autocomplete
                options={conditionTypes} getOptionLabel={(option) => option.label || ""}
                value={currentRbacRule.conditionType}
                onChange={(event, newValue) => handleFormChange(event, "conditionType", newValue)}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                renderInput={(params) => <TextField {...params} label="Tipo de Condição *" required />}
                disableClearable />
            </Grid>

            {/* Campos Dinâmicos */}
            <DynamicConditionFields
              conditionType={currentRbacRule.conditionType}
              profiles={profiles} attributes={attributes} values={currentRbacRule}
              onChange={handleFormChange}
              onSingleAttrChange={handleSingleAttrChange}
              onListChange={handleAttributeListChange}
              onAddCondition={handleAddAttributeCondition}
              onRemoveCondition={handleRemoveAttributeCondition} />

            {/* Campo Fixo de RESULTADO */}
            <Grid item xs={12}>
              <Autocomplete
                options={profiles}
                getOptionLabel={(option) => option.name || ""} // <<< Garantindo que está 'name'
                value={currentRbacRule.grantedProfile}
                onChange={(event, newValue) => handleFormChange(event, "grantedProfile", newValue)}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                renderInput={(params) => <TextField {...params} label="Perfil Concedido *" required />} />
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

export default RbacModal;