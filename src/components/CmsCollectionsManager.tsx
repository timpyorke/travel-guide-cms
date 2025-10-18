import React from "react";
import { FirebaseApp } from "firebase/app";
import { Link } from "react-router-dom";
import {
    Alert,
    Button,
    CircularProgress,
    Paper,
    Typography
} from "@firecms/ui";
import { useCmsCollections } from "../collections/CmsCollections";

export type CmsCollectionsManagerProps = {
    firebaseApp: FirebaseApp;
};

export const CmsCollectionsManager: React.FC<CmsCollectionsManagerProps> = ({ firebaseApp }) => {

    const {
        collections,
        loading,
        error
    } = useCmsCollections(firebaseApp);

    return (
        <div className="w-full flex justify-center px-4 py-8">
            <Paper className="w-full max-w-4xl p-6 md:p-8 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex flex-col gap-2">
                        <Typography variant="h5">
                            CMS Collections
                        </Typography>
                        <Typography variant="body1" color="secondary">
                            Manage the dynamic collections stored in the <code>cms_collections</code> Firestore collection.
                        </Typography>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            component={Link}
                            to={"/cms/collections/new"}
                            color="primary"
                        >
                            New collection
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert color="error">
                        {error.message ?? "Failed to load CMS collections."}
                    </Alert>
                )}

                {loading ? (
                    <div className="flex justify-center py-8">
                        <CircularProgress />
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {collections.length === 0 ? (
                            <Typography variant="body1" color="secondary">
                                No dynamic collections found yet. Create your first one to get started.
                            </Typography>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-surface-200 dark:border-surface-700 rounded-md">
                                    <thead className="bg-surface-100 dark:bg-surface-800">
                                        <tr>
                                            <th className="text-left px-4 py-3">Name</th>
                                            <th className="text-left px-4 py-3">ID</th>
                                            <th className="text-left px-4 py-3">Path</th>
                                            <th className="text-left px-4 py-3">Group</th>
                                            <th className="text-right px-4 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {collections.map((collection) => (
                                            <tr
                                                key={collection.id}
                                                className="border-t border-surface-200 dark:border-surface-700"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{collection.name}</span>
                                                        {collection.description && (
                                                            <span className="text-sm text-text-secondary dark:text-text-secondary-dark">
                                                                {collection.description}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-sm">
                                                    {collection.id}
                                                </td>
                                                <td className="px-4 py-3 font-mono text-sm">
                                                    {collection.path}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {collection.group ?? "—"}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        component={Link}
                                                        to={`/cms/collections/${collection.id}/edit`}
                                                        size="small"
                                                        color="neutral"
                                                    >
                                                        Edit
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </Paper>
        </div>
    );
};

