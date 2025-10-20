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
import CircularProgress from "@mui/material/CircularProgress";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDInput from "components/MDInput";
import MDButton from "components/MDButton";
import DataTable from "examples/Tables/DataTable";
import colors from "assets/theme/base/colors";
import MDBadge from "components/MDBadge";

// --- COMPONENTE HELPER PADRONIZADO ---
function DetailItem({ icon, label, value, children, darkMode }) {
  const valueColor = darkMode ? "white" : "text.secondary";
  return (
    <MDBox display="flex" alignItems="center" mb={1.5} lineHeight={1}>
      <Icon color="secondary" fontSize="small" sx={{ mr: 1.5 }}>{icon}</Icon>
      <MDTypography variant="button" fontWeight="bold" color="text">{label}:&nbsp;</MDTypography>
      {value != null && value !== '' && (<MDTypography variant="button" fontWeight="regular" color={valueColor}>{value}</MDTypography>)}
      {!value && value !== false && !children && (<MDTypography variant="button" fontWeight="regular" color={valueColor}>N/A</MDTypography>)}
      {children}
    </MDBox>
  );
}

DetailItem.propTypes = {
  icon: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.any,
  children: PropTypes.node,
  darkMode: PropTypes.bool,
};
DetailItem.defaultProps = {
  darkMode: false,
  value: null,
  children: null,
};


