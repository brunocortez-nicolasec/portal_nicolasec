// src/layouts/observabilidade/geral/components/Painel.js

import React, { useState } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";

import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import PieChart from "examples/Charts/PieChart";
import colors from "assets/theme/base/colors";

// --- Sub-componentes que agora vivem neste arquivo ---

function PillKpi({ label, count, color }) {
    return (
        <MDBox textAlign="center" lineHeight={1}>
            <MDTypography
                variant="button"
                fontWeight="medium"
                color={color}
                sx={{ textTransform: "capitalize" }}
            >
                {label}
            </MDTypography>
            <MDTypography variant="h4" fontWeight="bold" mt={1}>
                {count}
            </MDTypography>
        </MDBox>
    );
}

function DetailList({ title, items }) {
    return ( <Card sx={{height: "100%", p: 2}}> <MDTypography variant="overline" color="secondary" fontWeight="medium">{title}</MDTypography> {items.map(item => ( <MDBox key={item.label} display="flex" justifyContent="space-between" alignItems="center" pt={1.5}> <MDTypography variant="button" fontWeight="regular" color="text">{item.label}</MDTypography> <MDTypography variant="h6" fontWeight="bold" color={item.color || "dark"}>{item.value}</MDTypography> </MDBox> ))} </Card> );
}

function MiniMetricCard({ title, count, color = "dark" }) {
    return ( <MDBox p={1} textAlign="center"> <MDTypography variant="button" color="text" fontWeight="regular" sx={{whiteSpace: "normal"}}>{title}</MDTypography> <MDTypography variant="h2" fontWeight="bold" color={color} mt={1}>{count}</MDTypography> </MDBox> )
}


function Painel({ imDisplay, onPieChartClick }) {
    return (
        <Card sx={{height: "100%"}}>
            <MDBox pt={2} px={2}>
                <MDTypography variant="h6" textAlign="center">Painel de Controle de Identidades</MDTypography>
            </MDBox>
            <MDBox p={2}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Card>
                            <MDBox p={2}>
                                <Grid container spacing={2} justifyContent="space-around">
                                    <Grid item xs={6} sm={3}><PillKpi label="Usuários" count={imDisplay.pills.total} color="info"/></Grid>
                                    <Grid item xs={6} sm={3}><PillKpi label="Ativos" count={imDisplay.pills.ativos} color="success" /></Grid>
                                    <Grid item xs={6} sm={3}><PillKpi label="Inativos" count={imDisplay.pills.inativos} color="error" /></Grid>
                                    <Grid item xs={6} sm={3}><PillKpi label="Desconhecido" count={imDisplay.pills.desconhecido} color="secondary" /></Grid>
                                </Grid>
                            </MDBox>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}><DetailList title="Tipos de Usuários" items={imDisplay.tiposList || []} /></Grid>
                    <Grid item xs={12} md={4}>
                        <Card sx={{ height: "100%" }}>
                            <MDBox p={2} sx={{ height: "100%" }}>
                                <PieChart chart={imDisplay.tiposChart} onClick={onPieChartClick} />
                            </MDBox>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Card sx={{ height: "100%", p: 1 }}>
                                    <Grid container spacing={1} sx={{height: '100%'}}>
                                        <Grid item xs={6}>
                                            <MiniMetricCard 
                                                title="Ativos não encontrados no TruIM" 
                                                count={imDisplay.divergencias.ativosNaoEncontradosTruIM} 
                                                color="error"
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <MiniMetricCard 
                                                title="Ativos não encontrados no RH" 
                                                count={imDisplay.divergencias.ativosNaoEncontradosRH} 
                                                color="warning"
                                            />
                                        </Grid>
                                    </Grid>
                                </Card>
                            </Grid>
                            <Grid item xs={12}> 
                                <Card sx={{ height: "100%", p: 1 }}>
                                    <Grid container spacing={1} sx={{height: '100%'}}>
                                        <Grid item xs={6}>
                                            <MiniMetricCard 
                                                title="Contas Dormentes" 
                                                count={imDisplay.kpisAdicionais.contasDormentes} 
                                                color="warning"
                                            />
                                        </Grid>
                                        <Grid item xs={6}>
                                            <MiniMetricCard 
                                                title="Acesso Privilegiado" 
                                                count={imDisplay.kpisAdicionais.acessoPrivilegiado} 
                                                color="info"
                                            />
                                        </Grid>
                                    </Grid>
                                </Card>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </MDBox>
        </Card>
    );
}

Painel.propTypes = {
    imDisplay: PropTypes.object.isRequired,
    onPieChartClick: PropTypes.func.isRequired,
};

export default Painel;