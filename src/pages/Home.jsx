import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { clearLocalStorage, getLocalStorageValues, saveQueryParamsToLocalStorage } from "../utils/localStorage";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import StoreClientDetailsModal from "../components/Shared/userDetails";
import AttachmentModal from "../components/Shared/AttachmentModal";
import LockDocumentModal from "../components/Shared/LockDocumentModal";
import { axiosInstance } from "../Axios";
import ComPDFKitViewer from '@compdfkit_pdf_sdk/webviewer';
import useFullPageLoader from "../components/Shared/Loading";
export default function PdfViewerComponent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { setIsLoading, loaderElement } = useFullPageLoader();
  const location = useLocation();
  let searchParams = location.search.slice(1)
  if (searchParams) {
    saveQueryParamsToLocalStorage(searchParams);
  }
  const { agrno, Email, password, ItemId, DocumentView, TokenCode } = getLocalStorageValues();
  const [file, setFile] = useState(null);
  const [base64Data, setBase64Data] = useState(null);
  const [latestVersioin, setLatestVersion] = useState(null);
  const [openClientDialog, setOpenClientDialog] = useState(false);
  const [openAttachmentModal, setOpenAttachmentModal] = useState(false);
  const [openLockDocumentModal, setOpenLockDocumentModal] = useState(false);
  useEffect(() => {
    if (searchParams) {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      if (window.location.href !== baseUrl) {
        window.history.replaceState(null, "", baseUrl);
      }
    }
  }, []);
  const containerRef = useRef(null);
  const [instance, setInstance] = useState(null);
  const comanPayload = {
    Email,
    password,
    agrno,
    ItemId: Number(ItemId),
  };
  const Json_GetItemBase64DataById = async () => {
    setIsLoading(true)
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
    } finally {
      setIsLoading(false)
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
      toast.error("Document is not ready. For any Action ");
      return;
    }
    setIsLoading(true)
    try {
      const docViewer = instance.docViewer;
      const docStream = await docViewer.download();
      const docBlob = new Blob([docStream], { type: 'application/pdf' });
      const pdfArrayBuffer = await docBlob.arrayBuffer();
      if (!(pdfArrayBuffer instanceof ArrayBuffer)) {
        console.error("Expected ArrayBuffer from docBlob, but got:", pdfArrayBuffer);
        console.error("Error exporting PDF.");
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
    }finally{
      setIsLoading(false)
    }
  };
  const Json_CheckInItem = async () => {
    if (!instance) {
      toast.error("Document is not ready. For any Action ");
      return;
    }
    setIsLoading(true)
    try {
      const docViewer = instance.docViewer;
      let docStream;
      if (TokenCode == 'A' || TokenCode == 'C') {
        docStream = await docViewer.flattenPdf();
      } else {
        docStream = await docViewer.download();
      }
      const docBlob = new Blob([docStream], { type: 'application/pdf' });
      if (TokenCode == 'A' || TokenCode == 'C') { }
      const pdfArrayBuffer = await docBlob.arrayBuffer();
      if (!(pdfArrayBuffer instanceof ArrayBuffer)) {
        console.error("Expected ArrayBuffer from docBlob, but got:", pdfArrayBuffer);
        console.error("Error exporting PDF.");
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
        toast.success("Document Check-in  successfully.");
        Json_AddToWork('Document Check-in')
        window.location.reload()
      } else {
        toast.error("Error while updating version.");
      }
    } catch (error) {
      console.error("Error while updating version:", error);
      toast.error("Error updating version.");
    } finally {
      setIsLoading(false)
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
          setInstance(instance);
          instance.UI.openElement('leftPanel');
        })
      }
    };
    if (file) {
      loadPdfDocument();
    };
  }, [file]);
  useEffect(() => {
    if (instance) {
      const { Core, UI, docViewer } = instance;
      console.log(instance, 'initialized');
      const checkIn = {
        name: 'customButton',
        type: 'actionButton',
        title: "Check In",
        dataElement: 'Check In',
        img: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT_z5uUwBMLwkPnGPLkdbcaQOauBRB60k363Q&s`,
        onClick: () => Json_CheckInItem(),
      }
      const AddAttachment = {
        name: `customButton`,
        type: 'actionButton',
        dataElement: 'AddAttachment',
        title: "Add Attachment",
        img: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRsW_8y45Z_WNhpRUUn13wTvoQJq3wz385f5GdMR81NPmPzPJIPXw35GH5YPpT_JKXhesU&usqp=CAU`,
        onClick: () => setOpenAttachmentModal(true)
      }
      const saveToCloud = {
        name: `customButton`,
        type: 'actionButton',
        dataElement: 'saveToCloud',
        title: "Save to Cloud",
        img: `https://png.pngtree.com/element_our/20190601/ourmid/pngtree-cloud-upload-free-button-png-image-image_1338275.jpg`,
        onClick: () => Json_UpdateVersionItem()
      }
      const openClintInputModal = {
        name: `customButton`,
        type: 'actionButton',
        dataElement: 'openClintInputModal',
        title: "Share Link",
        img: `https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRA7LcF8_N6Z9jx9cx1IMWQgtDo-gmuhDcQSQ&s`,
        onClick: () => setOpenLockDocumentModal(true)
      }

      const setReadOnlyState = () => {
        if (!latestVersioin.IsLocked) {
          UI.setHeaderItems(header => {
            header.getHeader('tools').update([]);
          });
          UI.disableElements(['downloadButton', "leftPanelButton", 'flattenButton', 'printButton', 'settingButton', 'openFileButton', 'rightPanelButton', 'cropPageButton', 'copyTextButton']);
          UI.textPopup.update([]);
        }
      };
      const setToolbarItemsForFullControl = () => {
        UI.setHeaderItems(function (header) {
          header.push(checkIn);
          header.push(saveToCloud);
          header.push(openClintInputModal);

        });
        UI.disableElements(['openFileButton', 'toolMenu-Separation', 'toolMenu-Compare'])
        console.log('this is Active ')

      };
      let disabledElements = ['downloadButton', 'flattenButton', 'settingButton', 'printButton', 'openFileButton', 'cropPageButton', 'toolMenu-Separation', 'toolMenu-Compare', 'toolMenu-Sign', 'toolMenu-Form']
      const setToolbarItemsForLimitedAccess = () => {
        if (TokenCode === 'C') {
          // UI.setHeaderItems(header => {
          //   header.getHeader('tools').update([]);
          // });
          UI.setHeaderItems(function (header) {
            header.push(checkIn);
            header.push(AddAttachment);
          });
          UI.disableElements(disabledElements)
          UI.enableElements(['toolMenu-Editor'])
          UI.disableSignatureTool([])
        } else if (TokenCode === 'A') {
          UI.setHeaderItems(header => {
            header.getHeader('tools').update([]);
          });
          UI.setHeaderItems(function (header) {
            header.push(checkIn);
          });
          UI.disableElements(disabledElements)
          UI.disableSignatureTool([])
        } else {
          // UI.setHeaderItems(header => {
          //   header.getHeader('tools').update([]);
          // });
          // UI.setHeaderItems(function (header) {
          //   header.push(checkIn);
          // });
          // UI.disableElements(disabledElements)
          // UI.disableSignatureTool([])
          setReadOnlyState()

        }
      };
      if (latestVersioin.IsLocked) {
        if (DocumentView === 'FullControl') {
          setToolbarItemsForFullControl();
        } else if (DocumentView === 'limitedAccess') {
          if (TokenCode == 'A' || TokenCode == 'C') {
            if (openClintInputModalCheck == 'opened') {
              setOpenClientDialog(false)
            } else {
              setOpenClientDialog(true)
              localStorage.setItem('openClintInputModal', "opened")
            }
          }
          setToolbarItemsForLimitedAccess();
        }
      } else {
        setReadOnlyState();
      }
    }
  }, [instance]);

  return (
    <>
      {loaderElement}
      <StoreClientDetailsModal open={openClientDialog} onClose={() => setOpenClientDialog(false)} />
      <LockDocumentModal Json_UpdateVersionItem={Json_UpdateVersionItem} Json_GetItemBase64DataById={Json_GetItemBase64DataById} Json_GetVersionByItemId={Json_GetVersionByItemId} open={openLockDocumentModal} onClose={() => setOpenLockDocumentModal(false)} />
      <AttachmentModal open={openAttachmentModal} onClose={() => setOpenAttachmentModal(false)} />
      <div ref={containerRef} style={{ width: "100%", height: "95vh" }} />
    </>
  )
}