// --- MODAL DE DETALHES DA IDENTIDADE (REFEITO COM COMPARAÇÃO) ---
const DivergenceModal = React.forwardRef(({ user, onClose, darkMode, getDivergenceLabel }, ref) => {
  if (!user) return null;

  // Função para renderizar a comparação detalhada das divergências
  const renderComparisonSection = () => {
    // ======================= INÍCIO DA ALTERAÇÃO 1 =======================
    // Verifica se há detalhes de divergência
    if (!user?.divergenceDetails || user.divergenceDetails.length === 0) {
      return (
        <MDBox display="flex" alignItems="center" mb={1}>
          {/* Corrigido: Ícone verde 'success' quando não há inconsistências */}
          <Icon color="success" fontSize="small" sx={{ mr: 1.5 }}>check_circle</Icon>
          <MDTypography variant="button" color={darkMode ? "white" : "text.secondary"}>
            Nenhuma inconsistência encontrada.
          </MDTypography>
        </MDBox>
      );
    }

    // Mapeia CADA divergência encontrada para exibir sua comparação
    return user.divergenceDetails.map((divergence, index) => {
      const { code, rhData, appData, targetSystem, text } = divergence;
      let specificDetails = null;

      switch (code) {
        case "CPF_MISMATCH":
          specificDetails = (
            <>
              <DetailItem icon="badge" label={`CPF no RH`} value={rhData?.cpf} darkMode={darkMode} />
              <DetailItem icon="badge" label={`CPF em ${appData?.sourceSystem}`} value={appData?.cpf} darkMode={darkMode} />
            </>
          );
          break;
        case "NAME_MISMATCH":
          specificDetails = (
            <>
              <DetailItem icon="person" label={`Nome no RH`} value={rhData?.name} darkMode={darkMode} />
              <DetailItem icon="person" label={`Nome em ${appData?.sourceSystem}`} value={appData?.name} darkMode={darkMode} />
            </>
          );
          break;
        case "EMAIL_MISMATCH":
          specificDetails = (
            <>
              <DetailItem icon="email" label={`Email no RH`} value={rhData?.email} darkMode={darkMode} />
              <DetailItem icon="email" label={`Email em ${appData?.sourceSystem}`} value={appData?.email} darkMode={darkMode} />
            </>
          );
          break;
        case "ZOMBIE_ACCOUNT":
           specificDetails = (
             <>
               <DetailItem icon="toggle_off" label={`Status no RH`} value={rhData?.status} darkMode={darkMode} />
               <DetailItem icon="toggle_on" label={`Status em ${appData?.sourceSystem}`} value={appData?.status} darkMode={darkMode} />
             </>
           );
           break;
        case "ACCESS_NOT_GRANTED":
           specificDetails = <DetailItem icon="link_off" label={`Acesso esperado em`} value={targetSystem} darkMode={darkMode} />;
           break;
        case "ORPHAN":
           specificDetails = <DetailItem icon="person_off" label="Detalhe" value={text} darkMode={darkMode} />
           break;
        case "DORMANT_ADMIN":
           specificDetails = <DetailItem icon="history_toggle_off" label="Detalhe" value={text} darkMode={darkMode} />
           break;
        case "USERTYPE_MISMATCH":
           specificDetails = (
             <>
               <DetailItem icon="work_outline" label={`Tipo no RH`} value={rhData?.userType} darkMode={darkMode} />
               <DetailItem icon="work" label={`Tipo em ${appData?.sourceSystem}`} value={appData?.userType} darkMode={darkMode} />
             </>
           );
           break;
        default:
          specificDetails = <DetailItem icon="warning" label="Detalhe" value={text} darkMode={darkMode} />;
          break;
      }
      
      // Retorna o TÍTULO da divergência + os detalhes específicos
      return (
        <MDBox key={`${code}-${index}`} mt={index > 0 ? 2.5 : 0}>
           {/* Título da Divergência (Ícone vermelho e alinhado) */}
           <MDBox display="flex" alignItems="center" sx={{ mb: 1.5 }}> {/* Margin bottom igual ao DetailItem */}
              {/* Corrigido: Ícone 'error' (vermelho) e margem 'mr: 1.5' para alinhar */}
              <Icon fontSize="small" sx={{ mr: 1.5 }} color="error">warning</Icon> 
              <MDTypography 
                variant="button" 
                fontWeight="medium" 
                color={darkMode ? "white" : "dark"}
              >
                {getDivergenceLabel(code)} {/* Usa a função para obter o nome amigável */}
              </MDTypography>
           </MDBox>
           {/* Corrigido: Removido o 'pl={1}' para alinhar os detalhes com o título */}
           {specificDetails}
        </MDBox>
      );
    });
    // ======================== FIM DA ALTERAÇÃO 1 =========================
  };

  if (!user) return null; // Não renderiza nada se não houver usuário selecionado

  return (
    <Box ref={ref} tabIndex={-1}>
      <Card sx={{ width: "80vw", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}>
        <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h5">Detalhes da Identidade</MDTypography>
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
        </MDBox>
        
        <MDBox p={3} pt={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <MDTypography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>Identificação</MDTypography>
              <DetailItem icon="person" label="Nome" value={user.name} darkMode={darkMode} />
              <DetailItem icon="email" label="Email" value={user.email} darkMode={darkMode} />
              <DetailItem icon="badge" label="CPF" value={user.cpf} darkMode={darkMode} />
              <DetailItem icon="vpn_key" label="ID de Origem" value={user.id_user} darkMode={darkMode} />
              <DetailItem icon="computer" label="Sistema Origem" value={user.sourceSystem} darkMode={darkMode} /> 
              <DetailItem icon="admin_panel_settings" label="Perfil App" value={user.perfil} darkMode={darkMode} />
            </Grid>
            <Grid item xs={12} md={6}>
              <MDTypography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>Status e Acesso</MDTypography>
              <DetailItem icon="work" label="Tipo" value={user.userType} darkMode={darkMode} />
              <DetailItem icon="approval" label="Status RH" value={user.rh_status} darkMode={darkMode} />
              <DetailItem icon="apps" label="Status App" value={user.app_status} darkMode={darkMode} />
              <DetailItem icon="login" label="Último Login" value={user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : ''} darkMode={darkMode} />
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />
          
          <MDBox>
            <MDTypography variant="h6" fontWeight="medium" sx={{ mb: user.divergenceDetails && user.divergenceDetails.length > 0 ? 2 : 1 }}> {/* Ajustado MB para 2 */}
              Inconsistências Encontradas
            </MDTypography>
            {renderComparisonSection()}
          </MDBox>
        </MDBox>
      </Card>
    </Box>
  );
});
DivergenceModal.propTypes = {
    user: PropTypes.object,
    onClose: PropTypes.func.isRequired,
    darkMode: PropTypes.bool,
    getDivergenceLabel: PropTypes.func.isRequired,
};
DivergenceModal.defaultProps = {
    user: null,
    darkMode: false,
};

const AuthorCell = ({ nome, tipo }) => (
    <MDBox display="flex" alignItems="center" lineHeight={1}>
        <MDBox lineHeight={1}>
            <MDTypography display="block" variant="button" fontWeight="medium" sx={{ "&:hover": { color: colors.info.main }}}>
                {nome || "N/A"}
            </MDTypography>
            <MDTypography variant="caption">Tipo: {tipo || 'N/A'}</MDTypography>
        </MDBox>
    </MDBox>
);
AuthorCell.propTypes = { nome: PropTypes.string, tipo: PropTypes.string };
AuthorCell.defaultProps = { nome: null, tipo: null };

const StatusCell = ({ status }) => {
    let color = "secondary";
    let text = status ? String(status).toUpperCase() : "-";
    if (text === "ATIVO") color = "success";
    if (text === "INATIVO") color = "error";
    if (text === "NÃO ENCONTRADO") color = "secondary";
    return <MDTypography variant="caption" color={color} fontWeight="medium">{text}</MDTypography>;
};
StatusCell.propTypes = { status: PropTypes.string };
StatusCell.defaultProps = { status: null };


function LiveFeed({ data }) {
    const [controller] = useMaterialUIController();
    const { token, darkMode } = controller;
    const [systemOptions, setSystemOptions] = useState([]);

    useEffect(() => {
        const fetchSystems = async () => {
            if (!token) return;
            try {
                const response = await axios.get('/systems', {
                    headers: { "Authorization": `Bearer ${token}` },
                });
                // Filtra para pegar apenas nomes de sistemas (fontes de dados)
                const systemNames = response.data.map(system => system.name);
                setSystemOptions(systemNames); // Define as opções para o filtro
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
    
    // Define a função getDivergenceLabel aqui para ser passada ao modal
    const divergenceLabels = {
        ACCESS_NOT_GRANTED: "Acesso Previsto Não Concedido",
        ZOMBIE: "Acesso Ativo Indevido", // Corrigido de ZOMBIE_ACCOUNT para ZOMBIE
        ZOMBIE_ACCOUNT: "Acesso Ativo Indevido", // Adicionado para garantir
        CPF_MISMATCH: "Divergência de CPF",
        NAME_MISMATCH: "Divergência de Nome",
        EMAIL_MISMATCH: "Divergência de E-mail",
        DORMANT_ADMIN: "Admin Dormente",
        ORPHAN: "Conta Órfã",
        USERTYPE_MISMATCH: "Divergência de Tipo de Usuário",
    };
    const getDivergenceLabel = (code) => divergenceLabels[code] || code; // Retorna o próprio código se não encontrar
    
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
                {/* Passa a função getDivergenceLabel para o modal */}
                <DivergenceModal 
                  user={selectedUser} 
                  onClose={handleCloseModal} 
                  darkMode={darkMode} 
                  getDivergenceLabel={getDivergenceLabel} 
                />
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