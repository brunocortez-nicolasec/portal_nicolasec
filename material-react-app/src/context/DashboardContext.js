// src/context/DashboardContext.js

import { createContext, useState, useContext } from "react";

const DashboardContext = createContext();

// Função auxiliar para carregar dados da sessionStorage de forma segura
const loadFromSession = (key) => {
  try {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error(`Erro ao carregar ${key} da sessão:`, error);
    return null;
  }
};

// Função auxiliar para salvar dados na sessionStorage
const saveToSession = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Erro ao salvar ${key} na sessão:`, error);
  }
};

export function DashboardProvider({ children }) {
  // Inicializa o estado com os dados da sessão, se existirem
  const [truIMData, setTruIMData] = useState(() => loadFromSession("truIMData"));
  const [truPAMData, setTruPAMData] = useState(() => loadFromSession("truPAMData"));
  const [truAMData, setTruAMData] = useState(() => loadFromSession("truAMData"));

  // Funções que atualizam o estado E salvam na sessão
  const updateTruIMData = (data) => {
    setTruIMData(data);
    saveToSession("truIMData", data);
  };

  const updateTruPAMData = (data) => {
    setTruPAMData(data);
    saveToSession("truPAMData", data);
  };

  const updateTruAMData = (data) => {
    setTruAMData(data);
    saveToSession("truAMData", data);
  };

  const value = {
    truIMData,
    updateTruIMData,
    truPAMData,
    updateTruPAMData,
    truAMData,
    updateTruAMData,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

// Hook customizado para usar o contexto facilmente nas páginas
export function useDashboard() {
  return useContext(DashboardContext);
}