import { useState, useEffect, useCallback, useMemo } from "react";
import { FirebaseApp } from "firebase/app";
import { createStorageService } from "../services/storageService";
import { ErrorUtils } from "../utils/common";
import type { StorageBrowserItem } from "../types";

export interface UseStorageBrowserResult {
    items: StorageBrowserItem[];
    loading: boolean;
    error: string | null;
    uploadProgress: number;
    uploadingFile: string | null;
    deletingPath: string | null;
    refreshItems: () => Promise<void>;
    uploadFile: (file: File, path: string) => Promise<void>;
    createFolder: (folderPath: string) => Promise<void>;
    deleteItem: (item: StorageBrowserItem) => Promise<void>;
    getDownloadURL: (filePath: string) => Promise<string>;
}

/**
 * Custom hook for storage browser functionality
 */
export const useStorageBrowser = (
    firebaseApp: FirebaseApp,
    currentPath: string = ""
): UseStorageBrowserResult => {
    const [items, setItems] = useState<StorageBrowserItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadingFile, setUploadingFile] = useState<string | null>(null);
    const [deletingPath, setDeletingPath] = useState<string | null>(null);

    // Create service instance
    const storageService = useMemo(() => {
        return createStorageService(firebaseApp);
    }, [firebaseApp]);

    const refreshItems = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const storageItems = await storageService.listItems(currentPath);
            setItems(storageItems);
        } catch (e: unknown) {
            const errorMessage = ErrorUtils.getErrorMessage(e, "Error loading storage contents.");
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [storageService, currentPath]);

    const uploadFile = useCallback(async (file: File, path: string) => {
        setUploadingFile(file.name);
        setUploadProgress(0);

        try {
            const uploadTask = storageService.uploadFile(file, path, (progress) => {
                setUploadProgress(progress);
            });

            await uploadTask;
            setUploadingFile(null);
            setUploadProgress(0);
            await refreshItems();
        } catch (error: unknown) {
            console.error("Upload error", error);
            setUploadingFile(null);
            setUploadProgress(0);
            throw error;
        }
    }, [storageService, refreshItems]);

    const createFolder = useCallback(async (folderPath: string) => {
        try {
            await storageService.createFolder(folderPath);
            await refreshItems();
        } catch (error: unknown) {
            console.error("Failed to create folder", error);
            throw error;
        }
    }, [storageService, refreshItems]);

    const deleteItem = useCallback(async (item: StorageBrowserItem) => {
        setDeletingPath(item.fullPath);

        try {
            if (item.isFolder) {
                await storageService.deleteFolder(item.fullPath);
            } else {
                await storageService.deleteFile(item.fullPath);
            }
            await refreshItems();
        } catch (error: unknown) {
            console.error("Failed to delete storage item", error);
            throw error;
        } finally {
            setDeletingPath(null);
        }
    }, [storageService, refreshItems]);

    const getDownloadURL = useCallback(async (filePath: string) => {
        try {
            return await storageService.getDownloadURL(filePath);
        } catch (error: unknown) {
            console.error("Failed to get download URL", error);
            throw error;
        }
    }, [storageService]);

    useEffect(() => {
        refreshItems();
    }, [refreshItems]);

    return {
        items,
        loading,
        error,
        uploadProgress,
        uploadingFile,
        deletingPath,
        refreshItems,
        uploadFile,
        createFolder,
        deleteItem,
        getDownloadURL
    };
};