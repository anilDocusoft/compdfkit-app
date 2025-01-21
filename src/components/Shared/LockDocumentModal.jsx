import React, { useState } from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Checkbox,
    Typography,
    Box,
    IconButton,
} from "@mui/material";
import { encryptAES, getLocalStorageValues } from "../../utils/localStorage";
import toast from "react-hot-toast";
import CloseIcon from "@mui/icons-material/Close";

const LockDocumentModal = ({ open, onClose, Json_UpdateVersionItem }) => {

    const [enableAttachments, setEnableAttachments] = useState(false);
    const [isLinkCopied, setIsLinkCopied] = useState(false);
    const handleCheckboxChange = (event) => {
        setIsLinkCopied(false)
        setEnableAttachments(event.target.checked);
    };
    const handleSendEmail = () => {
        console.log("Send link via email clicked!");
        toast.success("Link sent via email!");
        onClose();
    };
    const handleCopyLink = () => {
        Json_UpdateVersionItem().then(() => {
            const { agrno, Email, password, ItemId } = getLocalStorageValues();
            let TokenCode = enableAttachments ? "C" : "A";
            let link = `TokenCode=${TokenCode}&DocumentView=${"limitedAccess"}&agrno=${agrno}&Email=${Email}&password=${password}&ItemId=${ItemId}`;
            const encryptedParams = encryptAES(link, 'password');
            const generatedLink = `http://localhost:3001/?${encryptedParams}`;
            navigator.clipboard.writeText(generatedLink)
                .then(() => {
                    console.log("Link copied to clipboard:", generatedLink);
                    toast('Link copied to clipboard', {
                        position: 'bottom-left',
                        duration: Infinity,
                        style: {
                            background: 'black',
                            color: '#fff',
                            padding: '8px',
                            borderRadius: '8px',
                            fontSize: '14px',
                        },
                        icon: '📋',
                    });
                    setIsLinkCopied(true);
                    setTimeout(() => {
                        handleConfirmationAlert();
                    }, 3000);
                })
                .catch((err) => {
                    console.error("Failed to copy link:", err);
                    toast.error("Failed to copy the link. Please try again.");
                });
        });
    };
    const handleConfirmationAlert = () => {
        const userChoice = window.confirm("Do you want to close the window? Click 'OK' to close or 'Cancel' for something else.");
        if (userChoice) {
            window.close();
        } else {
            console.log("User chose to perform another action.");
        }
    };
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle style={{ textAlign: "start", fontWeight: "bold" }}>
                Share Form
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
                <Typography
                    variant="body1"
                    style={{ textAlign: "start", marginBottom: "20px" }}
                >
                    Document will remain locked for editing until the client submits the changes.
                    To revoke client access permission, check the document back into the system.
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="start" mb={2}>
                    <Checkbox
                        checked={enableAttachments}
                        onChange={handleCheckboxChange}
                    />
                    <Typography variant="body1">Enable Attachments</Typography>
                </Box>
            </DialogContent>
            <DialogActions
                style={{ justifyContent: "end", paddingBottom: "20px" }}
            >
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendEmail}
                    style={{ marginRight: "10px" }}
                >
                    Send Link Via Email
                </Button>
                <Button
                    variant="outlined"
                    onClick={handleCopyLink}
                    disabled={isLinkCopied}
                    {...(isLinkCopied ? { style: { color: "green", border: "1px solid black" } } : {})}
                >
                    {isLinkCopied ? "Link Copied!" : "Copy Link"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LockDocumentModal;
