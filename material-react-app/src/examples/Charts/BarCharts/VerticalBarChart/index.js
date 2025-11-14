// material-react-app/src/examples/Charts/BarCharts/VerticalBarChart/index.js

import { useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { Bar, getElementAtEvent } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import { keyframes } from "@mui/material"; // Importa o keyframes
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import configs from "examples/Charts/BarCharts/VerticalBarChart/configs";
import colors from "assets/theme/base/colors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// ======================= INÍCIO DA ALTERAÇÃO (Animação Sutil) =======================
// 1. Definir a animação @keyframes
// Mantido o efeito sutil que definimos (scale 1.1 e sombra 10px)
const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(229, 62, 62, 0.7);
  }
  50% { 
    transform: scale(1.1);
    box-shadow: 0 0 0 10px rgba(229, 62, 62, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(229, 62, 62, 0);
  }
`;
// ======================== FIM DA ALTERAÇÃO (Animação Sutil) =========================

function VerticalBarChart({ icon, title, description, height, chart, onClick }) {
  const chartRef = useRef();

  const chartDatasets = chart.datasets
    ? chart.datasets.map((dataset) => ({
        ...dataset,
        weight: 5,
        borderWidth: 0,
        borderRadius: 4,
        backgroundColor: colors[dataset.color]
          ? colors[dataset.color || "dark"].main
          : colors.dark.main,
        fill: false,
        maxBarThickness: 35,
      }))
    : [];

  const { data, options } = configs(chart.labels || [], chartDatasets);

  // --- MODIFICAÇÃO: Adiciona cursor de ponteiro no hover ---
  options.onHover = (event, activeElements, chart) => {
    chart.canvas.style.cursor = activeElements.length ? "pointer" : "default";
  };
  // --- FIM DA MODIFICAÇÃO ---

  const renderChart = (
    <MDBox py={2} pr={2} pl={icon.component ? 1 : 2}>
      {title || description ? (
        <MDBox display="flex" px={description ? 1 : 0} pt={description ? 1 : 0}>
          {icon.component && (
            <MDBox
              width="4rem"
              height="4rem"
              bgColor={icon.color || "info"}
              variant="gradient"
              coloredShadow={icon.color || "info"}
              borderRadius="xl"
              display="flex"
              justifyContent="center"
              alignItems="center"
              color="white"
              mt={-5}
              mr={2}
// ======================= INÍCIO DA ALTERAÇÃO (Aplicar Animação) =======================
              // 2. Aplicar a animação APENAS se a cor for "error"
              // Trocado "ease-in-out" por uma curva "cubic-bezier" ultra-fluida
              // Trocado 2s para 1.7s para um ritmo mais natural
              sx={icon.color === "error" ? {
                animation: `${pulse} 1.7s cubic-bezier(0.45, 0, 0.55, 1) infinite`
              } : {}}
// ======================== FIM DA ALTERAÇÃO (Aplicar Animação) =========================
            >
              <Icon fontSize="medium">{icon.component}</Icon>
            </MDBox>
          )}
          <MDBox mt={icon.component ? -2 : 0}>
            {title && <MDTypography variant="h6">{title}</MDTypography>}
            <MDBox mb={2}>
              <MDTypography component="div" variant="button" color="text">
                {description}
              </MDTypography>
            </MDBox>
          </MDBox>
        </MDBox>
      ) : null}
      {useMemo(
        () => (
          <MDBox height={height}>
            <Bar
              ref={chartRef}
              data={data}
              options={options}
              onClick={(event) => {
                if (onClick) {
                  const element = getElementAtEvent(chartRef.current, event);
                  onClick(event, element);
                }
              }}
            />
          </MDBox>
        ),
        [chart, height]
      )}
    </MDBox>
  );

  return title || description ? <Card>{renderChart}</Card> : renderChart;
}

VerticalBarChart.defaultProps = {
  icon: { color: "info", component: "" },
  title: "",
  description: "",
  height: "19.125rem",
  onClick: () => {},
};

VerticalBarChart.propTypes = {
  icon: PropTypes.shape({
    color: PropTypes.oneOf([
      "primary", "secondary", "info", "success", "warning", "error", "light", "dark",
    ]),
    component: PropTypes.node,
  }),
  title: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  chart: PropTypes.objectOf(PropTypes.array).isRequired,
  onClick: PropTypes.func,
};

export default VerticalBarChart;