// src/examples/Charts/PieChart/configs/index.js

import colors from "assets/theme/base/colors";

function configs(labels, datasets) {
  const backgroundColors = datasets.backgroundColors
    ? datasets.backgroundColors
    : ["info", "primary", "dark", "secondary", "success"];

  return {
    data: {
      labels,
      datasets: [
        {
          label: datasets.label ? datasets.label : "Projects",
          tension: 0.4,
          borderWidth: 0,
          pointRadius: 0,
          borderColor: "#fff",
          backgroundColor: backgroundColors.map((color) =>
            colors[color] ? colors[color].main : colors.info.main
          ),
          data: datasets.data ? datasets.data : [],
          fill: false,
          hoverOffset: 15,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: { // Configurações do tooltip para melhor experiência
          callbacks: {
            label: (context) => {
              let label = context.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed !== null) {
                label += context.parsed;
              }
              return label;
            }
          }
        }
      },
      interaction: {
        // --- MODIFICAÇÃO: Usar 'nearest' para melhor detecção de hover ---
        intersect: true, // Permite a intersecção do mouse
        mode: "nearest", // Detecta o elemento mais próximo do mouse
      },
      onHover: (event, chartElement) => {
        // A lógica do cursor permanece, mas agora a detecção é mais precisa
        const target = event.native.target;
        if (chartElement.length) {
          target.style.cursor = "pointer";
        } else {
          target.style.cursor = "default";
        }
      },
    },
  };
}

export default configs;