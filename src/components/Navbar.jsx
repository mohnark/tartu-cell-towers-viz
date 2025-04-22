import { useState } from "react";
import { AppBar, Toolbar, Typography, IconButton, Box, Button,
    Drawer, List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { GitHub, Menu as MenuIcon } from "@mui/icons-material";
import { NavLink, Link } from "react-router-dom";

const navItems = [
    { to: "/basic",       label: "Basic Map" },
    { to: "/choropleth",  label: "Choropleth" },
    { to: "/heatmap",     label: "Heatmap" },
];

export default function Navbar() {
    const [open, setOpen] = useState(false);
    const toggle = () => setOpen(o => !o);

    return (
        <>
            <AppBar position="sticky" color="default" elevation={1}>
                <Toolbar>

                    {/* mobile burger */}
                    <IconButton
                        onClick={toggle}
                        edge="start"
                        sx={{ mr: 2, display: { md: "none" } }}
                        color="inherit"
                    >
                        <MenuIcon />
                    </IconButton>

                    {/* title */}
                    <Typography
                        variant="h6"
                        component={Link}
                        to="/basic"
                        sx={{ flexGrow: 1, textDecoration: "none", color: "inherit" }}
                    >
                        SDW - Tartu
                    </Typography>

                    {/* desktop links */}
                    <Box sx={{ display: { xs: "none", md: "flex" }, gap: 2 }}>
                        {navItems.map(({ to, label }) => (
                            <Button
                                key={to}
                                component={NavLink}
                                to={to}
                                color="inherit"
                                sx={{
                                    "&.active": { color: "primary.main" },
                                    textTransform: "none",
                                }}
                            >
                                {label}
                            </Button>
                        ))}
                    </Box>

                    {/* GitHub */}
                    <IconButton
                        component="a"
                        href="https://github.com/mohnark"
                        target="_blank"
                        rel="noopener noreferrer"
                        color="inherit"
                        sx={{ ml: 1 }}
                    >
                        <GitHub />
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* mobile drawer */}
            <Drawer anchor="left" open={open} onClose={toggle} sx={{ display: { md: "none" } }}>
                <Box sx={{ width: 250 }} role="presentation" onClick={toggle} onKeyDown={toggle}>
                    <List>
                        {navItems.map(({ to, label }) => (
                            <ListItem key={to} disablePadding>
                                <ListItemButton
                                    component={NavLink}
                                    to={to}
                                    sx={{ "&.active .MuiListItemText-root": { color: "primary.main" } }}
                                >
                                    <ListItemText primary={label} />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
        </>
    );
}
