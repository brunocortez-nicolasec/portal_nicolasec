// material-react-app/src/layouts/observabilidade/geral/components/LiveFeed.js

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
      {/* Render value if it exists and is not empty */}
      {value != null && value !== '' && (<MDTypography variant="button" fontWeight="regular" color={valueColor}>{value}</MDTypography>)}
      {/* Render N/A if value is null/undefined/empty/false/0 and no children */}
       {!value && value !== 0 && value !== false && !children && (<MDTypography variant="button" fontWeight="regular" color={valueColor}>N/A</MDTypography>)}
      {/* Render children if provided */}
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


// --- INÍCIO DA CORREÇÃO: MODAL DE DETALHES (LIVEFEED) ---
const DivergenceModal = React.forwardRef(({ user, onClose, darkMode, getDivergenceLabel }, ref) => {
  if (!user) return null; // Don't render if no user data

  // Determine if the item represents only an RH Identity (ACCESS_NOT_GRANTED case)
  // Check if divergenceDetails exists and contains the specific code
  const isIdentityOnly = user.divergenceDetails?.some(d => d.code === 'ACCESS_NOT_GRANTED');

  // --- CORREÇÃO AQUI ---
  // Get RH data directly from the top-level 'rhData' field provided by the backend.
  // For ACCESS_NOT_GRANTED, the 'user' object *is* the RH data.
  const identityData = isIdentityOnly ? user : (user.rhData || null);

  // Get Account data. For ACCESS_NOT_GRANTED, there's no account data.
  // For other cases, use the main 'user' object as it represents the account.
  const accountData = isIdentityOnly ? null : user;
  // --- FIM DA CORREÇÃO ---


  // Function to render detailed comparison of divergences
  const renderComparisonSection = () => {
    if (!user?.divergenceDetails || user.divergenceDetails.length === 0) {
      return (
        <MDBox display="flex" alignItems="center" mb={1}>
          <Icon color="success" fontSize="small" sx={{ mr: 1.5 }}>check_circle</Icon>
          <MDTypography variant="button" color={darkMode ? "white" : "text.secondary"}>
            Nenhuma inconsistência encontrada.
          </MDTypography>
        </MDBox>
      );
    }

    return user.divergenceDetails.map((divergence, index) => {
      const { code, rhData: divRhData, appData: divAppData, targetSystem, text } = divergence;
      let specificDetails = null;

      // Use the account's sourceSystem if appData is not available in divergence (e.g., ORPHAN)
      const appSystemName = divAppData?.system?.name || accountData?.sourceSystem || 'Sistema App';

      switch (code) {
        case "CPF_MISMATCH":
          specificDetails = (
            <>
              <DetailItem icon="badge" label={`CPF no RH`} value={divRhData?.cpf} darkMode={darkMode} />
              <DetailItem icon="badge" label={`CPF em ${appSystemName}`} value={divAppData?.cpf} darkMode={darkMode} />
            </>
          );
          break;
        case "NAME_MISMATCH":
          specificDetails = (
            <>
              <DetailItem icon="person" label={`Nome no RH`} value={divRhData?.name} darkMode={darkMode} />
              <DetailItem icon="person" label={`Nome em ${appSystemName}`} value={divAppData?.name} darkMode={darkMode} />
            </>
          );
          break;
        case "EMAIL_MISMATCH":
          specificDetails = (
            <>
              <DetailItem icon="email" label={`Email no RH`} value={divRhData?.email} darkMode={darkMode} />
              <DetailItem icon="email" label={`Email em ${appSystemName}`} value={divAppData?.email} darkMode={darkMode} />
            </>
          );
          break;
        case "ZOMBIE_ACCOUNT":
          specificDetails = (
           <>
             <DetailItem icon="toggle_off" label={`Status no RH`} value={divRhData?.status} darkMode={darkMode} />
             <DetailItem icon="toggle_on" label={`Status em ${appSystemName}`} value={divAppData?.status} darkMode={darkMode} />
           </>
          );
          break;
        case "ACCESS_NOT_GRANTED":
          specificDetails = <DetailItem icon="link_off" label={`Acesso esperado em`} value={targetSystem} darkMode={darkMode} />;
          break;
        case "ORPHAN_ACCOUNT":
          specificDetails = <DetailItem icon="person_off" label="Detalhe" value={text || "Conta sem vínculo com RH."} darkMode={darkMode} />
          break;
        case "DORMANT_ADMIN":
          specificDetails = <DetailItem icon="history_toggle_off" label="Detalhe" value={text || "Admin inativo."} darkMode={darkMode} />
          break;
        case "USERTYPE_MISMATCH":
          specificDetails = (
           <>
             <DetailItem icon="work_outline" label={`Tipo no RH`} value={divRhData?.userType} darkMode={darkMode} />
             <DetailItem icon="work" label={`Tipo em ${appSystemName}`} value={divAppData?.userType} darkMode={darkMode} />
           </>
          );
          break;
        default:
          specificDetails = <DetailItem icon="warning" label="Detalhe" value={text || "Informação adicional indisponível."} darkMode={darkMode} />;
          break;
      }
      
      return (
        <MDBox key={`${code}-${index}`} mt={index > 0 ? 2.5 : 0}>
           <MDBox display="flex" alignItems="center" sx={{ mb: 1.5 }}>
             <Icon fontSize="small" sx={{ mr: 1.5 }} color="error">warning</Icon> 
             <MDTypography 
               variant="button" 
               fontWeight="medium" 
               color={darkMode ? "white" : "dark"}
             >
               {getDivergenceLabel(code)}
             </MDTypography>
           </MDBox>
           {specificDetails}
        </MDBox>
      );
    });
  };

  return (
    <Box ref={ref} tabIndex={-1}>
      <Card sx={{ width: "80vw", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto" }}>
        <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center">
          {/* Title changes based on whether it's just Identity or Account */}
          <MDTypography variant="h5">Detalhes da {isIdentityOnly ? "Identidade (RH)" : "Conta"}</MDTypography>
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
            {/* Coluna 1: Dados da Identidade (RH) */}
            <Grid item xs={12} md={6}>
              <MDTypography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                  {/* Title depends on whether identityData was found */}
                  {identityData ? "Identidade Vinculada (RH)" : "Identidade (RH)"}
              </MDTypography>
              {/* Show details if identityData exists, otherwise show Orphan message */}
              {identityData ? (
                 <>
                   <DetailItem icon="person" label="Nome" value={identityData.name} darkMode={darkMode} />
                   <DetailItem icon="email" label="Email" value={identityData.email} darkMode={darkMode} />
                   <DetailItem icon="badge" label="CPF" value={identityData.cpf} darkMode={darkMode} />
                   {/* Use id_user for business ID from RH */}
                   <DetailItem icon="vpn_key" label="ID RH" value={identityData.id_user} darkMode={darkMode} />
                   <DetailItem icon="work" label="Tipo" value={identityData.userType} darkMode={darkMode} />
                   {/* Use rh_status for RH status */}
                   <DetailItem icon="approval" label="Status RH" value={identityData.rh_status || identityData.status} darkMode={darkMode} />
                 </>
              ) : (
                 <MDTypography variant="caption" color="textSecondary">Conta não vinculada (Órfã).</MDTypography>
              )}
            </Grid>
            
            {/* Coluna 2: Dados da Conta (App) ou Divergência ACCESS_NOT_GRANTED */}
            <Grid item xs={12} md={6}>
              {/* If it's identity only (ACCESS_NOT_GRANTED), show the divergence comparison */}
              {isIdentityOnly ? (
                  <MDBox>
                    <MDTypography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>Inconsistência</MDTypography>
                    {renderComparisonSection()}
                  </MDBox>
              ) : (
                // Otherwise, show Account details
                 <MDBox>
                   <MDTypography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>Conta (Sistema)</MDTypography>
                   {/* Use accountData safely */}
                   <DetailItem icon="computer" label="Sistema" value={accountData?.sourceSystem} darkMode={darkMode} /> 
                   <DetailItem icon="vpn_key" label="ID no Sistema" value={accountData?.id_user} darkMode={darkMode} />
                   <DetailItem icon="person_outline" label="Nome na Conta" value={accountData?.name} darkMode={darkMode} />
                   <DetailItem icon="admin_panel_settings" label="Perfil App" value={accountData?.perfil} darkMode={darkMode} />
                   <DetailItem icon="apps" label="Status App" value={accountData?.app_status} darkMode={darkMode} />
                   <DetailItem icon="login" label="Último Login" value={accountData?.last_login ? new Date(accountData.last_login).toLocaleDateString('pt-BR') : ''} darkMode={darkMode} />
                 </MDBox>
              )}
            </Grid>
          </Grid>

          {/* Show Divergence comparison section only if it's NOT just an Identity */}
          {!isIdentityOnly && (
            <>
              <Divider sx={{ my: 2 }} />
              <MDBox>
                <MDTypography variant="h6" fontWeight="medium" sx={{ mb: 2 }}>
                  Inconsistências Encontradas
                </MDTypography>
                {renderComparisonSection()}
              </MDBox>
            </>
          )}
        </MDBox>
      </Card>
    </Box>
  );
});
DivergenceModal.propTypes = {
    user: PropTypes.object, // Can be null initially
    onClose: PropTypes.func.isRequired,
    darkMode: PropTypes.bool,
    getDivergenceLabel: PropTypes.func.isRequired,
};
DivergenceModal.defaultProps = {
    user: null,
    darkMode: false,
};
DivergenceModal.displayName = 'DivergenceModal';
// --- FIM DA CORREÇÃO ---


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
    if (text === "NÃO ENCONTRADO") color = "warning"; // Changed color for clarity
    return <MDTypography variant="caption" color={color} fontWeight="medium">{text}</MDTypography>;
};
StatusCell.propTypes = { status: PropTypes.string };
StatusCell.defaultProps = { status: null };


function LiveFeed({ data, isLoading }) { // Added isLoading prop
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
                // Include RH in options for filtering? Assuming not for now.
                const systemNames = response.data
                    .filter(system => system.name.toUpperCase() !== 'RH') 
                    .map(system => system.name);
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
    
    // Define initialFilters clearly
    const initialFilters = useMemo(() => ({ 
        nome: "", 
        email: "", 
        perfil: "", 
        sistema: null, // Expect string or null
        divergencia: null, // Expect 'Sim', 'Não', or null
        criticas: null, // Expect 'Sim', 'Não', or null
        divergenceType: null // Expect object { code: '...', label: '...' } or null
    }), []);

    const divergenceOptions = useMemo(() => [
        { code: 'ORPHAN_ACCOUNT', label: 'Conta Órfã' },
        { code: 'ZOMBIE_ACCOUNT', label: 'Acesso Ativo Indevido' },
        { code: 'ACCESS_NOT_GRANTED', label: 'Acesso Previsto Não Concedido' },
        { code: 'CPF_MISMATCH', label: 'Divergência de CPF' },
        { code: 'NAME_MISMATCH', label: 'Divergência de Nome' },
        { code: 'EMAIL_MISMATCH', label: 'Divergência de E-mail' },
        { code: 'USERTYPE_MISMATCH', label: 'Divergência de Tipo de Usuário' },
        { code: 'DORMANT_ADMIN', label: 'Admin Dormente' },
    ], []);

    const [filters, setFilters] = useState(initialFilters);
    const [tempFilters, setTempFilters] = useState(initialFilters);
    
    const open = Boolean(anchorEl);
    
    // Moved divergenceLabels inside component or pass as prop if needed elsewhere
    const divergenceLabels = useMemo(() => ({
        ACCESS_NOT_GRANTED: "Acesso Previsto Não Concedido",
        ZOMBIE_ACCOUNT: "Acesso Ativo Indevido",
        CPF_MISMATCH: "Divergência de CPF",
        NAME_MISMATCH: "Divergência de Nome",
        EMAIL_MISMATCH: "Divergência de E-mail",
        DORMANT_ADMIN: "Admin Dormente",
        ORPHAN_ACCOUNT: "Conta Órfã",
        USERTYPE_MISMATCH: "Divergência de Tipo de Usuário",
    }), []);
    const getDivergenceLabel = (code) => divergenceLabels[code] || code;
    
    // Event Handlers
    const handleFilterMenuOpen = (event) => { setTempFilters(filters); setAnchorEl(event.currentTarget); };
    const handleFilterMenuClose = () => setAnchorEl(null);
    const handleApplyFilters = () => { setFilters(tempFilters); handleFilterMenuClose(); };
    const handleClearFilters = () => { setFilters(initialFilters); setTempFilters(initialFilters); handleFilterMenuClose(); };
    const handleTempFilterChange = (e) => { const { name, value } = e.target; setTempFilters(prev => ({ ...prev, [name]: value })); };
    const handleTempAutocompleteChange = (name, value) => { setTempFilters(prev => ({ ...prev, [name]: value })); };
    const handleOpenModal = (user) => { setSelectedUser(user); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedUser(null); };

    // PDF Generation
    const handleGeneratePdf = () => {
        const doc = new jsPDF();
        const tableColumns = tableData.columns.map(c => c.Header); // Use table headers
        const tableRows = [];

        // Use the filtered rawData for export
        tableData.rawData.forEach(user => {
            const rowData = [
                `${user.name || '-'} (Tipo: ${user.userType || 'N/A'})`,
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
        
        // Adjust column header if needed
        const adjustedColumns = tableColumns.map(col => col === 'NOME' ? 'NOME (TIPO)' : col);

        doc.text("Relatório - Live Feed", 14, 15);
        autoTable(doc, {
            head: [adjustedColumns],
            body: tableRows,
            startY: 20,
            styles: { fontSize: 8 }, // Smaller font for potentially wide table
            headStyles: { fillColor: [0, 123, 255] }, // Blue header
        });
        doc.save(`relatorio_live_feed_${new Date().toISOString().slice(0,10)}.pdf`);
    };


    // Memoized Table Data processing
    const tableData = useMemo(() => {
        let filteredData = data || []; // Start with the passed data
        
        // Apply Search Term
        if (searchTerm.trim() !== "") {
            const lowerSearch = searchTerm.toLowerCase();
            filteredData = filteredData.filter(user => 
                (user.name && user.name.toLowerCase().includes(lowerSearch)) ||
                (user.email && user.email.toLowerCase().includes(lowerSearch)) ||
                (user.id_user && String(user.id_user).toLowerCase().includes(lowerSearch)) || // Ensure id_user is string for includes
                (user.sourceSystem && user.sourceSystem.toLowerCase().includes(lowerSearch))
            );
        }
        
        // Apply Advanced Filters if any are set
        if (Object.keys(filters).some(key => filters[key] !== initialFilters[key])) {
             filteredData = filteredData.filter(u => {
                 const matchNome = !filters.nome || (u.name && u.name.toLowerCase().includes(filters.nome.toLowerCase()));
                 const matchEmail = !filters.email || (u.email && u.email.toLowerCase().includes(filters.email.toLowerCase()));
                 const matchPerfil = !filters.perfil || (u.perfil && u.perfil.toLowerCase().includes(filters.perfil.toLowerCase()));
                 const matchSistema = !filters.sistema || (u.sourceSystem && u.sourceSystem === filters.sistema);
                 const matchDivergencia = filters.divergencia === null || (filters.divergencia === 'Sim' ? u.divergence : !u.divergence);
                 const matchCriticas = filters.criticas === null || (filters.criticas === 'Sim' ? u.isCritical : !u.isCritical);
                 const matchDivergenceType = !filters.divergenceType || (u.divergenceDetails && u.divergenceDetails.some(d => d.code === filters.divergenceType.code));
                 
                 return matchNome && matchEmail && matchPerfil && matchSistema && matchDivergencia && matchCriticas && matchDivergenceType;
             });
        }
        
        // Map filtered data to table rows format
        const rows = filteredData.map(u => ({
          ...u, // Spread original user data
          // Cell renderers:
          nome: ( // Make entire cell clickable
            <MDBox onClick={() => handleOpenModal(u)} sx={{ cursor: "pointer", width: '100%' }}>
              <AuthorCell nome={u.name} tipo={u.userType} />
            </MDBox>
          ),
          email: <MDTypography variant="caption">{u.email || '-'}</MDTypography>,
          sourceSystem: <MDTypography variant="caption">{u.sourceSystem}</MDTypography>,
          rh_status: <StatusCell status={u.rh_status} />,
          app_status: <StatusCell status={u.app_status} />,
          perfil: <MDTypography variant="caption">{u.perfil || '-'}</MDTypography>,
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
                { Header: "NOME", accessor: "nome", width: "20%", align: "left" }, // Keep align left
                { Header: "EMAIL", accessor: "email", width: "20%", align: "left" }, // Keep align left
                { Header: "SISTEMA", accessor: "sourceSystem", align: "center" },
                { Header: "STATUS RH", accessor: "rh_status", align: "center"},
                { Header: "STATUS APP", accessor: "app_status", align: "center"},
                { Header: "PERFIL", accessor: "perfil", align: "center" },
                { Header: "DIVERGÊNCIA", accessor: "diverg", align: "center" },
                { Header: "CRÍTICAS", accessor: "criticas", align: "center" },
            ],
            rows,
            rawData: filteredData, // Keep raw filtered data for export
        };
    }, [data, filters, searchTerm, handleOpenModal]); // Dependencies for memoization

    return (
        <>
            {/* Modal for showing divergence details */}
            {isModalOpen && ( // Render modal conditionally
                <Modal open={isModalOpen} onClose={handleCloseModal} sx={{ display: "grid", placeItems: "center" }}>
                    <DivergenceModal 
                        user={selectedUser} 
                        onClose={handleCloseModal} 
                        darkMode={darkMode} 
                        getDivergenceLabel={getDivergenceLabel} 
                    />
                </Modal>
            )}

            {/* Main Card for Live Feed Table */}
            <Card>
                <MDBox p={2} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap"> {/* Added flexWrap */}
                    <MDTypography variant="h4" fontWeight="bold" color="info" textGradient sx={{ flexShrink: 0, mr: 2 }}> {/* Added mr */}
                        Live Feed
                    </MDTypography>
                    <MDBox display="flex" alignItems="center" gap={1} sx={{ flexGrow: 1, justifyContent: { xs: 'center', md: 'flex-end' }, my: { xs: 1, md: 0 } }}> {/* Responsive justify */}
                        {/* Search Input - Removed for DataTable built-in search */}
                        
                        <MDButton variant="gradient" color="info" size="small" onClick={handleFilterMenuOpen} sx={{ minWidth: '100px'}}> {/* Added minWidth */}
                            Filtros <Icon>keyboard_arrow_down</Icon>
                        </MDButton>
                        <MDButton variant="outlined" color="info" size="small" onClick={handleGeneratePdf} sx={{ flexShrink: 0 }}>
                            <Icon>download</Icon>&nbsp;Relatório
                        </MDButton>
                    </MDBox>
                </MDBox>

                {/* Filter Menu */}
                <Menu 
                    anchorEl={anchorEl} 
                    open={open} 
                    onClose={handleFilterMenuClose} 
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} 
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{ sx: { maxHeight: '80vh', overflowY: 'auto' } }} // Make menu scrollable
                >
                    <MDBox p={2} sx={{ width: '300px' }}>
                        <MDTypography variant="button" fontWeight="medium">Filtros Avançados</MDTypography>
                        {/* Filter Fields */}
                        <MDBox mt={2}><TextField label="Nome" name="nome" value={tempFilters.nome} onChange={handleTempFilterChange} fullWidth size="small" /></MDBox>
                        <MDBox mt={2}><TextField label="Email" name="email" value={tempFilters.email} onChange={handleTempFilterChange} fullWidth size="small" /></MDBox>
                        <MDBox mt={2}><TextField label="Perfil" name="perfil" value={tempFilters.perfil} onChange={handleTempFilterChange} fullWidth size="small" /></MDBox>
                        <MDBox mt={2}>
                            <Autocomplete 
                                options={['', ...systemOptions]} // Add empty option to clear
                                getOptionLabel={(option) => option || ""}
                                value={tempFilters.sistema}
                                onChange={(event, newValue) => handleTempAutocompleteChange('sistema', newValue === '' ? null : newValue)} // Set null on empty
                                renderInput={(params) => <TextField {...params} label="Sistema" size="small"/>} 
                            />
                        </MDBox>
                        <MDBox mt={2}>
                            <Autocomplete 
                                options={[{ label: 'Todos', code: null }, ...divergenceOptions]} // Add 'Todos' option
                                getOptionLabel={(option) => option.label || ""}
                                value={tempFilters.divergenceType?.code ? tempFilters.divergenceType : divergenceOptions.find(o => o.code === null)} // Handle null selection
                                onChange={(event, newValue) => handleTempAutocompleteChange('divergenceType', newValue?.code === null ? null : newValue)} // Set null if 'Todos' selected
                                isOptionEqualToValue={(option, value) => option.code === value?.code}
                                renderInput={(params) => <TextField {...params} label="Tipo de Divergência" size="small"/>} 
                            />
                        </MDBox>
                        
                        {/* --- INÍCIO DA CORREÇÃO (Filtro Divergência) --- */}
                        <MDBox mt={2}>
                            <Autocomplete 
                                options={['Sim', 'Não']} // Removido o 'null'
                                value={tempFilters.divergencia} 
                                onChange={(e, val) => handleTempAutocompleteChange('divergencia', val)} 
                                renderInput={(params) => <TextField {...params} label="Possui Divergência?" size="small"/>} 
                            />
                        </MDBox>
                        {/* --- FIM DA CORREÇÃO --- */}
                        
                        {/* --- INÍCIO DA CORREÇÃO (Filtro Críticas) --- */}
                        <MDBox mt={2} mb={2}>
                            <Autocomplete 
                                options={['Sim', 'Não']} // Removido o 'null'
                                value={tempFilters.criticas} 
                                onChange={(e, val) => handleTempAutocompleteChange('criticas', val)} 
                                renderInput={(params) => <TextField {...params} label="Possui Críticas?" size="small"/>} 
                            />
                        </MDBox>
                        {/* --- FIM DA CORREÇÃO --- */}

                        <Divider />
                        {/* Filter Actions */}
                        <MDBox display="flex" justifyContent="space-between" mt={2}>
                            <MDButton variant="text" color="secondary" size="small" onClick={handleClearFilters}>Limpar</MDButton>
                            <MDButton variant="gradient" color="info" size="small" onClick={handleApplyFilters}>Aplicar</MDButton>
                        </MDBox>
                    </MDBox>
                </Menu>
                
                {/* DataTable */}
                <DataTable 
                    table={tableData} 
                    // Use DataTable's search
                    canSearch={true} // Enable built-in search
                    // Use DataTable's pagination
                    showTotalEntries 
                    entriesPerPage={{ defaultValue: 10, entries: [5, 10, 25, 50, 100] }} // Default & options
                    isSorted={true} // Enable sorting
                    noEndBorder
                    isLoading={isLoading} // Pass isLoading prop
                />
            </Card>
        </>
    );
}

LiveFeed.propTypes = {
    data: PropTypes.array.isRequired,
    isLoading: PropTypes.bool, // Add prop type for isLoading
};

// --- INÍCIO DA MODIFICAÇÃO: Default prop for isLoading ---
LiveFeed.defaultProps = {
    isLoading: false, // Default isLoading to false
};
// --- FIM DA MODIFICAÇÃO ---


export default LiveFeed;