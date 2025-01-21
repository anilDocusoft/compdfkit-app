import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { clearLocalStorage, decryptAndGetValues, getLocalStorageValues, saveQueryParamsToLocalStorage } from "../utils/localStorage";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import StoreClientDetailsModal from "../components/Shared/userDetails";
import AttachmentModal from "../components/Shared/AttachmentModal";
import LockDocumentModal from "../components/Shared/LockDocumentModal";
import { axiosInstance } from "../Axios";
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import ComPDFKitViewer from '@compdfkit_pdf_sdk/webviewer';

export default function PdfViewerComponent() {
  const { agrno, Email, password, ItemId, Guid, VersionId, ViewerToken, DocumentView, TokenCode } = getLocalStorageValues();
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const decryptAES = (encryptedBase64, key) => {
    const decrypted = AES.decrypt(encryptedBase64, key);
    return decrypted.toString(Utf8);
  };
  let decryptedValues = decryptAES(location.search.slice(1), 'password')
  saveQueryParamsToLocalStorage(decryptedValues);
  const [file, setFile] = useState(null);
  const [base64Data, setBase64Data] = useState(null);
  const [latestVersioin, setLatestVersion] = useState(null);
  const [openClientDialog, setOpenClientDialog] = useState(false);
  const [openAttachmentModal, setOpenAttachmentModal] = useState(false);
  const [openLockDocumentModal, setOpenLockDocumentModal] = useState(false);

  // console.log('✌️latestVersioin --->', latestVersioin);

  const containerRef = useRef(null);
  const [instance, setInstance] = useState(null);
  const [instance2, setInstance2] = useState(null);

  const comanPayload = {
    Email,
    password,
    agrno,
    ItemId: Number(ItemId),
  };
  const Json_GetItemBase64DataById = async () => {
    try {
      const response = await axiosInstance.post(
        "Json_GetItemBase64DataById",
        comanPayload
      );
      setBase64Data(response?.data?.d);
      const responseData = JSON.parse(response?.data?.d);
      if (responseData) {
        const byteCharacters = atob(responseData);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
          const slice = byteCharacters.slice(offset, offset + 1024);
          const byteNumbers = new Array(slice.length);

          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }

          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        const blob = new Blob(byteArrays, { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        setFile(blobUrl)
        Json_AddToWork('Document Viewed')
      } else {
        toast.error("Base64 string not found in the response.");
      }
    } catch (error) {
      console.error("Error fetching item data:", error);
      toast.error("An error occurred while fetching the document.");
    }
  };
  const Json_GetVersionByItemId = async () => {
    const payload = {
      Email,
      password,
      agrno,
      itemId: Number(ItemId),
    };
    try {
      const response = await axiosInstance.post("Json_GetVersionByItemId", payload);
      if (response.data.d) {
        const responseData = JSON.parse(response?.data?.d);
        let d = responseData.Table
        setLatestVersion(d?.[d?.length - 1])
      } else {
        toast.error("Error while checking in item");
      }
    } catch (error) {
      console.log(error, "Error while checking in item");
      toast.error("Error checking in item");
    }
  };
  const Json_UpdateVersionItem = async () => {
    if (!instance) {
      toast.error("ComPDFKitViewer instance is not ready.");
      return;
    }
    try {
      const pdfArrayBuffer = await instance.exportPDF();
      if (!(pdfArrayBuffer instanceof ArrayBuffer)) {
        console.error("Expected ArrayBuffer from exportPDF, but got:", pdfArrayBuffer);
        toast.error("Error exporting PDF.");
        return;
      }
      const pdfBytes = new Uint8Array(pdfArrayBuffer);
      const payload = {
        Email,
        password,
        agrno,
        ItemId,
        FileVersionData: Array.from(pdfBytes),
        VersionNo: Number(latestVersioin?.VersionNo),
      };
      const response = await axiosInstance.post("Json_UpdateVersionItem", payload);
      let d = JSON.parse(response?.data?.d)
      if (d === "Success") {
        toast.success("Document version updated successfully.");
        Json_AddToWork('Document Save to Cloud')
      } else {
        toast.error("Error while updating version.");
      }
    } catch (error) {
      console.error("Error while updating version:", error);
      toast.error("Error updating version.");
    }
  };
  const Json_CheckInItem = async () => {
    if (!instance) {
      toast.error("ComPDFKitViewer instance is not ready.");
      return;
    }
    try {
      const pdfArrayBuffer = await instance.exportPDF();
      if (!(pdfArrayBuffer instanceof ArrayBuffer)) {
        console.error("Expected ArrayBuffer from exportPDF, but got:", pdfArrayBuffer);
        toast.error("Error exporting PDF.");
        return;
      }
      const pdfBytes = new Uint8Array(pdfArrayBuffer);
      const payload = {
        Email,
        password,
        agrno,
        ItemId,
        FileVersionData: Array.from(pdfBytes),
        VersionNo: Number(latestVersioin?.VersionNo),
      };
      const response = await axiosInstance.post("Json_CheckInItem", payload);
      let d = JSON.parse(response?.data?.d)
      if (d === "Success") {
        Json_GetItemBase64DataById();
        Json_GetVersionByItemId();
        clearLocalStorage();
        Json_AddToWork('Document Check-in')
        toast.success("Document Check-in  successfully.");
      } else {
        toast.error("Error while updating version.");
      }
    } catch (error) {
      console.error("Error while updating version:", error);
      toast.error("Error updating version.");
    }
  };
  const Json_AddToWork = async (comment) => {
    try {
      const payload = {
        Email,
        password,
        agrno,
        ItemId,
        comment
      };
      const response = await axiosInstance.post("Json_AddToWork", payload);
    } catch (error) {
      console.error("Error while adding to work.");
    }
  };

  useEffect(() => {
    if (isLoading) {
      return;
    }
    if (isAuthenticated) {
      Json_GetItemBase64DataById();
      Json_GetVersionByItemId();
    } else {
      toast.error("! Please provide valid credentials");
    }
  }, [isAuthenticated, isLoading]);

  let openClintInputModalCheck = localStorage.getItem('openClintInputModal')
  useEffect(() => {
    const loadPdfDocument = async () => {
      if (file) {
        ComPDFKitViewer.init({
          path: '/',
          pdfUrl: file,
          license: 'Njc4NzgzZjUxOWRlOQ==',
        }, containerRef.current).then((instance) => {
          setInstance2(instance);     
        })
      }
    };
    if (file) {
      loadPdfDocument();
    };
  }, [file]);
  useEffect(() => {
    if (instance2) {
      console.log('✌️instance2 --->', instance2);
      const { Core, UI, docViewer } = instance2;
      // UI.setHeaderItems(function (header) {
      //   // Get all feature area.
      //   const items = header.getHeader('right-container').getItems()?.[0];
      //   console.log(items);
      // });
  
      // console.log(document.getElementById('.drop-menu'))
      // Hide the annotation button in the feature area.
      // UI.disableElements('toolMenu-View');
      // UI.disableElements("openFileButton");
      // UI.disableElements('searchButton');
      // UI.disableElements('cropPageButton');
      // UI.disableElements('header');
      // Show the annotation button in the feature area.
      // UI.enableElements('toolMenu-Annotation');
    }
    if (instance2) {
      const { Core, UI, docViewer } = instance2;
      const toolbarItems = [
        { type: "zoom-out" },
        { type: "zoom-in" },
        { type: "sidebar-thumbnails" },
        { type: "sidebar-document-outline" },
        { type: "sidebar-signatures" },
        { type: "pan" },
        { type: "zoom-mode" },
        { type: "spacer" },
        { type: "search" },
        // { type: "export-pdf" },
      ];
      const checkIn = {
        type: "custom",
        id: "pdf-protected",
        title: "Check In",
        tooltip: "Check In",
        icon: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_z5uUwBMLwkPnGPLkdbcaQOauBRB60k363Q&s`,
        width: 24,
        height: 24,
        alignment: "top-right",
        position: { x: 10, y: 10 },
        onPress: Json_CheckInItem,
      };
      const openClintInputModal = {
        type: "custom",
        id: "AttachmentSettings",
        title: "Attachment Settings",
        tooltip: "Attachment Settings",
        icon: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk5ZdaeiEQjS3qFZN9WJ71oGJ608rZxhnZww&s`,
        width: 24,
        height: 24,
        alignment: "top-right",
        position: { x: 10, y: 10 },
        onPress: () => setOpenLockDocumentModal(true),
      };
      const AddAttachment = {
        type: "custom",
        id: "AddAttachment",
        title: "Add Attachment",
        tooltip: "Add Attachment",
        icon: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsW_8y45Z_WNhpRUUn13wTvoQJq3wz385f5GdMR81NPmPzPJIPXw35GH5YPpT_JKXhesU&usqp=CAU`,
        width: 24,
        height: 24,
        alignment: "top-right",
        position: { x: 10, y: 10 },
        onPress: () => setOpenAttachmentModal(true),
      };
      const saveToCloud = {
        type: "custom",
        id: "saveToCloud",
        title: "Save To Cloud",
        tooltip: "Save To Cloud",
        icon: `https://png.pngtree.com/element_our/20190601/ourmid/pngtree-cloud-upload-free-button-png-image-image_1338275.jpg`,
        width: 24,
        height: 24,
        alignment: "top-right",
        position: { x: 10, y: 10 },
        onPress: Json_UpdateVersionItem,
      };
      const setReadOnlyState = () => {
        if (!latestVersioin.IsLocked) {
          // instance.setViewState(viewState => viewState.set("readOnly", true));
          // instance.setToolbarItems(() => [
          //   ...toolbarItems
          // ]);
          UI.disableElements('copyTextButton');
          UI.textPopup.update([]);
        }
      };
      const setToolbarItemsForFullControl = () => {
        instance.setToolbarItems(items => [
          ...items,
          { type: "form-creator" },
          { type: "content-editor" },
          saveToCloud,
          checkIn,
          openClintInputModal
        ]);

      };

      const setToolbarItemsForLimitedAccess = () => {
        const additionalItems = [
          { type: "content-editor" },
          checkIn
        ];
        if (TokenCode === 'C') {
          instance.setToolbarItems(() => [
            ...toolbarItems,
            ...additionalItems,
            AddAttachment
          ]);
        } else if (TokenCode === 'A') {
          instance.setToolbarItems(() => [
            ...toolbarItems,
            ...additionalItems
          ]);
        } else {
          instance.setToolbarItems(() => [
            ...toolbarItems,
            ...additionalItems
          ]);
        }
      };
      
      if (latestVersioin.IsLocked) {
        if (DocumentView === 'FullControl') {
          // setToolbarItemsForFullControl();
        } else if (DocumentView === 'limitedAccess') {
          if (TokenCode == 'A' || TokenCode == 'C') {
            if (openClintInputModalCheck == 'opened') {
              // setOpenClientDialog(false)
            } else {
              // setOpenClientDialog(true)
              localStorage.setItem('openClintInputModal', "opened")
            }
          }
          // setToolbarItemsForLimitedAccess();
        }
      } else {
        setReadOnlyState();
      }
    }
  }, [instance2]);

  return (
    <>
      <StoreClientDetailsModal open={openClientDialog} onClose={() => setOpenClientDialog(false)} />
      <LockDocumentModal Json_UpdateVersionItem={Json_UpdateVersionItem} Json_GetItemBase64DataById={Json_GetItemBase64DataById} Json_GetVersionByItemId={Json_GetVersionByItemId} open={openLockDocumentModal} onClose={() => setOpenLockDocumentModal(false)} />
      <AttachmentModal open={openAttachmentModal} onClose={() => setOpenAttachmentModal(false)} />
      <div ref={containerRef} style={{ width: "100%", height: "95vh" }} />
    </>
  );
}