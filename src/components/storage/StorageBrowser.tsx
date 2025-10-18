import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FirebaseApp } from "firebase/app";
import {
    deleteObject,
    getDownloadURL,
    getMetadata,
    getStorage,
    listAll,
    ref as storageRef,
    uploadBytesResumable
} from "firebase/storage";
import {
    Alert,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Paper,
    Typography
} from "@firecms/ui";

type StorageBrowserItem = {
    name: string;
    fullPath: string;
    isFolder: boolean;
    size?: number;
    updated?: Date;
};

type SelectionMode = "file" | "folder";

export type StorageBrowserProps = {
    firebaseApp: FirebaseApp;
    initialPath?: string;
    selectionMode?: SelectionMode;
    onSelect?: (path: string) => void;
    hideUpload?: boolean;
    hideDelete?: boolean;
};

const humanFileSize = (bytes?: number) => {
    if (bytes === undefined) return "-";
    const thresh = 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + " B";
    }
    const units = ["KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    let u = -1;
    let value = bytes;
    do {
        value /= thresh;
        ++u;
    } while (Math.abs(value) >= thresh && u < units.length - 1);
    return value.toFixed(1) + " " + units[u];
};

const getFileExtension = (name: string) => {
    const index = name.lastIndexOf(".");
    if (index === -1) return "";
    return name.substring(index + 1).toLowerCase();
};

