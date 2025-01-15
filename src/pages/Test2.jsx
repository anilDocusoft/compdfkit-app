import { useEffect, useRef } from 'react';
import ComPDFKitViewer from '@compdfkit_pdf_sdk/webviewer';

export default function WebViewer() {
    const containerRef = useRef(null);

    useEffect(() => {
        let docViewer = null;

        ComPDFKitViewer.init({
            path: '/',
            pdfUrl: './example/developer_guide_web.pdf',
            license: 'Njc4NzgzZjUxOWRlOQ=='
        }, containerRef.current).then((instance) => {
            const { Core, UI, docViewer } = instance;
            // docViewer = instance.docViewer;
            // UI.setActiceToolMode('toolMenu-Annotation');
            // UI.disableElements('toolMenu-Annotation');



        })
    }, []);

    return <div ref={containerRef} style={{ width: "100%", height: "100vh", overflow: "hidden" }} />
}