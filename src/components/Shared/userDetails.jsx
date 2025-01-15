import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    IconButton
} from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';

const StoreClientDetailsModal = ({ open, onClose }) => {

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        companyName: "",
        comment: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Form Submitted:", formData);
        onClose(); // Close dialog after submission
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>

            <IconButton
                aria-label="close"
                onClick={onClose}
                sx={(theme) => ({
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: theme.palette.grey[500],
                })}
            >
                <CloseIcon />
            </IconButton>
            <DialogTitle style={{ backgroundColor: "red", color: "white" }}>
                Details
            </DialogTitle>
            <DialogContent>
                <Box
                    component="form"
                    onSubmit={handleSubmit}
                    sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 2 }}
                >
                    <TextField
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="First Name"
                        fullWidth
                        defaultValue="Small"
                        size="small"
                    />
                    <TextField
                        label="Email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        type="email"
                        fullWidth
                        defaultValue="Small"
                        size="small"
                    />
                    <TextField
                        label="Company Name"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Company Name"
                        defaultValue="Small"
                        size="small"
                        fullWidth
                    />
                    <TextField
                        label="Comment"
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        placeholder="Comment"
                        multiline
                        rows={3}
                        fullWidth
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="error"
                        style={{ alignSelf: "flex-end" }}
                    >
                        Submit
                    </Button>
                </Box>
            </DialogContent>
        </Dialog>
    );
};

export default StoreClientDetailsModal;
