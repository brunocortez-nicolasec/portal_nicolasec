// material-react-app/src/layouts/observabilidade/geral/components/KpiStack.js

import React from "react";
import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

function KpiStack({ title, items, defaultColor = "dark" }) {
    return (
        <Card sx={{height: "100%"}}>
            <MDBox pt={2} px={2} textAlign="center">
                <MDTypography variant="button" fontWeight="bold" textTransform="uppercase" color="secondary">{title}</MDTypography>
            </MDBox>
            <MDBox p={2} pt={0}>
                {items.map(item => (
                    <MDBox key={item.label} mt={2.5} lineHeight={1} textAlign="center">
                        <MDTypography variant="caption" color="text" fontWeight="light" textTransform="uppercase">{item.label}</MDTypography>
                        <MDTypography variant="h3" fontWeight="bold" color={item.color || defaultColor}>{item.value}</MDTypography>
                    </MDBox>
                ))}
            </MDBox>
        </Card>
    );
}

KpiStack.propTypes = {
  title: PropTypes.string.isRequired,
  items: PropTypes.arrayOf(PropTypes.shape({
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    color: PropTypes.string,
  })).isRequired,
  defaultColor: PropTypes.string,
};

KpiStack.defaultProps = {
  defaultColor: "dark",
};

export default KpiStack;