// material-react-app/src/layouts/observabilidade/geral/components/RisksChartCard.js

import React from "react";
import PropTypes from "prop-types";

// Componentes do Template
import Card from "@mui/material/Card";
import VerticalBarChart from "examples/Charts/BarCharts/VerticalBarChart";

// (A definição da animação 'pulse' que está no VerticalBarChart.js está correta, não precisamos dela aqui)

function RisksChartCard({ chart, onClick, hasRisk }) { // <-- 1. Recebe a nova prop 'hasRisk'
  return (
    <Card sx={{ height: "100%" }}>
      <VerticalBarChart
// ======================= INÍCIO DA ALTERAÇÃO (Ícone Dinâmico) =======================
        // 2. O ícone agora é dinâmico com base no 'hasRisk'
        icon={{
          color: hasRisk ? "error" : "success", // Se houver risco = error (vermelho), senão = success (verde)
          component: hasRisk ? "warning" : "check_circle", // Se houver risco = warning (triângulo), senão = check
        }}
// ======================== FIM DA ALTERAÇÃO (Ícone Dinâmico) =========================
        title="Visão Geral de Riscos"
        description="Principais pontos de atenção consolidados"
        chart={chart}
        onClick={onClick}
      />
    </Card>
  );
}

// 3. Atualiza os PropTypes
RisksChartCard.propTypes = {
  chart: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
  hasRisk: PropTypes.bool.isRequired, // <-- Adiciona a nova prop
};

export default RisksChartCard;