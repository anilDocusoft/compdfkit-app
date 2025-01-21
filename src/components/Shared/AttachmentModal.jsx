import React, { useState, useRef } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useDropzone } from "react-dropzone";
import { axiosInstance } from "../../Axios";
import { toast } from "react-hot-toast";
import { getLocalStorageValues } from "../../utils/localStorage";

const AttachmentModal = ({ open, onClose }) => {
    const { agrno, Email, password, ItemId, DocumentView, TokenCode } = getLocalStorageValues();

    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleDrop = (acceptedFiles) => {
        setUploadedFiles((prev) => [...prev, ...acceptedFiles]);
    };

    const handleFileInputChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        setUploadedFiles((prev) => [...prev, ...selectedFiles]);
    };

    const handleRemoveFile = (index) => {
        setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const { getRootProps, getInputProps } = useDropzone({
        onDrop: handleDrop,
        accept: { "image/*": [".jpg", ".jpeg", ".png"], "application/pdf": [".pdf"] },
        multiple: true,
    });

    const Json_AddAttachment = async () => {
        if (uploadedFiles.length === 0) {
            toast.error("Please select at least one file to upload.");
            return;
        }

        try {
            setLoading(true);
            for (let file of uploadedFiles) {
                const base64data = await toBase64(file);
                const payload = {
                    Email,
                    password,
                    agrno,
                    ItemId,
                    FileName: file.name,
                    base64data: base64data,
                };
                const response = await axiosInstance.post("Json_AddAttachment", payload);
                if (response?.data?.d === "true") {
                    toast.success(`Document "${file.name}" uploaded successfully.`);

                    setUploadedFiles((prev) => prev.filter((f) => f !== file));
                } else {
                    toast.error(`Error while uploading document "${file.name}".`);
                }
            }

        } catch (error) {
            toast.error("Error uploading documents.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                resolve(reader.result.split(",")[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle style={{ backgroundColor: "red", color: "white" }}>
                Add Attachment {uploadedFiles.length === 0 ? "" : uploadedFiles.length}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: "absolute",
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Box
                    mt={4}
                    {...getRootProps()}
                    sx={{
                        border: "2px dashed grey",
                        borderRadius: "8px",
                        padding: "16px",
                        textAlign: "center",
                        cursor: "pointer",
                    }}
                >
                    <input {...getInputProps()} />
                    <Typography variant="h6">
                        Drag & drop files here, or click to select files
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Accepted formats: JPG, PNG, PDF (Max 1000MB)
                    </Typography>
                </Box>

                <List>
                    {uploadedFiles && uploadedFiles.map((file, index) => (
                        <ListItem
                            sx={{
                                border: "1px solid grey",
                                height: "50px",
                                borderRadius: "8px",
                                marginTop: "8px",
                            }}
                            key={index}
                            secondaryAction={
                                <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
                                    <CloseIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText
                                primary={file.name}
                                secondary={`Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`}
                            />
                        </ListItem>
                    ))}
                </List>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    style={{ display: "none" }}
                    onChange={handleFileInputChange}
                />
            </DialogContent>
            <DialogActions>
                <Button
                    variant="contained"
                    color="error"
                    onClick={Json_AddAttachment}
                    disabled={loading}
                >
                    {loading ? "Uploading..." : "Submit"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AttachmentModal;
