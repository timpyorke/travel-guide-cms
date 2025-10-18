import { useState, useEffect, useCallback, useMemo } from "react";
import { FirebaseApp } from "firebase/app";
import { EntityCollection } from "@firecms/core";
import { QueryDocumentSnapshot, DocumentData } from "firebase/firestore";
import { createCmsCollectionService } from "../services/cmsCollectionService";
import { snapshotToEntityCollection } from "../collections/CmsCollections";
import { DEFAULT_LOCALE } from "../localization";

export interface UseCmsCollectionsResult {
    collections: EntityCollection[];
    loading: boolean;
    error?: Error;
    refetch: () => void;
}

/**
 * Custom hook for managing CMS collections
 */
export const useCmsCollections = (
    firebaseApp: FirebaseApp | undefined | null,
    locale?: string
): UseCmsCollectionsResult => {
    const [collections, setCollections] = useState<EntityCollection[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | undefined>();

    // Create service instance
    const cmsService = useMemo(() => {
        return firebaseApp ? createCmsCollectionService(firebaseApp) : null;
    }, [firebaseApp]);

    const processSnapshots = useCallback((snapshots: QueryDocumentSnapshot<DocumentData>[]) => {
        const parsedCollections = snapshots
            .map(doc => snapshotToEntityCollection(doc, locale || DEFAULT_LOCALE))
            .filter((collection): collection is EntityCollection => !!collection);

        setCollections(parsedCollections);
        setError(undefined);
        setLoading(false);
    }, [locale]);

    const handleError = useCallback((err: Error) => {
        setCollections([]);
        setError(err);
        setLoading(false);
    }, []);

    const refetch = useCallback(() => {
        if (!cmsService) return;
        setLoading(true);
        // The subscription will trigger processSnapshots automatically
    }, [cmsService]);

    useEffect(() => {
        if (!cmsService) {
            setCollections([]);
            setLoading(false);
            setError(undefined);
            return;
        }

        setLoading(true);
        const unsubscribe = cmsService.subscribeToCollections(
            processSnapshots,
            handleError
        );

        return () => unsubscribe();
    }, [cmsService, processSnapshots, handleError]);

    return useMemo(() => ({
        collections,
        loading,
        error,
        refetch
    }), [collections, error, loading, refetch]);
};