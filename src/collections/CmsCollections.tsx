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
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "../localization";

export type CmsCollectionPermissions = {
    read?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
};

export type CmsStorageConfig = {
    storagePath?: string;
    acceptedFiles?: string[];
    maxSize?: number;
};

export type CmsArrayPropertyConfig = {
    dataType?: string;
    enumValues?: Record<string, string>;
    path?: string;
    storage?: CmsStorageConfig;
};

export type CmsPropertyConfig = {
    key?: string;
    name?: string;
    description?: string;
    dataType?: string;
    required?: boolean;
    enumValues?: Record<string, string>;
    path?: string;
    of?: CmsArrayPropertyConfig;
    storage?: CmsStorageConfig;
    defaultValue?: string;
    localized?: boolean;
};

export type CmsCollectionLocalization = {
    name?: string;
    description?: string;
    group?: string;
};

export type CmsCollectionConfig = {
    id?: string;
    name?: string;
    description?: string;
    path?: string;
    group?: string;
    icon?: string;
    permissions?: CmsCollectionPermissions;
    properties?: CmsPropertyConfig[];
    localizations?: Record<string, CmsCollectionLocalization>;
};

export const DEFAULT_CMS_COLLECTION_PERMISSIONS = {
    read: true,
    create: true,
    edit: true,
    delete: false
} as const;

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const normalizePermissions = (permissions?: CmsCollectionPermissions) => ({
    read: permissions?.read ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.read,
    create: permissions?.create ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.create,
    edit: permissions?.edit ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.edit,
    delete: permissions?.delete ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.delete
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

    if (dataType === "string" && config.storage?.storagePath) {
        base.storage = {
            storagePath: config.storage.storagePath,
            acceptedFiles: config.storage.acceptedFiles,
            maxSize: config.storage.maxSize
        };
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

    if (config.localized && config.dataType === "string") {
        return {
            dataType: "map",
            properties: SUPPORTED_LOCALES.reduce((acc, locale) => {
                acc[locale.code] = {
                    name: locale.label,
                    dataType: "string"
                };
                return acc;
            }, {} as Record<string, any>)
        };
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
            if (config.storage?.storagePath) {
                base.storage = {
                    storagePath: config.storage.storagePath,
                    acceptedFiles: config.storage.acceptedFiles,
                    maxSize: config.storage.maxSize
                };
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

    if (isNonEmptyString(config.defaultValue)) {
        base.defaultValue = config.defaultValue.trim();
    }

    return base;
};

const snapshotToEntityCollection = (snapshot: QueryDocumentSnapshot<DocumentData>, locale?: string): EntityCollection | undefined => {
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

    const activeLocale = locale || DEFAULT_LOCALE;
    const localization = data.localizations?.[activeLocale];

    const getLocalizedValue = (base?: string, localized?: string) => {
        const localizedTrimmed = localized?.trim();
        if (localizedTrimmed) return localizedTrimmed;
        return base?.trim();
    };

    return {
        id: data.id.trim(),
        path: data.path.trim(),
        name: getLocalizedValue(data.name, localization?.name) ?? "",
        description: getLocalizedValue(data.description, localization?.description),
        group: getLocalizedValue(data.group, localization?.group),
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

export const useCmsCollections = (firebaseApp: FirebaseApp | undefined | null, locale?: string): CmsCollectionsResult => {
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
                .map(doc => snapshotToEntityCollection(doc, locale))
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
    }, [firebaseApp, locale]);

    return useMemo(() => ({
        collections,
        loading,
        error
    }), [collections, error, loading]);
};
