// material-react-app/src/layouts/observabilidade/importManagement/components/Dropzone.js

import React from "react";
import PropTypes from "prop-types";

// @mui material components
import Icon from "@mui/material/Icon";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

function Dropzone({ file, onFileSelect, system, disabled = false, disabledText }) {
    const handleLocalDragOver = (e) => {
        e.preventDefault();
    };

    const handleLocalDrop = (e) => {
        e.preventDefault();
        if (disabled) return;
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith(".csv")) {
                onFileSelect(droppedFile);
            }
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    let message = disabledText;
    if (!disabled) {
        message = file ? file.name : "Arraste e solte o arquivo ou clique aqui";
    }

    const inputId = `file-input-${system || 'default'}`;

    return (
        <MDBox
            sx={(theme) => ({
                border: "2px dashed",
                borderColor: theme.palette.grey[500],
                borderRadius: "10px",
                textAlign: "center",
                padding: "24px",
                cursor: disabled ? "not-allowed" : "pointer",
                opacity: disabled ? 0.6 : 1,
                transition: "all 0.3s ease-in-out",
                backgroundColor: disabled ? theme.palette.action.disabledBackground : "transparent",
                "&:hover": {
                    backgroundColor: !disabled ? theme.palette.action.hover : undefined,
                    borderColor: !disabled ? theme.palette.info.main : undefined,
                },
            })}
            onClick={() => {
                if (!disabled) {
                    document.getElementById(inputId).click();
                }
            }}
            onDragOver={handleLocalDragOver}
            onDrop={handleLocalDrop}
        >
            {/* <<< INÍCIO DA ALTERAÇÃO >>> */}
            <Icon 
                fontSize="large" 
                // Define cores vibrantes para cada estado, garantindo a visibilidade
                sx={{ 
                    color: disabled 
                        ? 'text.disabled' 
                        : (file ? 'success.main' : 'info.main') 
                }}
            >
                {file ? 'check_circle' : 'upload_file'}
            </Icon>
            {/* A propriedade correta 'color="text"' garante que o texto fique branco no modo escuro */}
            <MDTypography variant="h6" mt={1} fontSize="1rem" color="text">
                {message}
            </MDTypography>
            {/* <<< FIM DA ALTERAÇÃO >>> */}
            <input
                id={inputId}
                type="file"
                accept=".csv"
                hidden
                disabled={disabled}
                onChange={handleFileChange}
                key={file ? file.name : 'empty-input'}
            />
        </MDBox>
    );
}

Dropzone.propTypes = {
    file: PropTypes.object,
    onFileSelect: PropTypes.func.isRequired,
    system: PropTypes.string,
    disabled: PropTypes.bool,
    disabledText: PropTypes.string.isRequired,
};

Dropzone.defaultProps = {
    file: null,
    system: 'default',
    disabled: false,
};

export default Dropzone;