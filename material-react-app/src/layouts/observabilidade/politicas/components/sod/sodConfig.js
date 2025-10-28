// src/layouts/observabilidade/politicas/components/sod/sodConfig.js

// Reutiliza os operadores de comparação do RBAC
// (Você pode importar de rbacConfig.js se preferir, ou duplicar aqui)
export const comparisonOperators = [
  { id: "equals", label: "Igual a (=)" },
  { id: "not_equals", label: "Diferente de (!=)" },
  { id: "contains", label: "Contém" },
  { id: "starts_with", label: "Começa com" },
  { id: "ends_with", label: "Termina com" },
];

// Tipos de Regras SOD disponíveis
export const ruleTypes = [
  { id: "ROLE_X_ROLE", label: "Role x Role" },
  { id: "ATTR_X_ROLE", label: "Atributo x Role" },
  { id: "ATTR_X_SYSTEM", label: "Atributo x Sistema" },
  // Adicionar outros tipos se existirem (ex: ATTR_X_ATTR)
];

// Objeto de estado inicial para o formulário do modal (ATUALIZADO)
export const initialState = {
  id: null,
  name: "",
  description: "",
  areaNegocio: "",
  processoNegocio: "",
  owner: "",
  ruleType: ruleTypes[0], // Default: Role x Role

  // Campos para Valor A
  valueASelection: null, // Objeto selecionado (Atributo ou Perfil)
  valueAOperator: comparisonOperators[0], // Operador (padrão 'equals', só relevante se valueA for Atributo)
  valueAValue: "", // Valor a comparar (só relevante se valueA for Atributo)

  // Campos para Valor B
  valueBSelection: null, // Objeto selecionado (Perfil ou Sistema)
  // valueBOperator: comparisonOperators[0], // Se ValueB pudesse ser Atributo
  // valueBValue: "",                     // Se ValueB pudesse ser Atributo
};