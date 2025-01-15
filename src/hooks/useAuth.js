import { useState, useEffect } from "react";
import { getLocalStorageValues } from "../utils/localStorage";

export const useAuth = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const { agrno, Email, password, ItemId, Guid, VersionId, ViewerToken, DocumentView, TokenCode } = getLocalStorageValues();
        setTimeout(() => {
            if (password && Email && agrno && ItemId && DocumentView) {
                setIsAuthenticated(true);
            } else {
                setIsAuthenticated(false);
            }
            setIsLoading(false);
        }, 500);
    }, []);

    return { isAuthenticated, isLoading };
};
