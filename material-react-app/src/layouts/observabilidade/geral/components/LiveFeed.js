// material-react-app\src\layouts\observabilidade\geral\components\LiveFeed.js

import React, { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import { useMaterialUIController } from "context";

// Componentes do Template
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Grid from "@mui/material/Grid";
import Modal from "@mui/material/Modal";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import { Box } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import DataTable from "examples/Tables/DataTable";
import colors from "assets/theme/base/colors";
import MDBadge from "components/MDBadge";

// --- Componentes Auxiliares (Sem alterações) ---

const AuthorCell = ({ nome, tipo }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
        <MDBox lineHeight={1}>
            <MDTypography display="block" variant="button" fontWeight="medium" sx={{ "&:hover": { color: colors.info.main }}}>
                {nome}
            </MDTypography>
            <MDTypography variant="caption">Tipo: {tipo || 'N/A'}</MDTypography>
        </MDBox>
    </MDBox>
);

const StatusCell = ({ status }) => {
    let color = "secondary";
    let text = status ? String(status).toUpperCase() : "-";
    if (text === "ATIVO") color = "success";
    if (text === "INATIVO") color = "error";
    if (text === "NÃO ENCONTRADO") color = "secondary";
    return <MDTypography variant="caption" color={color} fontWeight="medium">{text}</MDTypography>;
};

const InfoDetail = ({ label, value }) => (
    <Grid container spacing={1} sx={{ mb: 1.5 }}>
        <Grid item xs={5}><MDTypography variant="caption" color="text" sx={{ fontWeight: 'regular' }}>{label}:</MDTypography></Grid>
        <Grid item xs={7}><MDTypography variant="button" fontWeight="medium">{value || "-"}</MDTypography></Grid>
    </Grid>
);

// <<< INÍCIO DA ALTERAÇÃO 1: Passando a prop 'darkMode' para o modal >>>
const DivergenceModal = React.forwardRef(({ user, onClose, darkMode }, ref) => {
// <<< FIM DA ALTERAÇÃO 1 >>>
    if (!user) return null;
    return (
        <Box ref={ref} tabIndex={-1}>
            <Card sx={{ width: "80vw", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}>
                <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
                    <MDTypography variant="h6">Detalhes da Identidade</MDTypography>
                    {/* <<< INÍCIO DA ALTERAÇÃO 2: Substituído o MDButton pelo Icon, seguindo o modelo do Configurator >>> */}
                    <Icon
                        sx={({ typography: { size }, palette: { dark, white } }) => ({
                            fontSize: `${size.lg} !important`,
                            color: darkMode ? white.main : dark.main,
                            stroke: "currentColor",
                            strokeWidth: "2px",
                            cursor: "pointer",
                        })}
                        onClick={onClose}
                    >
                        close
                    </Icon>
                    {/* <<< FIM DA ALTERAÇÃO 2 >>> */}
                </MDBox>
                <Divider sx={{ margin: 0 }} />
                <MDBox p={3}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <MDTypography variant="button" fontWeight="bold" color="secondary" textTransform="uppercase">Identificação</MDTypography>
                            <MDBox mt={2}>
                                <InfoDetail label="Nome" value={user.name} />
                                <InfoDetail label="Email" value={user.email} />
                                <InfoDetail label="CPF" value={user.cpf} />
                                <InfoDetail label="ID de Origem" value={user.id_user} />
                            </MDBox>
                        </Grid>

                        <Grid item xs={12} md={6}>
                             <MDTypography variant="button" fontWeight="bold" color="secondary" textTransform="uppercase">Status e Acesso</MDTypography>
                             <MDBox mt={2}>
                                 <InfoDetail label="Tipo" value={user.userType} />
                                 <InfoDetail label="Status RH" value={user.rh_status} />
                                 <InfoDetail label="Status App" value={user.app_status} />
                                 <InfoDetail label="Perfil App" value={user.perfil} />
                                 <InfoDetail label="Último Login" value={user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : '-'} />
                             </MDBox>
                        </Grid>
                    </Grid>

                    <Divider sx={{ mt: 3, mb: 2 }} />
                    <MDBox>
                        <MDTypography variant="button" fontWeight="bold" color="secondary" textTransform="uppercase">Inconsistências Encontradas</MDTypography>
                        <MDBox mt={1}>
                            {user.divergenceDetails && user.divergenceDetails.length > 0 ? (
                                user.divergenceDetails.map((detail) => (
                                    <MDTypography key={detail.code} variant="body2" color="text" display="block" mt={0.5}>
                                        • {detail.text}
                                    </MDTypography>
                                ))
                            ) : (
                                <MDTypography variant="body2" color="text" display="block" mt={0.5}>
                                    • Nenhuma inconsistência encontrada.
                                </MDTypography>
                            )}
                        </MDBox>
                    </MDBox>
                </MDBox>
            </Card>
        </Box>
    );
});


function LiveFeed({ data }) {
    // <<< INÍCIO DA ALTERAÇÃO 3: Extraindo o 'darkMode' do controller >>>
    const [controller] = useMaterialUIController();
    const { token, darkMode } = controller;
    // <<< FIM DA ALTERAÇÃO 3 >>>
    const [systemOptions, setSystemOptions] = useState([]);

    useEffect(() => {
        const fetchSystems = async () => {
            if (!token) return;
            try {
                const response = await axios.get('/systems', {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                const systemNames = response.data.map(system => system.name);
                setSystemOptions(systemNames);
            } catch (error) {
                console.error("Erro ao buscar a lista de sistemas para os filtros:", error);
            }
        };
        fetchSystems();
    }, [token]);

    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    
    const initialFilters = { 
        nome: "", 
        email: "", 
        perfil: "", 
        sistema: null, 
        divergencia: null, 
        criticas: null, 
        divergenceType: null
    };

    const divergenceOptions = [
        { code: 'ORPHAN', label: 'Conta Órfã' },
        { code: 'ZOMBIE', label: 'Acesso Ativo Indevido' },
        { code: 'ACCESS_NOT_GRANTED', label: 'Acesso Previsto Não Concedido' },
        { code: 'CPF_MISMATCH', label: 'Divergência de CPF' },
        { code: 'NAME_MISMATCH', label: 'Divergência de Nome' },
        { code: 'EMAIL_MISMATCH', label: 'Divergência de E-mail' },
        { code: 'USERTYPE_MISMATCH', label: 'Divergência de Tipo de Usuário' },
        { code: 'DORMANT_ADMIN', label: 'Admin Dormente' },
    ];

    const [filters, setFilters] = useState(initialFilters);
    const [tempFilters, setTempFilters] = useState(initialFilters);
    
    const open = Boolean(anchorEl);
    
    const handleFilterMenuOpen = (event) => { setTempFilters(filters); setAnchorEl(event.currentTarget); };
    const handleFilterMenuClose = () => setAnchorEl(null);
    const handleApplyFilters = () => { setFilters(tempFilters); handleFilterMenuClose(); };
    const handleClearFilters = () => { setFilters(initialFilters); setTempFilters(initialFilters); handleFilterMenuClose(); };
    const handleTempFilterChange = (e) => { const { name, value } = e.target; setTempFilters(prev => ({ ...prev, [name]: value })); };
    const handleTempAutocompleteChange = (name, value) => { setTempFilters(prev => ({ ...prev, [name]: value })); };
    const handleOpenModal = (user) => { setSelectedUser(user); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedUser(null); };

    const handleGeneratePdf = () => {
        const doc = new jsPDF();
        const tableColumns = tableData.columns.map(c => c.Header);
        const tableRows = [];

        tableData.rawData.forEach(user => {
            const rowData = [
                user.name || '-',
                user.email || '-',
                user.sourceSystem || '-',
                user.rh_status || '-',
                user.app_status || '-',
                user.perfil || '-',
                user.divergence ? 'Sim' : 'Não',
                user.isCritical ? 'Sim' : 'Não',
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
        let filteredData = data || [];
        
        if (searchTerm.trim() !== "") {
            filteredData = filteredData.filter(user => 
                user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (Object.values(filters).some(v => v !== "" && v !== null)) {
            filteredData = filteredData.filter(u => {
                const matchNome = !filters.nome || (u.name && u.name.toLowerCase().includes(filters.nome.toLowerCase()));
                const matchEmail = !filters.email || (u.email && u.email.toLowerCase().includes(filters.email.toLowerCase()));
                const matchPerfil = !filters.perfil || (u.perfil && u.perfil.toLowerCase().includes(filters.perfil.toLowerCase()));
                const matchSistema = !filters.sistema || (u.sourceSystem && u.sourceSystem === filters.sistema);
                const matchDivergencia = filters.divergencia === null || (filters.divergencia === 'Sim' && u.divergence) || (filters.divergencia === 'Não' && !u.divergence);
                const matchCriticas = filters.criticas === null || (filters.criticas === 'Sim' && u.isCritical) || (filters.criticas === 'Não' && !u.isCritical);
                const matchDivergenceType = !filters.divergenceType || (u.divergenceDetails && u.divergenceDetails.some(d => d.code === filters.divergenceType.code));
                return matchNome && matchEmail && matchPerfil && matchSistema && matchDivergencia && matchCriticas && matchDivergenceType;
            });
        }
        
        const rows = filteredData.map(u => ({
          ...u,
          nome: <MDBox onClick={() => handleOpenModal(u)} sx={{ cursor: "pointer" }}><AuthorCell nome={u.name} tipo={u.userType} /></MDBox>,
          email: <MDTypography variant="caption">{u.email}</MDTypography>,
          sourceSystem: <MDTypography variant="caption">{u.sourceSystem}</MDTypography>,
          rh_status: <StatusCell status={u.rh_status} />,
          app_status: <StatusCell status={u.app_status} />,
          perfil: <MDTypography variant="caption">{u.perfil}</MDTypography>,
          diverg: <MDBadge badgeContent={u.divergence ? "Sim" : "Não"} color={u.divergence ? "error" : "success"} size="xs" container />,
          criticas: (
            <MDBadge 
              badgeContent={u.isCritical ? "Sim" : "Não"} 
              color={u.isCritical ? "error" : (u.divergence ? "warning" : "success")} 
              size="xs" 
              container 
            />
          ),
        }));

        return {
            columns: [ 
                { Header: "NOME", accessor: "nome", width: "20%" },
                { Header: "EMAIL", accessor: "email", width: "20%" },
                { Header: "SISTEMA", accessor: "sourceSystem", align: "center" },
                { Header: "STATUS RH", accessor: "rh_status", align: "center"},
                { Header: "STATUS APP", accessor: "app_status", align: "center"},
                { Header: "PERFIL", accessor: "perfil", align: "center" },
                { Header: "DIVERGÊNCIA", accessor: "diverg", align: "center" },
                { Header: "CRÍTICAS", accessor: "criticas", align: "center" },
            ],
            rows,
            rawData: filteredData,
        };
    }, [data, filters, searchTerm]);

    return (
        <>
            <Modal open={isModalOpen} onClose={handleCloseModal} sx={{ display: "grid", placeItems: "center" }}>
                {/* <<< INÍCIO DA ALTERAÇÃO 4: Passando o darkMode para o modal >>> */}
                <DivergenceModal user={selectedUser} onClose={handleCloseModal} darkMode={darkMode} />
                {/* <<< FIM DA ALTERAÇÃO 4 >>> */}
            </Modal>

            <Card>
                <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
                    <MDTypography variant="h4" fontWeight="bold" color="info" textGradient sx={{ flexShrink: 0 }}>
                        Live Feed
                    </MDTypography>
                    <MDBox display="flex" alignItems="center" gap={1} sx={{ flexGrow: 1, justifyContent: 'center', mx: 2 }}>
                        <MDInput
                            label="Buscar Usuário"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            sx={{ width: '175px' }}
                        />
                        <MDButton variant="gradient" color="info" size="small" onClick={handleFilterMenuOpen}>
                            Filtros <Icon>keyboard_arrow_down</Icon>
                        </MDButton>
                    </MDBox>
                    <MDButton variant="outlined" color="info" size="small" onClick={handleGeneratePdf} sx={{ flexShrink: 0 }}>
                        <Icon>download</Icon>&nbsp;Relatório
                    </MDButton>
                </MDBox>

                <Menu anchorEl={anchorEl} open={open} onClose={handleFilterMenuClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                    <MDBox p={2} sx={{ width: '300px' }}>
                        <MDTypography variant="button" fontWeight="medium">Filtros Avançados</MDTypography>
                        <MDBox mt={2}><MDInput label="Nome" name="nome" value={tempFilters.nome} onChange={handleTempFilterChange} fullWidth /></MDBox>
                        <MDBox mt={2}><MDInput label="Email" name="email" value={tempFilters.email} onChange={handleTempFilterChange} fullWidth /></MDBox>
                        <MDBox mt={2}><MDInput label="Perfil" name="perfil" value={tempFilters.perfil} onChange={handleTempFilterChange} fullWidth /></MDBox>
                        
                        <MDBox mt={2}>
                            <Autocomplete 
                                options={systemOptions}
                                value={tempFilters.sistema}
                                onChange={(event, newValue) => handleTempAutocompleteChange('sistema', newValue)}
                                renderInput={(params) => <TextField {...params} label="Sistema" />} 
                            />
                        </MDBox>
                        
                        <MDBox mt={2}>
                            <Autocomplete 
                                options={divergenceOptions}
                                getOptionLabel={(option) => option.label || ""}
                                value={tempFilters.divergenceType}
                                onChange={(event, newValue) => handleTempAutocompleteChange('divergenceType', newValue)}
                                renderInput={(params) => <TextField {...params} label="Tipo de Divergência" />} 
                            />
                        </MDBox>
                        
                        <MDBox mt={2}>
                            <Autocomplete options={['Sim', 'Não']} value={tempFilters.divergencia} onChange={(e, val) => handleTempAutocompleteChange('divergencia', val)} renderInput={(params) => <TextField {...params} label="Possui Divergência?" />} />
                        </MDBox>
                        <MDBox mt={2} mb={2}>
                            <Autocomplete options={['Sim', 'Não']} value={tempFilters.criticas} onChange={(e, val) => handleTempAutocompleteChange('criticas', val)} renderInput={(params) => <TextField {...params} label="Possui Críticas?" />} />
                        </MDBox>
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
                    entriesPerPage={false}
                    isSorted={false} 
                />
            </Card>
        </>
    );
}

LiveFeed.propTypes = {
    data: PropTypes.array.isRequired,
};

export default LiveFeed;