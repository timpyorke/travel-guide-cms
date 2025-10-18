import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FirebaseApp } from "firebase/app";
import {
    deleteObject,
    getDownloadURL,
    getMetadata,
    getStorage,
    listAll,
    ref as storageRef,
    uploadBytes,
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
    Paper,
    TextField,
    Typography
} from "@firecms/ui";
import {
    FILE_SIZE_UNITS,
    FILE_SIZE_THRESHOLD,
    FILE_SIZE_DECIMAL_PRECISION,
    FOLDER_PLACEHOLDER,
    FILE_EXTENSIONS_PREVIEW,
    FOLDER_ICON,
    FILE_ICON,
    FOLDER_SIZE_PLACEHOLDER,
    SIZE_PLACEHOLDER_DASH,
    DATE_PLACEHOLDER_DASH,
    EMPTY_STRING,
    ZERO_LENGTH,
    BREADCRUMB_ROOT_LABEL,
    BREADCRUMB_SEPARATOR,
    BUTTON_TEXT_SELECT_THIS_FOLDER,
    BUTTON_TEXT_NEW_FOLDER,
    BUTTON_TEXT_UPLOAD_FILES,
    BUTTON_TEXT_DOWNLOAD,
    BUTTON_TEXT_PREVIEW,
    BUTTON_TEXT_SELECT,
    BUTTON_TEXT_DELETE,
    BUTTON_TEXT_CANCEL,
    BUTTON_TEXT_CREATE,
    BUTTON_TEXT_CLOSE,
    HEADER_CREATE_FOLDER,
    LABEL_FOLDER_NAME,
    PLACEHOLDER_ASSETS_FOLDER,
    TABLE_HEADER_NAME,
    TABLE_HEADER_SIZE,
    TABLE_HEADER_UPDATED,
    TABLE_HEADER_ACTIONS,
    DESCRIPTION_EMPTY_FOLDER,
    DIALOG_TITLE_STORAGE_BROWSER,
    VALIDATION_FOLDER_NAME_REQUIRED,
    VALIDATION_FOLDER_NAME_NO_SLASH,
    VALIDATION_FOLDER_NAME_LETTERS_NUMBERS,
    FOLDER_NAME_SANITIZE_REGEX,
    FOLDER_NAME_REPLACEMENT_CHAR,
    CONFIRM_DELETE_FOLDER,
    CONFIRM_DELETE_ACTION,
    LOADING_TEXT_CREATING_FOLDER,
    UPLOAD_PROGRESS_DECIMAL_PLACES,
    CSS_CLASS_HIDDEN,
    DEFAULT_FILE_INPUT_MULTIPLE,
    WINDOW_TARGET_BLANK,
    LAST_DOT_INDEX,
    CONSOLE_ERROR_FAILED_METADATA,
    CONSOLE_ERROR_LISTING_STORAGE,
    CONSOLE_ERROR_FAILED_CREATE_FOLDER,
    CONSOLE_ERROR_FAILED_DELETE_STORAGE,
    CONSOLE_ERROR_FAILED_DOWNLOAD_STORAGE,
    CONSOLE_ERROR_FAILED_PREVIEW_STORAGE,
    ALERT_ERROR_LOADING_STORAGE,
    ALERT_FAILED_DELETE,
    ALERT_FAILED_DOWNLOAD,
    ALERT_FAILED_PREVIEW,
    ALERT_UNKNOWN_ERROR,
    MATH_ABS_THRESHOLD,
    PROGRESS_COMPLETE_PERCENT
} from "../../constants";

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
    if (bytes === undefined) return SIZE_PLACEHOLDER_DASH;
    const thresh = FILE_SIZE_THRESHOLD;
    if (Math.abs(bytes) < thresh) {
        return bytes + " B";
    }
    const units = FILE_SIZE_UNITS;
    let u = LAST_DOT_INDEX;
    let value = bytes;
    do {
        value /= thresh;
        ++u;
    } while (Math.abs(value) >= thresh && u < units.length + LAST_DOT_INDEX);
    return value.toFixed(FILE_SIZE_DECIMAL_PRECISION) + " " + units[u];
};

