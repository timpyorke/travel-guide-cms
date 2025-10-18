import { useEffect, useMemo, useState } from "react";
import { FirebaseApp } from "firebase/app";
import {
    collection,
    DocumentData,
    getFirestore,
    onSnapshot,
    QueryDocumentSnapshot
} from "firebase/firestore";
import { EntityCollection } from "@firecms/core";

type CmsCollectionPermissions = {
    read?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
};

type CmsArrayPropertyConfig = {
    dataType?: string;
    enumValues?: Record<string, string>;
    path?: string;
};

type CmsPropertyConfig = {
    key?: string;
    name?: string;
    description?: string;
    dataType?: string;
    required?: boolean;
    enumValues?: Record<string, string>;
    path?: string;
    of?: CmsArrayPropertyConfig;
};

type CmsCollectionConfig = {
    id?: string;
    name?: string;
    singularName?: string;
    description?: string;
    path?: string;
    group?: string;
    icon?: string;
    permissions?: CmsCollectionPermissions;
    properties?: CmsPropertyConfig[];
};

const DEFAULT_PERMISSIONS = {
    read: true,
    create: true,
    edit: true,
    delete: false
} as const;

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const normalizePermissions = (permissions?: CmsCollectionPermissions) => ({
    read: permissions?.read ?? DEFAULT_PERMISSIONS.read,
    create: permissions?.create ?? DEFAULT_PERMISSIONS.create,
    edit: permissions?.edit ?? DEFAULT_PERMISSIONS.edit,
    delete: permissions?.delete ?? DEFAULT_PERMISSIONS.delete
});

const buildArrayProperty = (config?: CmsArrayPropertyConfig) => {
    if (!config?.dataType) return undefined;

    const dataType = config.dataType;
    const base: Record<string, any> = {
        dataType: dataType === "date_time" ? "date" : dataType
    };

    if (dataType === "date_time") {
        base.mode = "date_time";
    }

    if (dataType === "string" && config.enumValues && Object.keys(config.enumValues).length > 0) {
        base.enumValues = config.enumValues;
    }

    if (dataType === "reference" && isNonEmptyString(config.path)) {
        base.path = config.path.trim();
    }

    return base;
};

const buildProperty = (config?: CmsPropertyConfig) => {
    if (!config?.key || !config?.dataType) return undefined;

    const base: Record<string, any> = {
        dataType: config.dataType === "date_time" ? "date" : config.dataType
    };

    if (isNonEmptyString(config.name)) {
        base.name = config.name.trim();
    }

    if (isNonEmptyString(config.description)) {
        base.description = config.description.trim();
    }

    if (config.required) {
        base.validation = { required: true };
    }

    switch (config.dataType) {
        case "date":
            base.mode = "date";
            break;
        case "date_time":
            base.mode = "date_time";
            break;
        case "string":
            if (config.enumValues && Object.keys(config.enumValues).length > 0) {
                base.enumValues = config.enumValues;
            }
            break;
        case "reference":
            if (!isNonEmptyString(config.path)) {
                return undefined;
            }
            base.path = config.path.trim();
            break;
        case "array": {
            const ofProperty = buildArrayProperty(config.of);
            if (!ofProperty) {
                return undefined;
            }
            base.of = ofProperty;
            break;
        }
        default:
            break;
    }

    return base;
};

const snapshotToEntityCollection = (snapshot: QueryDocumentSnapshot<DocumentData>): EntityCollection | undefined => {
    const data = snapshot.data() as CmsCollectionConfig;

    if (!isNonEmptyString(data.id) || !isNonEmptyString(data.path) || !isNonEmptyString(data.name)) {
        return undefined;
    }

    const propertiesArray = Array.isArray(data.properties) ? data.properties : [];
    const properties = propertiesArray.reduce<Record<string, any>>((acc, propertyConfig) => {
        const property = buildProperty(propertyConfig);
        if (property && propertyConfig?.key) {
            acc[propertyConfig.key.trim()] = property;
        }
        return acc;
    }, {});

    if (Object.keys(properties).length === 0) {
        return undefined;
    }

    const permissions = normalizePermissions(data.permissions);

    return {
        id: data.id.trim(),
        path: data.path.trim(),
        name: data.name.trim(),
        singularName: isNonEmptyString(data.singularName) ? data.singularName.trim() : undefined,
        description: isNonEmptyString(data.description) ? data.description.trim() : undefined,
        group: isNonEmptyString(data.group) ? data.group.trim() : undefined,
        icon: data.icon,
        permissions,
        properties
    };
};

export type CmsCollectionsResult = {
    collections: EntityCollection[];
    loading: boolean;
    error?: Error;
};

export const useCmsCollections = (firebaseApp: FirebaseApp | undefined | null): CmsCollectionsResult => {
    const [collections, setCollections] = useState<EntityCollection[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error>();

    useEffect(() => {
        if (!firebaseApp) {
            setCollections([]);
            setLoading(false);
            setError(undefined);
            return;
        }

        setLoading(true);
        const firestore = getFirestore(firebaseApp);
        const cmsCollectionsRef = collection(firestore, "cms_collections");

        const unsubscribe = onSnapshot(cmsCollectionsRef, (snapshot) => {
            const parsedCollections = snapshot.docs
                .map(snapshotToEntityCollection)
                .filter((collection): collection is EntityCollection => !!collection);

            setCollections(parsedCollections);
            setError(undefined);
            setLoading(false);
        }, (err) => {
            console.error("Error loading CMS collections", err);
            setCollections([]);
            setError(err);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [firebaseApp]);

    return useMemo(() => ({
        collections,
        loading,
        error
    }), [collections, error, loading]);
};