export const StorageBrowser: React.FC<StorageBrowserProps> = ({
    firebaseApp,
    initialPath = "",
    selectionMode = "file",
    onSelect,
    hideUpload,
    hideDelete
}) => {

    const storage = useMemo(() => getStorage(firebaseApp), [firebaseApp]);
    const initialSegments = useMemo(() => (
        initialPath ? initialPath.split("/").filter(Boolean) : []
    ), [initialPath]);

    const [pathSegments, setPathSegments] = useState<string[]>(initialSegments);
    const [items, setItems] = useState<StorageBrowserItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [previewName, setPreviewName] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadingFile, setUploadingFile] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const currentPath = pathSegments.join("/");

    const refreshItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const baseRef = currentPath
                ? storageRef(storage, currentPath)
                : storageRef(storage);
            const result = await listAll(baseRef);

            const folders: StorageBrowserItem[] = result.prefixes.map((prefix) => ({
                name: prefix.name,
                fullPath: prefix.fullPath,
                isFolder: true
            }));

            const files: StorageBrowserItem[] = await Promise.all(result.items.map(async (item) => {
                try {
                    const metadata = await getMetadata(item);
                    return {
                        name: item.name,
                        fullPath: item.fullPath,
                        isFolder: false,
                        size: metadata.size,
                        updated: metadata.updated ? new Date(metadata.updated) : undefined
                    };
                } catch (metadataError: any) {
                    console.error("Failed to fetch metadata for", item.fullPath, metadataError);
                    return {
                        name: item.name,
                        fullPath: item.fullPath,
                        isFolder: false
                    };
                }
            }));

            const sortedItems = [
                ...folders.sort((a, b) => a.name.localeCompare(b.name)),
                ...files.sort((a, b) => a.name.localeCompare(b.name))
            ];

            setItems(sortedItems);
        } catch (e: any) {
            console.error("Error listing storage contents", e);
            setError(e?.message ?? "Error loading storage contents.");
        } finally {
            setLoading(false);
        }
    }, [currentPath, storage]);

    useEffect(() => {
        refreshItems();
    }, [refreshItems]);

    const handleBreadcrumbClick = (index: number) => {
        if (index === -1) {
            setPathSegments([]);
        } else {
            setPathSegments(pathSegments.slice(0, index + 1));
        }
    };

    const handleFolderOpen = (item: StorageBrowserItem) => {
        if (!item.isFolder) return;
        const relativeSegments = item.fullPath.split("/").filter(Boolean);
        setPathSegments(relativeSegments);
    };

    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
            fileInputRef.current.click();
        }
    };

    const handleUploadFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        const basePath = currentPath ? currentPath + "/" : "";
        Array.from(files).forEach((file) => {
            const fileRef = storageRef(storage, basePath + file.name);
            const uploadTask = uploadBytesResumable(fileRef, file);
            setUploadingFile(file.name);
            setUploadProgress(0);
            uploadTask.on("state_changed", (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            }, (err) => {
                console.error("Upload error", err);
                setUploadingFile(null);
                setUploadProgress(0);
            }, () => {
                setUploadingFile(null);
                setUploadProgress(0);
                refreshItems();
            });
        });
    };

    const handleDelete = async (item: StorageBrowserItem) => {
        if (!window.confirm(`Delete ${item.name}?`)) return;
        try {
            await deleteObject(storageRef(storage, item.fullPath));
            refreshItems();
        } catch (err: any) {
            console.error("Failed to delete storage item", err);
            alert("Failed to delete: " + (err?.message ?? "Unknown error"));
        }
    };

    const handleDownload = async (item: StorageBrowserItem) => {
        try {
            const url = await getDownloadURL(storageRef(storage, item.fullPath));
            window.open(url, "_blank");
        } catch (err: any) {
            console.error("Failed to download storage item", err);
            alert("Failed to download: " + (err?.message ?? "Unknown error"));
        }
    };

    const handlePreview = async (item: StorageBrowserItem) => {
        try {
            const url = await getDownloadURL(storageRef(storage, item.fullPath));
            setPreviewUrl(url);
            setPreviewName(item.name);
        } catch (err: any) {
            console.error("Failed to preview storage item", err);
            alert("Failed to preview: " + (err?.message ?? "Unknown error"));
        }
    };

    const allowPreview = (item: StorageBrowserItem) => {
        if (item.isFolder) return false;
        const ext = getFileExtension(item.name);
        return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
    };

    const handleSelectFolder = () => {
        if (selectionMode !== "folder" || !onSelect) return;
        const path = currentPath;
        onSelect(path);
    };

    const handleSelectFile = (item: StorageBrowserItem) => {
        if (selectionMode !== "file" || !onSelect) return;
        if (item.isFolder) return;
        onSelect(item.fullPath);
    };

    const breadcrumbTrail = [
        { label: "root", path: [] as string[] },
        ...pathSegments.map((segment, index) => ({
            label: segment,
            path: pathSegments.slice(0, index + 1)
        }))
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                    {breadcrumbTrail.map((crumb, index) => (
                        <React.Fragment key={index === 0 ? "root" : crumb.path.join("/")}>
                            {index !== 0 && <span className="text-text-secondary">/</span>}
                            <Button
                                variant="text"
                                size="small"
                                onClick={() => handleBreadcrumbClick(index - 1)}
                            >
                                {crumb.label || "root"}
                            </Button>
                        </React.Fragment>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {selectionMode === "folder" && onSelect &&
                        <Button
                            color="primary"
                            onClick={handleSelectFolder}
                        >
                            Select this folder
                        </Button>}
                    {!hideUpload && <Button
                        color="primary"
                        onClick={handleUploadClick}
                    >
                        Upload files
                    </Button>}
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={handleUploadFiles}
                    />
                </div>
            </div>

            {error && <Alert color="error">{error}</Alert>}

            {uploadingFile && (
                <Alert color="info">
                    Uploading {uploadingFile}… {uploadProgress.toFixed(0)}%
                </Alert>
            )}

            <Paper className="p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-surface-100 dark:bg-surface-800 text-left">
                            <tr>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium w-32">Size</th>
                                <th className="px-4 py-3 font-medium w-48">Updated</th>
                                <th className="px-4 py-3 font-medium w-40 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="flex items-center justify-center py-8">
                                            <CircularProgress />
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && items.length === 0 && (
                                <tr>
                                    <td colSpan={4}>
                                        <div className="flex items-center justify-center py-8">
                                            <Typography variant="body1" color="secondary">
                                                This folder is empty.
                                            </Typography>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && items.map((item) => (
                                <tr
                                    key={item.fullPath}
                                    className="border-t border-surface-200 dark:border-surface-700 hover:bg-surface-100/70 dark:hover:bg-surface-800/50 transition"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {item.isFolder ? (
                                                <Button
                                                    variant="text"
                                                    size="small"
                                                    onClick={() => handleFolderOpen(item)}
                                                >
                                                    📁 {item.name}
                                                </Button>
                                            ) : (
                                                <span>📄 {item.name}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">{item.isFolder ? "_" : humanFileSize(item.size)}</td>
                                    <td className="px-4 py-3">
                                        {item.updated ? item.updated.toLocaleString() : "-"}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            {!item.isFolder && (
                                                <>
                                                    <Button
                                                        size="small"
                                                        variant="text"
                                                        onClick={() => handleDownload(item)}
                                                    >
                                                        Download
                                                    </Button>
                                                    {allowPreview(item) &&
                                                        <Button
                                                            size="small"
                                                            variant="text"
                                                            onClick={() => handlePreview(item)}
                                                        >
                                                            Preview
                                                        </Button>}
                                                </>
                                            )}
                                            {selectionMode === "file" && onSelect && !item.isFolder && (
                                                <Button
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleSelectFile(item)}
                                                >
                                                    Select
                                                </Button>
                                            )}
                                            {!hideDelete && !item.isFolder && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDelete(item)}
                                                >
                                                    🗑️
                                                </IconButton>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Paper>

            <Dialog
                open={previewUrl !== null}
                maxWidth="lg"
            >
                <DialogTitle>{previewName}</DialogTitle>
                <DialogContent>
                    {previewUrl && (
                        <img src={previewUrl}
                            alt={previewName ?? ""}
                            className="max-w-full max-h-[60vh] object-contain" />
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPreviewUrl(null)}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export type StorageBrowserDialogProps = StorageBrowserProps & {
    open: boolean;
    onClose: () => void;
    title?: string;
};

export const StorageBrowserDialog: React.FC<StorageBrowserDialogProps> = ({
    open,
    onClose,
    title = "Storage browser",
    ...browserProps
}) => {
    return (
        <Dialog
            open={open}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle>{title}</DialogTitle>
            <DialogContent className="space-y-4">
                <StorageBrowser {...browserProps} />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};
