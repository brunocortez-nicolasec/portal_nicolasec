// src/examples/Charts/PieChart/index.js

import { useMemo, useRef } from "react";
import PropTypes from "prop-types";
import { Pie, getElementAtEvent } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

import configs from "examples/Charts/PieChart/configs";

ChartJS.register(ArcElement, Tooltip, Legend);

function PieChart({ icon, title, description, chart, onClick }) {
  const chartRef = useRef();
  const { data, options } = configs(chart.labels || [], chart.datasets || {});

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
          <MDBox height="18rem">
            <Pie
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
        [chart]
      )}
    </MDBox>
  );
  
  // --- MODIFICAÇÃO: Adicionada a propriedade sx={{ height: "100%" }} ---
  return title || description ? <Card sx={{ height: "100%" }}>{renderChart}</Card> : renderChart;
}

PieChart.defaultProps = {
  icon: { color: "info", component: "" },
  title: "",
  description: "",
  onClick: () => {},
};

PieChart.propTypes = {
  icon: PropTypes.shape({
    color: PropTypes.oneOf([
      "primary", "secondary", "info", "success", "warning", "error", "light", "dark",
    ]),
    component: PropTypes.node,
  }),
  title: PropTypes.string,
  description: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  chart: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.array, PropTypes.object])).isRequired,
  onClick: PropTypes.func,
};

export default PieChart;