const getFileExtension = (name: string) => {
    const index = name.lastIndexOf(".");
    if (index === LAST_DOT_INDEX) return EMPTY_STRING;
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
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [creatingFolder, setCreatingFolder] = useState(false);
    const [createFolderError, setCreateFolderError] = useState<string | null>(null);
    const [deletingPath, setDeletingPath] = useState<string | null>(null);

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

            const files: StorageBrowserItem[] = (await Promise.all(result.items.map(async (item) => {
                try {
                    const metadata = await getMetadata(item);
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
            }))).filter((item) => item.name !== FOLDER_PLACEHOLDER);

            const sortedItems = [
                ...folders.sort((a, b) => a.name.localeCompare(b.name)),
                ...files.sort((a, b) => a.name.localeCompare(b.name))
            ];

            setItems(sortedItems);
        } catch (e: unknown) {
            console.error("Error listing storage contents", e);
            const errorMessage = e instanceof Error ? e.message : "Error loading storage contents.";
            setError(errorMessage);
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

    const handleOpenCreateFolder = () => {
        setNewFolderName("");
        setCreateFolderError(null);
        setCreateFolderOpen(true);
    };

    const handleCreateFolder = async () => {
        const trimmedName = newFolderName.trim();
        if (!trimmedName) {
            setCreateFolderError("Folder name is required.");
            return;
        }
        if (trimmedName.includes("/")) {
            setCreateFolderError("Folder name cannot contain '/'.");
            return;
        }
        setCreatingFolder(true);
        try {
            const sanitized = trimmedName.replace(/(^[\\.]+)|[^a-zA-Z0-9-_]/g, "_");
            if (!sanitized) {
                setCreateFolderError("Folder name must include letters, numbers, dashes or underscores.");
                setCreatingFolder(false);
                return;
            }
            const folderPath = currentPath ? `${currentPath}/${sanitized}` : sanitized;
            const placeholderRef = storageRef(storage, `${folderPath}/${FOLDER_PLACEHOLDER}`);
            await uploadBytes(placeholderRef, new Uint8Array());
            setCreateFolderOpen(false);
            setNewFolderName("");
            setCreateFolderError(null);
            refreshItems();
        } catch (err: unknown) {
            console.error("Failed to create folder", err);
            const errorMessage = err instanceof Error ? err.message : "Failed to create folder";
            setCreateFolderError(errorMessage);
        } finally {
            setCreatingFolder(false);
        }
    };

    const handleDelete = async (item: StorageBrowserItem) => {
        const targetLabel = item.isFolder ? `folder "${item.name}" and all its contents` : `"${item.name}"`;
        if (!window.confirm(`Delete ${targetLabel}? This action cannot be undone.`)) return;
        try {
            setDeletingPath(item.fullPath);
            if (item.isFolder) {
                await deleteFolder(item.fullPath);
            } else {
                await deleteObject(storageRef(storage, item.fullPath));
            }
            refreshItems();
        } catch (err: unknown) {
            console.error("Failed to delete storage item", err);
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            alert("Failed to delete: " + errorMessage);
        } finally {
            setDeletingPath(null);
        }
    };

    const deleteFolder = async (path: string) => {
        const dirRef = storageRef(storage, path);
        const result = await listAll(dirRef);
        await Promise.all([
            ...result.items.map((itemRef) => deleteObject(itemRef)),
            ...result.prefixes.map((prefixRef) => deleteFolder(prefixRef.fullPath))
        ]);
    };

    const handleDownload = async (item: StorageBrowserItem) => {
        try {
            const url = await getDownloadURL(storageRef(storage, item.fullPath));
            window.open(url, "_blank");
        } catch (err: unknown) {
            console.error("Failed to download storage item", err);
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            alert("Failed to download: " + errorMessage);
        }
    };

    const handlePreview = async (item: StorageBrowserItem) => {
        try {
            const url = await getDownloadURL(storageRef(storage, item.fullPath));
            setPreviewUrl(url);
            setPreviewName(item.name);
        } catch (err: unknown) {
            console.error("Failed to preview storage item", err);
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            alert("Failed to preview: " + errorMessage);
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

    const actionsDisabled = Boolean(uploadingFile) || Boolean(deletingPath);

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
                    <Button
                        variant="outlined"
                        onClick={handleOpenCreateFolder}
                    >
                        New folder
                    </Button>
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

            {deletingPath && (
                <Alert color="warning">
                    Deleting {deletingPath}…
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
                                                        disabled={actionsDisabled}
                                                    >
                                                        Download
                                                    </Button>
                                                    {allowPreview(item) &&
                                                        <Button
                                                            size="small"
                                                            variant="text"
                                                            onClick={() => handlePreview(item)}
                                                            disabled={actionsDisabled}
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
                                                    disabled={actionsDisabled}
                                                >
                                                    Select
                                                </Button>
                                            )}
                                            {!hideDelete && (
                                                <Button
                                                    size="small"
                                                    variant="text"
                                                    color="error"
                                                    onClick={() => handleDelete(item)}
                                                    disabled={actionsDisabled}
                                                >
                                                    Delete
                                                </Button>
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
                open={createFolderOpen}
            >
                <DialogTitle>Create folder</DialogTitle>
                <DialogContent className="flex flex-col gap-3 pt-4">
                    <TextField
                        label="Folder name"
                        value={newFolderName}
                        onChange={(event) => {
                            setNewFolderName(event.target.value);
                            if (createFolderError) setCreateFolderError(null);
                        }}
                        placeholder="assets"
                        disabled={creatingFolder}
                    />
                    {createFolderError && <Alert color="error">{createFolderError}</Alert>}
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="text"
                        onClick={() => setCreateFolderOpen(false)}
                        disabled={creatingFolder}
                    >
                        Cancel
                    </Button>
                    <Button
                        color="primary"
                        onClick={handleCreateFolder}
                        disabled={creatingFolder}
                    >
                        {creatingFolder ? "Creating..." : "Create"}
                    </Button>
                </DialogActions>
            </Dialog>

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
