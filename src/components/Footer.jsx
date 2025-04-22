import { Box, Typography, Link as MuiLink } from "@mui/material";

export default function Footer() {
    return (
        <Box component="footer" sx={{ py: 2, textAlign: "center", mt: "auto" }}>
            <Typography variant="body2" color="text.secondary">
                © {new Date().getFullYear()} •Built with React, Mapbox & Deck.gl•{" "}
                <MuiLink
                    href="https://github.com/mohnark"
                    target="_blank"
                    rel="noopener noreferrer"
                    underline="hover"
                    color="inherit"
                >
                    GitHub
                </MuiLink>
            </Typography>
        </Box>
    );
}
