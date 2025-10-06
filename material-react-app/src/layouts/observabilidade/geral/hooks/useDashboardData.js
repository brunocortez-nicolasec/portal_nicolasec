import { useMemo } from "react";

function useDashboardData(metrics, isLoading) {
  const displayData = useMemo(() => {
    // ======================= INÍCIO DA CORREÇÃO =======================
    const defaultData = {
        imDisplay: {
            pills: { total: 0, ativos: 0, inativos: 0, desconhecido: 0 },
            tiposChart: { labels: [], datasets: { data: [] } },
            tiposList: [],
            // Estrutura de divergências corrigida para incluir os campos que faltavam
            divergencias: { 
                inativosRHAtivosApp: 0, 
                login: 0, 
                cpf: 0, 
                email: 0, 
                acessoPrevistoNaoConcedido: 0, 
                nome: 0,
                ativosNaoEncontradosRH: 0,
                ativosNaoEncontradosTruIM: 0
            },
            kpisAdicionais: { contasDormentes: 0, acessoPrivilegiado: 0 },
        },
        pamDisplay: { riscos: { acessosIndevidos: 0 } },
        riscosConsolidadosChart: { labels: ["Acessos Indevidos (PAM)", "RH Inativo/App Ativo (IM)", "Divergência de Login (IM)"], datasets: [{ label: "Total de Eventos de Risco", color: "error", data: [0, 0, 0] }] },
        prejuizoPotencial: "R$ 0,00",
        prejuizoMitigado: "R$ 0,00",
        indiceConformidade: isLoading ? "..." : "100.0",
        riscosEmContasPrivilegiadas: 0,
    };
    // ======================== FIM DA CORREÇÃO =======================

    if (!metrics) {
        return defaultData;
    }

    const imDisplay = {
        pills: metrics.pills,
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
        // Agora, ao mesclar, a estrutura base já é a correta
        divergencias: { ...defaultData.imDisplay.divergencias, ...metrics.divergencias },
    };

    const riscosConsolidadosChart = {
        labels: ["Acessos Indevidos (PAM)", "RH Inativo/App Ativo (IM)", "Divergência de Login (IM)"],
        datasets: [{
            label: "Total de Eventos de Risco",
            color: "error",
            data: [
                metrics.pamRiscos?.acessosIndevidos || 0,
                metrics.divergencias?.inativosRHAtivosApp || 0,
                metrics.divergencias?.login || 0,
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