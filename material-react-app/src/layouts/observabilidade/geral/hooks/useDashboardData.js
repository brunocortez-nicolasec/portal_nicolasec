// material-react-app/src/layouts/observabilidade/geral/hooks/useDashboardData.js

import { useMemo } from "react";

function useDashboardData(metrics, isLoading) {
  const displayData = useMemo(() => {
    // ======================= INÍCIO DA ALTERAÇÃO =======================
    // A estrutura defaultData agora espelha 100% a estrutura do objeto de retorno final
    const defaultData = {
        imDisplay: {
            pills: { total: 0, ativos: 0, inativos: 0, desconhecido: 0 },
            tiposChart: { labels: [], datasets: { data: [] } },
            tiposList: [],
            divergencias: { 
                inativosRHAtivosApp: 0, 
                cpf: 0, 
                email: 0, 
                acessoPrevistoNaoConcedido: 0, 
                nome: 0,
                ativosNaoEncontradosRH: 0,
                sodViolations: 0, // <<< ADICIONADO VALOR PADRÃO
            },
            kpisAdicionais: { contasDormentes: 0, acessoPrivilegiado: 0, adminsDormentes: 0 },
        },
        pamDisplay: { riscos: { acessosIndevidos: 0 } },
        riscosConsolidadosChart: { 
            // --- INÍCIO DA CORREÇÃO (Etapa 2) ---
            labels: ["Contas Admin com Risco", "Acessos Ativos Indevidos", "Contas Órfãs", "Violações de SOD"], 
            datasets: [{ label: "Total de Eventos de Risco", color: "error", data: [0, 0, 0, 0] }] 
            // --- FIM DA CORREÇÃO (Etapa 2) ---
        },
        prejuizoPotencial: "R$ 0,00",
        prejuizoMitigado: "R$ 0,00",
        indiceConformidade: isLoading ? "..." : "100.0",
        riscosEmContasPrivilegiadas: 0,
        sodViolationCount: 0, // <<< ADICIONADO VALOR PADRÃO
    };
    // ======================== FIM DA ALTERAÇÃO =======================

    if (!metrics) {
        return defaultData;
    }
    
    const imDisplay = {
        pills: metrics.pills || defaultData.imDisplay.pills,
        tiposChart: {
            labels: metrics.tiposDeUsuario.map(t => t.tipo),
            datasets: {
                label: "Tipos de Usuário",
                backgroundColors: ["info", "primary", "warning", "secondary", "error", "light"],
                data: metrics.tiposDeUsuario.map(t => t.total),
            },
        },
        tiposList: metrics.tiposDeUsuario.map(t => ({ label: t.tipo, value: t.total })),
        kpisAdicionais: metrics.kpisAdicionais || defaultData.imDisplay.kpisAdicionais,
        divergencias: { ...defaultData.imDisplay.divergencias, ...metrics.divergencias },
    };

    const riscosConsolidadosChart = {
        // --- INÍCIO DA CORREÇÃO (Etapa 2) ---
        labels: ["Contas Admin com Risco", "Acessos Ativos Indevidos", "Contas Órfãs", "Violações de SOD"],
        // --- FIM DA CORREÇÃO (Etapa 2) ---
        datasets: [{
            label: "Total de Eventos de Risco",
            color: "error",
            data: [
                metrics.riscos?.riscosEmContasPrivilegiadas || 0,
                metrics.divergencias?.inativosRHAtivosApp || 0,
                metrics.divergencias?.ativosNaoEncontradosRH || 0,
                // --- INÍCIO DA CORREÇÃO (Etapa 2) ---
                metrics.riscos?.sodViolationCount || 0, // <<< ADICIONADO DADO DE SOD
                // --- FIM DA CORREÇÃO (Etapa 2) ---
            ]
        }]
    };
    
    return { 
        imDisplay,
        pamDisplay: { riscos: metrics.pamRiscos || defaultData.pamDisplay.riscos },
        riscosConsolidadosChart,
        prejuizoPotencial: metrics.riscos?.prejuizoPotencial || "R$ 0,00",
        prejuizoMitigado: metrics.riscos?.valorMitigado || "R$ 0,00",
        indiceConformidade: metrics.riscos?.indiceConformidade || "100.0",
        riscosEmContasPrivilegiadas: metrics.riscos?.riscosEmContasPrivilegiadas || 0,
    };
  }, [metrics, isLoading]);

  return displayData;
}

export default useDashboardData;