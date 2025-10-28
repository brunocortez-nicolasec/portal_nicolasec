// src/layouts/observabilidade/politicas/components/rbac/rbacConfig.js

// Configurações das regras
export const conditionTypes = [
  { id: "BY_PROFILE", label: "Concessão por Perfil Existente" },
  { id: "BY_SINGLE_ATTRIBUTE", label: "Concessão por Atributo Único" },
  { id: "BY_MULTIPLE_ATTRIBUTES", label: "Concessão por Múltiplos Atributos" },
];

export const comparisonOperators = [
  { id: "equals", label: "Igual a (=)" },
  { id: "not_equals", label: "Diferente de (!=)" },
  { id: "contains", label: "Contém" },
  { id: "starts_with", label: "Começa com" },
  { id: "ends_with", label: "Termina com" },
];

export const logicalOperators = [
  { id: "AND", label: "E (Todas as condições devem ser verdadeiras)" },
  { id: "OR", label: "OU (Qualquer condição pode ser verdadeira)" },
];

// Estado inicial do modal
export const initialRbacState = {
  id: null,
  name: "",
  description: "",
  areaNegocio: "",
  processoNegocio: "",
  owner: "",
  conditionType: conditionTypes[0],
  logicalOperator: logicalOperators[0],
  requiredProfile: null,
  singleAttributeCondition: { attribute: null, operator: comparisonOperators[0], value: "" },
  attributeConditions: [{ attribute: null, operator: comparisonOperators[0], value: "" }],
  grantedProfile: null,
};