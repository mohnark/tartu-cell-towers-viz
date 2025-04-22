import { createTheme } from "@mui/material/styles";

const theme = createTheme({
    palette: {
        mode: "dark",
        primary: { main: "#90caf9" },      // tweak these if you like
        secondary: { main: "#f48fb1" },
    },
});

export default theme;