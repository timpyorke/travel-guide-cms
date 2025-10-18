import React from "react";
import { FirebaseApp } from "firebase/app";
import { EntityCollection } from "@firecms/core";
import { useCmsCollections } from "../hooks/useCmsCollections";
import { ErrorBoundary, AsyncBoundary } from "../ui";
import { ERROR_MESSAGE_FAILED_LOAD_CMS_COLLECTIONS } from "../constants";

export interface CmsCollectionsViewProps {
    firebaseApp: FirebaseApp | undefined | null;
    locale?: string;
    onCollectionSelect?: (collection: EntityCollection) => void;
    className?: string;
}

/**
 * View component for CMS Collections - handles presentation only
 */
export const CmsCollectionsView: React.FC<CmsCollectionsViewProps> = ({
    firebaseApp,
    locale,
    onCollectionSelect,
    className = ""
}) => {
    const { collections, loading, error } = useCmsCollections(firebaseApp, locale);

    const handleCollectionClick = (collection: EntityCollection) => {
        if (onCollectionSelect) {
            onCollectionSelect(collection);
        }
    };

    return (
        <ErrorBoundary>
            <AsyncBoundary
                loading={loading}
                error={error ? ERROR_MESSAGE_FAILED_LOAD_CMS_COLLECTIONS : null}
                loadingMessage="Loading collections..."
                className={className}
            >
                <div className="space-y-4">
                    {collections.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="text-gray-500">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 48 48"
                                    aria-hidden="true"
                                >
                                    <path
                                        d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A9.971 9.971 0 0124 24c4.21 0 7.813 2.602 9.288 6.286"
                                        strokeWidth={2}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No collections</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Get started by creating a new collection.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {collections.map((collection) => (
                                <CollectionCard
                                    key={collection.id}
                                    collection={collection}
                                    onClick={() => handleCollectionClick(collection)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </AsyncBoundary>
        </ErrorBoundary>
    );
};

interface CollectionCardProps {
    collection: EntityCollection;
    onClick?: () => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection, onClick }) => {
    const propertyCount = Object.keys(collection.properties || {}).length;

    return (
        <div
            onClick={onClick}
            className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm hover:border-gray-400 hover:shadow-md transition-all cursor-pointer"
        >
            <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                    {collection.icon ? (
                        <span className="text-2xl" role="img" aria-label={collection.name}>
                            {collection.icon}
                        </span>
                    ) : (
                        <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                            <svg
                                className="h-6 w-6 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                            </svg>
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="focus:outline-none">
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {collection.name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                            {collection.path}
                        </p>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{propertyCount} properties</span>
                    {collection.group && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {collection.group}
                        </span>
                    )}
                </div>

                {collection.description && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {collection.description}
                    </p>
                )}
            </div>
        </div>
    );
};