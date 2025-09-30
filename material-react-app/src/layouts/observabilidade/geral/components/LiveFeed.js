import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
// --- IMPORTAÇÕES CORRIGIDAS ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Componentes do Template
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Grid from "@mui/material/Grid";
import Modal from "@mui/material/Modal";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import { Box } from "@mui/material";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import DataTable from "examples/Tables/DataTable";
import colors from "assets/theme/base/colors";

// --- Componentes Auxiliares ---

const AuthorCell = ({ nome, tipo }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
        <MDBox lineHeight={1}>
            <MDTypography display="block" variant="button" fontWeight="medium" sx={{ "&:hover": { color: colors.info.main }}}>
                {nome}
            </MDTypography>
            <MDTypography variant="caption">Tipo: {tipo ? tipo.charAt(0).toUpperCase() : 'N/A'}</MDTypography>
        </MDBox>
    </MDBox>
);

const StatusCell = ({ status }) => {
    let color = "secondary";
    let text = status ? status.toUpperCase() : "-";
    if (status === "ativo") color = "success";
    if (status === "inativo") color = "error";
    return <MDTypography variant="caption" color={color} fontWeight="medium">{text}</MDTypography>;
};

const DivergencePill = ({ value, type = 'geral' }) => {
    const finalValue = value ?? 0;
    
    const styleConfig = {
      perfis: { backgroundColor: colors.error.light, color: colors.error.main },
      geral: { backgroundColor: colors.warning.light, color: colors.warning.main },
      criticas: { backgroundColor: colors.error.light, color: colors.error.main },
    };

    const currentStyle = styleConfig[type];

    return (
        <MDBox sx={{ width: "28px", height: "28px", borderRadius: "50%", display: "grid", placeContent: "center", fontWeight: "bold", ...currentStyle }}>
            <MDTypography variant="caption" fontWeight="bold" sx={{ color: 'inherit' }}>{finalValue}</MDTypography>
        </MDBox>
    );
};

// --- Sub-componente para o conteúdo do Modal ---
const InfoDetail = ({ label, value }) => (
    <Grid container spacing={1} sx={{ mb: 1.5 }}>
        <Grid item xs={4}><MDTypography variant="caption" color="text" sx={{ fontWeight: 'regular' }}>{label}:</MDTypography></Grid>
        <Grid item xs={8}><MDTypography variant="button" fontWeight="medium" sx={{ textAlign: 'right' }}>{value || "-"}</MDTypography></Grid>
    </Grid>
);

