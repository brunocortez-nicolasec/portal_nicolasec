// material-react-app/src/layouts/observabilidade/geral/components/RisksChartCard.js

import React from "react";
import PropTypes from "prop-types";

// Componentes do Template
import Card from "@mui/material/Card";
import VerticalBarChart from "examples/Charts/BarCharts/VerticalBarChart";

function RisksChartCard({ chart, onClick }) {
  return (
    <Card sx={{ height: "100%" }}>
      <VerticalBarChart
        icon={{ color: "error", component: "warning" }}
        title="Visão Geral de Riscos"
        description="Principais pontos de atenção consolidados"
        chart={chart}
        onClick={onClick}
      />
    </Card>
  );
}

// Definição de PropTypes para o novo componente
RisksChartCard.propTypes = {
  chart: PropTypes.object.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default RisksChartCard;