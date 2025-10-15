// Onde o seu arquivo de Footer está localizado.

import PropTypes from "prop-types";

// @mui material components
import Link from "@mui/material/Link";

// Material Dashboard 2 React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";

// Material Dashboard 2 React base styles
import typography from "assets/theme/base/typography";

function Footer() {
    const { size } = typography;

    return (
        <MDBox
            width="100%"
            display="flex"
            flexDirection={{ xs: "column", lg: "row" }}
            justifyContent="center" // Alterado para centralizar o conteúdo
            alignItems="center"
            px={1.5}
        >
            {/* <<< INÍCIO DA ALTERAÇÃO >>> */}
            {/* O conteúdo antigo foi substituído por uma única linha de texto com o link da NicolaSec */}
            <MDBox
                display="flex"
                justifyContent="center"
                alignItems="center"
                flexWrap="wrap"
                color="text"
                fontSize={size.sm}
                px={1.5}
            >
                &copy; {new Date().getFullYear()}, Desenvolvido por&nbsp;
                <Link href="https://www.nicolasec.com.br/" target="_blank">
                    <MDTypography variant="button" fontWeight="medium" color="info">
                        NicolaSec
                    </MDTypography>
                </Link>
                .
            </MDBox>
            {/* <<< FIM DA ALTERAÇÃO >>> */}
        </MDBox>
    );
}

// <<< ALTERAÇÃO: Removido o defaultProps e propTypes antigos, pois não são mais necessários >>>
Footer.defaultProps = {};
Footer.propTypes = {};

export default Footer;