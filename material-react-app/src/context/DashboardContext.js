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
  // --- ESTRUTURA DE ESTADO REFATORADA ---

  // Estado unificado para os dados de todas as plataformas
  const [plataformasData, setPlataformasData] = useState(() => {
    const dadosSalvos = loadFromSession("plataformasData");
    if (dadosSalvos) {
      return dadosSalvos;
    }
    // Lógica de migração: se a nova estrutura não existir,
    // tenta carregar os dados da estrutura antiga para não perder a sessão atual.
    const initialData = {
      TruIM: loadFromSession("truIMData") || [],
      TruPAM: loadFromSession("truPAMData") || [],
      TruAM: loadFromSession("truAMData") || [],
    };
    return initialData;
  });

  // Estado para controlar a plataforma selecionada
  const [plataformaSelecionada, setPlataformaSelecionadaState] = useState(() => {
    return loadFromSession("plataformaSelecionada") || "Geral";
  });

  // --- NOVAS FUNÇÕES ---

  // Função para alterar a plataforma selecionada
  const setPlataformaSelecionada = (plataforma) => {
    setPlataformaSelecionadaState(plataforma);
    saveToSession("plataformaSelecionada", plataforma);
  };

  // Função para atualizar os dados de uma plataforma específica (usado pelo importador de CSV)
  const updatePlataformaData = (plataforma, data) => {
    const novosDados = { ...plataformasData, [plataforma]: data };
    setPlataformasData(novosDados);
    saveToSession("plataformasData", novosDados);
  };
  
  // O valor fornecido pelo Context agora contém a nova estrutura
  const value = {
    plataformasData,
    plataformaSelecionada,
    setPlataformaSelecionada,
    updatePlataformaData,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

// Hook customizado para usar o contexto facilmente nas páginas
export function useDashboard() {
  return useContext(DashboardContext);
}