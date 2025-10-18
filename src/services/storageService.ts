import { FirebaseApp } from "firebase/app";
import {
    deleteObject,
    getDownloadURL,
    getMetadata,
    getStorage,
    listAll,
    ref as storageRef,
    uploadBytes,
    uploadBytesResumable,
    StorageReference,
    ListResult,
    FullMetadata,
    UploadTask
} from "firebase/storage";
import type { StorageBrowserItem } from "../types";
import { FOLDER_PLACEHOLDER } from "../constants";

export class StorageService {
    private storage;

    constructor(private firebaseApp: FirebaseApp) {
        this.storage = getStorage(firebaseApp);
    }

    /**
     * List all items in a storage path
     */
    async listItems(path: string = ""): Promise<StorageBrowserItem[]> {
        try {
            const baseRef = path ? storageRef(this.storage, path) : storageRef(this.storage);
            const result: ListResult = await listAll(baseRef);

            const folders: StorageBrowserItem[] = result.prefixes.map((prefix) => ({
                name: prefix.name,
                fullPath: prefix.fullPath,
                isFolder: true
            }));

            const files: StorageBrowserItem[] = await Promise.all(
                result.items.map(async (item) => {
                    try {
                        const metadata: FullMetadata = await getMetadata(item);
                        return {
                            name: item.name,
                            fullPath: item.fullPath,
                            isFolder: false,
                            size: metadata.size,
                            updated: metadata.updated ? new Date(metadata.updated) : undefined
                        };
                    } catch (metadataError: unknown) {
                        console.error("Failed to fetch metadata for", item.fullPath, metadataError);
                        return {
                            name: item.name,
                            fullPath: item.fullPath,
                            isFolder: false
                        };
                    }
                })
            );

            // Filter out placeholder files and sort items
            const filteredFiles = files.filter((item) => item.name !== FOLDER_PLACEHOLDER);

            return [
                ...folders.sort((a, b) => a.name.localeCompare(b.name)),
                ...filteredFiles.sort((a, b) => a.name.localeCompare(b.name))
            ];
        } catch (error) {
            console.error("Error listing storage contents", error);
            throw error;
        }
    }

    /**
     * Upload a file to storage
     */
    uploadFile(
        file: File,
        path: string,
        onProgress?: (progress: number) => void
    ): UploadTask {
        const fileRef = storageRef(this.storage, path);
        const uploadTask = uploadBytesResumable(fileRef, file);

        if (onProgress) {
            uploadTask.on("state_changed", (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress(progress);
            });
        }

        return uploadTask;
    }

    /**
     * Create a folder by uploading a placeholder file
     */
    async createFolder(folderPath: string): Promise<void> {
        try {
            const placeholderRef = storageRef(this.storage, `${folderPath}/${FOLDER_PLACEHOLDER}`);
            await uploadBytes(placeholderRef, new Uint8Array());
        } catch (error) {
            console.error("Failed to create folder", error);
            throw error;
        }
    }

    /**
     * Delete a file
     */
    async deleteFile(filePath: string): Promise<void> {
        try {
            await deleteObject(storageRef(this.storage, filePath));
        } catch (error) {
            console.error("Failed to delete file", error);
            throw error;
        }
    }

    /**
     * Delete a folder recursively
     */
    async deleteFolder(folderPath: string): Promise<void> {
        try {
            const dirRef = storageRef(this.storage, folderPath);
            const result = await listAll(dirRef);

            await Promise.all([
                ...result.items.map((itemRef) => deleteObject(itemRef)),
                ...result.prefixes.map((prefixRef) => this.deleteFolder(prefixRef.fullPath))
            ]);
        } catch (error) {
            console.error("Failed to delete folder", error);
            throw error;
        }
    }

    /**
     * Get download URL for a file
     */
    async getDownloadURL(filePath: string): Promise<string> {
        try {
            return await getDownloadURL(storageRef(this.storage, filePath));
        } catch (error) {
            console.error("Failed to get download URL", error);
            throw error;
        }
    }
}

// Factory function to create service instance
export const createStorageService = (firebaseApp: FirebaseApp): StorageService => {
    return new StorageService(firebaseApp);
};