const DivergenceModal = React.forwardRef(({ user, onClose }, ref) => {
    if (!user) return null;
    const inconsistencies = [];
    if (user.acesso_previsto === 'true' && user.status_app !== 'ativo') inconsistencies.push("Acessos Previstos Não Concedidos (TruIM)");
    if (user.status_rh === 'inativo' && user.status_app === 'ativo') inconsistencies.push("Acesso Indevido (APP): Usuário inativo no RH com acesso ativo.");

    return (
        <Box ref={ref} tabIndex={-1}>
            <Card sx={{ width: "80vw", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto" }}>
                <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
                    <MDTypography variant="h6">Inconsistências</MDTypography>
                    <MDButton iconOnly onClick={onClose}><Icon>close</Icon></MDButton>
                </MDBox>
                <Divider sx={{ margin: 0 }} />
                <MDBox p={3}>
                    <Grid container spacing={2} divider={<Divider orientation="vertical" flexItem />}>
                        <Grid item xs={12} md={4}><MDTypography variant="button" fontWeight="bold" color="secondary" textTransform="uppercase">RH</MDTypography><MDBox mt={2}><InfoDetail label="Nome" value={user.nome_colaborador} /><InfoDetail label="CPF" value={user.cpf_rh} /><InfoDetail label="Função" value={user.cargo_rh} /></MDBox></Grid>
                        <Grid item xs={12} md={4}><MDTypography variant="button" fontWeight="bold" color="secondary" textTransform="uppercase">TruIM</MDTypography><MDBox mt={2}><InfoDetail label="Nome" value={user.nome_colaborador} /><InfoDetail label="CPF" value={user.cpf_idm} /><InfoDetail label="Login" value={user.login_esperado} /><InfoDetail label="Função" value={user.cargo_idm} /></MDBox></Grid>
                        <Grid item xs={12} md={4}><MDTypography variant="button" fontWeight="bold" color="secondary" textTransform="uppercase">APP</MDTypography><MDBox mt={2}><InfoDetail label="Nome" value={user.nome_colaborador} /><InfoDetail label="CPF" value={user.cpf_app} /><InfoDetail label="Login" value={user.login_atual} /><InfoDetail label="Função" value={user.cargo_app} /></MDBox></Grid>
                    </Grid>
                    <Divider sx={{ mt: 3, mb: 2 }} />
                    <MDBox>
                        <MDTypography variant="button" fontWeight="bold" color="secondary" textTransform="uppercase">Inconsistências de Acessos</MDTypography>
                        <MDBox mt={1}>{inconsistencies.length > 0 ? (inconsistencies.map(text => <MDTypography key={text} variant="body2" display="block" mt={0.5}>• {text}</MDTypography>)) : (<MDTypography variant="body2" display="block" mt={0.5}>• Nenhuma inconsistência de acesso encontrada.</MDTypography>)}</MDBox>
                    </MDBox>
                </MDBox>
            </Card>
        </Box>
    );
});

// --- Componente Principal do LiveFeed ---

function LiveFeed({ truIMData, truPAMData, truAMData }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [filters, setFilters] = useState({ nome: "", email: "", sistema: "" });
    const [tempFilters, setTempFilters] = useState({ nome: "", email: "", sistema: "" });

    const open = Boolean(anchorEl);
    
    const handleFilterMenuOpen = (event) => { setTempFilters(filters); setAnchorEl(event.currentTarget); };
    const handleFilterMenuClose = () => setAnchorEl(null);
    const handleApplyFilters = () => { setFilters(tempFilters); handleFilterMenuClose(); };
    const handleClearFilters = () => { const cleared = { nome: "", email: "", sistema: "" }; setFilters(cleared); setTempFilters(cleared); handleFilterMenuClose(); };
    const handleTempFilterChange = (e) => { const { name, value } = e.target; setTempFilters(prev => ({ ...prev, [name]: value })); };
    const handleOpenModal = (user) => { setSelectedUser(user); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedUser(null); };

    // --- FUNÇÃO DE GERAR PDF CORRIGIDA ---
    const handleGeneratePdf = () => {
        const doc = new jsPDF();
        const tableColumns = tableData.columns.map(c => c.Header);
        const tableRows = [];

        tableData.rawData.forEach(user => {
            const divCriticas = (user.status_rh === 'inativo' && user.status_app === 'ativo') ? 1 : 0;
            const divPerfis = (user.acesso_previsto === 'true' && user.status_app !== 'ativo') ? 1 : 0;
            const divGeral = ((user.login_esperado && user.login_atual && user.login_esperado !== user.login_atual) ? 1 : 0) + ((user.cpf_rh && user.cpf_app && user.cpf_rh !== user.cpf_app) ? 1 : 0) + ((user.email_rh && user.email_app && user.email_rh !== user.email_app) ? 1 : 0);

            const rowData = [
                user.nome_colaborador || '-',
                user.email_app || '-',
                user.sistemas ? user.sistemas.join(', ') : '-',
                user.status_rh || '-',
                user.status_idm || user.status_app || '-',
                user.status_app || '-',
                divPerfis,
                divGeral,
                divCriticas
            ];
            tableRows.push(rowData);
        });

        doc.text("Relatório - Live Feed", 14, 15);
        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: 20,
        });
        doc.save(`relatorio_live_feed_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    const tableData = useMemo(() => {
        const imData = truIMData || [];
        const pamData = truPAMData || [];
        const amData = truAMData || [];

        const userMap = new Map();
        imData.forEach(u => userMap.set(u.id_usuario, { ...u, sistemas: ["TruIM"] }));
        pamData.forEach(p => {
            const userId = p.usuario_privilegiado;
            if (userMap.has(userId)) userMap.get(userId).sistemas.push("TruPAM");
            else userMap.set(userId, { id_usuario: userId, nome_colaborador: userId, email_app: '-', tipo_usuario: 'N/A', sistemas: ["TruPAM"] });
        });
        amData.forEach(a => {
            const userId = a.usuario;
            if (userMap.has(userId)) userMap.get(userId).sistemas.push("TruAM");
            else userMap.set(userId, { id_usuario: userId, nome_colaborador: userId, email_app: '-', tipo_usuario: 'N/A', sistemas: ["TruAM"] });
        });

        let allUsersData = Array.from(userMap.values());
        
        if (searchTerm) {
            allUsersData = allUsersData.filter(u =>
                (u.nome_colaborador && u.nome_colaborador.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (u.id_usuario && u.id_usuario.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (filters.nome || filters.email || filters.sistema) {
            allUsersData = allUsersData.filter(u => {
                const matchNome = !filters.nome || (u.nome_colaborador && u.nome_colaborador.toLowerCase().includes(filters.nome.toLowerCase()));
                const matchEmail = !filters.email || (u.email_app && u.email_app.toLowerCase().includes(filters.email.toLowerCase()));
                const matchSistema = !filters.sistema || (u.sistemas && u.sistemas.join(', ').toLowerCase().includes(filters.sistema.toLowerCase()));
                return matchNome && matchEmail && matchSistema;
            });
        }
        
        const rows = allUsersData.map(u => {
            const divCriticas = (u.status_rh === 'inativo' && u.status_app === 'ativo') ? 1 : 0;
            const divPerfis = (u.acesso_previsto === 'true' && u.status_app !== 'ativo') ? 1 : 0;
            const divGeral = ((u.login_esperado && u.login_atual && u.login_esperado !== u.login_atual) ? 1 : 0) + ((u.cpf_rh && u.cpf_app && u.cpf_rh !== u.cpf_app) ? 1 : 0) + ((u.email_rh && u.email_app && u.email_rh !== u.email_app) ? 1 : 0);
            
            return {
                nome: <MDBox onClick={() => handleOpenModal(u)} sx={{ cursor: "pointer" }}><AuthorCell nome={u.nome_colaborador} tipo={u.tipo_usuario} /></MDBox>,
                email: <MDTypography variant="caption">{u.email_app}</MDTypography>,
                sistema: <MDTypography variant="caption" color="secondary" fontWeight="medium">{u.sistemas.join(', ')}</MDTypography>,
                rh_status: <StatusCell status={u.status_rh} />,
                idm_status: <StatusCell status={u.status_idm || u.status_app} />,
                app_status: <StatusCell status={u.status_app} />,
                div_perfis: <DivergencePill value={divPerfis} type="perfis" />,
                div_geral: <DivergencePill value={divGeral} type="geral" />,
                div_criticas: <DivergencePill value={divCriticas} type="criticas" />,
            };
        });

        return {
            columns: [ 
                { Header: "NOME", accessor: "nome", width: "25%" },
                { Header: "EMAIL", accessor: "email" },
                { Header: "SISTEMA", accessor: "sistema", align: "center" },
                { Header: "RH STATUS", accessor: "rh_status", align: "center" },
                { Header: "TruIM STATUS", accessor: "idm_status", align: "center" },
                { Header: "APP STATUS", accessor: "app_status", align: "center" },
                { Header: "PERFIS", accessor: "div_perfis", align: "center" },
                { Header: "DIVERG.", accessor: "div_geral", align: "center" },
                { Header: "CRÍTICAS", accessor: "div_criticas", align: "center" },
            ],
            rows,
            rawData: allUsersData,
        };
    }, [truIMData, truPAMData, truAMData, searchTerm, filters]);

    return (
        <>
            <Modal open={isModalOpen} onClose={handleCloseModal} sx={{ display: "grid", placeItems: "center" }}>
                <DivergenceModal user={selectedUser} onClose={handleCloseModal} />
            </Modal>

            <Card>
                <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                    <MDTypography variant="h6" color="info" textGradient>Live Feed</MDTypography>
                    <MDBox display="flex" alignItems="center">
                        <MDButton variant="gradient" color="info" size="small" sx={{mr: 1}} onClick={handleFilterMenuOpen}>Filtros <Icon>keyboard_arrow_down</Icon></MDButton>
                        <MDButton variant="outlined" color="info" size="small" onClick={handleGeneratePdf}><Icon>download</Icon>&nbsp;Relatório</MDButton>
                    </MDBox>
                </MDBox>

                <Menu anchorEl={anchorEl} open={open} onClose={handleFilterMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                    <MDBox p={2} sx={{ width: '250px' }}>
                        <MDTypography variant="button" fontWeight="medium">Filtros Avançados</MDTypography>
                        <MDBox mt={2}><MDInput label="Nome" name="nome" value={tempFilters.nome} onChange={handleTempFilterChange} fullWidth /></MDBox>
                        <MDBox mt={2}><MDInput label="Email" name="email" value={tempFilters.email} onChange={handleTempFilterChange} fullWidth /></MDBox>
                        <MDBox mt={2} mb={2}><MDInput label="Sistema" name="sistema" value={tempFilters.sistema} onChange={handleTempFilterChange} fullWidth /></MDBox>
                        <Divider />
                        <MDBox display="flex" justifyContent="space-between" mt={2}>
                            <MDButton variant="text" color="secondary" size="small" onClick={handleClearFilters}>Limpar</MDButton>
                            <MDButton variant="gradient" color="info" size="small" onClick={handleApplyFilters}>Aplicar</MDButton>
                        </MDBox>
                    </MDBox>
                </Menu>

                <DataTable 
                    table={tableData} 
                    canSearch={false} 
                    showTotalEntries 
                    entriesPerPage={{defaultValue: 5, entries: [5, 10, 20]}} 
                    isSorted={false} 
                />
            </Card>
        </>
    );
}

LiveFeed.propTypes = {
    truIMData: PropTypes.array.isRequired,
    truPAMData: PropTypes.array.isRequired,
    truAMData: PropTypes.array.isRequired,
};

export default LiveFeed;