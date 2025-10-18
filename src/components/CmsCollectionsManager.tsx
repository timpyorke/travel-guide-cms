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
import {
    HEADER_CMS_COLLECTIONS,
    DESCRIPTION_MANAGE_COLLECTIONS,
    CMS_COLLECTIONS_PATH,
    BUTTON_TEXT_NEW_COLLECTION,
    ROUTE_CMS_COLLECTIONS_NEW,
    ERROR_MESSAGE_FAILED_LOAD_CMS_COLLECTIONS_DOT,
    DESCRIPTION_NO_COLLECTIONS,
    TABLE_HEADER_NAME,
    TABLE_HEADER_ID,
    TABLE_HEADER_PATH,
    TABLE_HEADER_GROUP,
    TABLE_HEADER_ACTIONS,
    BUTTON_TEXT_EDIT,
    DEFAULT_DASH_PLACEHOLDER,
    ZERO_LENGTH
} from "../constants";

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
                            {HEADER_CMS_COLLECTIONS}
                        </Typography>
                        <Typography variant="body1" color="secondary">
                            {DESCRIPTION_MANAGE_COLLECTIONS} <code>{CMS_COLLECTIONS_PATH}</code> Firestore collection.
                        </Typography>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            component={Link}
                            to={ROUTE_CMS_COLLECTIONS_NEW}
                            color="primary"
                        >
                            {BUTTON_TEXT_NEW_COLLECTION}
                        </Button>
                    </div>
                </div>

                {error && (
                    <Alert color="error">
                        {error.message ?? ERROR_MESSAGE_FAILED_LOAD_CMS_COLLECTIONS_DOT}
                    </Alert>
                )}

                {loading ? (
                    <div className="flex justify-center py-8">
                        <CircularProgress />
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {collections.length === ZERO_LENGTH ? (
                            <Typography variant="body1" color="secondary">
                                {DESCRIPTION_NO_COLLECTIONS}
                            </Typography>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full border border-surface-200 dark:border-surface-700 rounded-md">
                                    <thead className="bg-surface-100 dark:bg-surface-800">
                                        <tr>
                                            <th className="text-left px-4 py-3">{TABLE_HEADER_NAME}</th>
                                            <th className="text-left px-4 py-3">{TABLE_HEADER_ID}</th>
                                            <th className="text-left px-4 py-3">{TABLE_HEADER_PATH}</th>
                                            <th className="text-left px-4 py-3">{TABLE_HEADER_GROUP}</th>
                                            <th className="text-right px-4 py-3">{TABLE_HEADER_ACTIONS}</th>
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
                                                    {collection.group ?? DEFAULT_DASH_PLACEHOLDER}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <Button
                                                        component={Link}
                                                        to={`/cms/collections/${collection.id}/edit`}
                                                        size="small"
                                                        color="neutral"
                                                    >
                                                        {BUTTON_TEXT_EDIT}
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

