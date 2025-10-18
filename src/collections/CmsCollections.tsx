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
import {
    CMS_COLLECTIONS_PATH,
    DATE_TIME_DATA_TYPE,
    STRING_DATA_TYPE,
    DATE_DATA_TYPE,
    REFERENCE_DATA_TYPE,
    ARRAY_DATA_TYPE,
    MAP_DATA_TYPE,
    VALIDATION_REQUIRED,
    MODE_DATE,
    MODE_DATE_TIME,
    AUTO_VALUE_ON_CREATE,
    AUTO_VALUE_ON_UPDATE,
    AUTO_VALUE_ON_CREATE_UPDATE,
    PROPERTY_EXPANDED,
    PROPERTY_MULTILINE,
    PROPERTY_MARKDOWN,
    PROPERTY_REQUIRED,
    EMPTY_STRING,
    ZERO_LENGTH,
    ERROR_MESSAGE_CMS_COLLECTIONS,
    DEFAULT_CMS_COLLECTION_PERMISSIONS
} from "../constants";
import type {
    PropertyDefinition,
    CmsCollectionData,
    PropertyArrayConfig,
    StringProperty,
    ErrorWithMessage,
    DynamicProperty
} from "../types";

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
    multiline?: boolean;
    markdown?: boolean;
    autoValue?: "on_create" | "on_update" | "on_create_update";
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



const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > ZERO_LENGTH;

const normalizePermissions = (permissions?: CmsCollectionPermissions) => ({
    read: permissions?.read ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.read,
    create: permissions?.create ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.create,
    edit: permissions?.edit ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.edit,
    delete: permissions?.delete ?? DEFAULT_CMS_COLLECTION_PERMISSIONS.delete
});

const buildArrayProperty = (config?: CmsArrayPropertyConfig): PropertyArrayConfig | undefined => {
    if (!config?.dataType) return undefined;

    const dataType = config.dataType;
    const base: PropertyArrayConfig = {
        dataType: dataType === DATE_TIME_DATA_TYPE ? DATE_DATA_TYPE : dataType
    };

    if (dataType === DATE_TIME_DATA_TYPE) {
        base.mode = MODE_DATE_TIME;
    }

    if (dataType === STRING_DATA_TYPE && config.enumValues && Object.keys(config.enumValues).length > ZERO_LENGTH) {
        base.enumValues = config.enumValues;
    }

    if (dataType === REFERENCE_DATA_TYPE && isNonEmptyString(config.path)) {
        base.path = config.path.trim();
    }

    if (dataType === STRING_DATA_TYPE && config.storage?.storagePath) {
        base.storage = {
            storagePath: config.storage.storagePath,
            acceptedFiles: config.storage.acceptedFiles,
            maxSize: config.storage.maxSize
        };
    }

    return base;
};

const buildProperty = (config?: CmsPropertyConfig): DynamicProperty | undefined => {
    if (!config?.key || !config?.dataType) return undefined;

    const base: DynamicProperty = {
        dataType: config.dataType === DATE_TIME_DATA_TYPE ? DATE_DATA_TYPE : config.dataType
    };

    if (isNonEmptyString(config.name)) {
        base.name = config.name.trim();
    }

    if (isNonEmptyString(config.description)) {
        base.description = config.description.trim();
    }

    if (config.required) {
        base.validation = { required: PROPERTY_REQUIRED };
    }

    const applyStringOptions = (target: DynamicProperty) => {
        if (config.enumValues && Object.keys(config.enumValues).length > ZERO_LENGTH) {
            target.enumValues = config.enumValues;
        }
        if (config.storage?.storagePath) {
            target.storage = {
                storagePath: config.storage.storagePath,
                acceptedFiles: config.storage.acceptedFiles,
                maxSize: config.storage.maxSize
            };
        }
        if (config.multiline) {
            target.multiline = PROPERTY_MULTILINE;
        }
        if (config.markdown) {
            target.markdown = PROPERTY_MARKDOWN;
        }
    };

    if (config.localized && config.dataType === STRING_DATA_TYPE) {
        return {
            dataType: MAP_DATA_TYPE,
            expanded: PROPERTY_EXPANDED,
            properties: SUPPORTED_LOCALES.reduce((acc, locale) => {
                const child: DynamicProperty = {
                    name: locale.label,
                    dataType: STRING_DATA_TYPE
                };
                applyStringOptions(child);
                acc[locale.code] = child;
                return acc;
            }, {} as Record<string, DynamicProperty>)
        };
    }

    switch (config.dataType) {
        case DATE_DATA_TYPE:
            base.mode = MODE_DATE;
            if (config.autoValue) base.autoValue = config.autoValue;
            break;
        case DATE_TIME_DATA_TYPE:
            base.mode = MODE_DATE_TIME;
            break;
        case STRING_DATA_TYPE:
            applyStringOptions(base);
            break;
        case REFERENCE_DATA_TYPE:
            if (!isNonEmptyString(config.path)) {
                return undefined;
            }
            base.path = config.path.trim();
            break;
        case ARRAY_DATA_TYPE: {
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

export const snapshotToEntityCollection = (snapshot: QueryDocumentSnapshot<DocumentData>, locale?: string): EntityCollection | undefined => {
    const data = snapshot.data() as CmsCollectionConfig;

    if (!isNonEmptyString(data.id) || !isNonEmptyString(data.path) || !isNonEmptyString(data.name)) {
        return undefined;
    }

    const propertiesArray = Array.isArray(data.properties) ? data.properties : [];
    const properties = propertiesArray.reduce<Record<string, DynamicProperty>>((acc, propertyConfig) => {
        const property = buildProperty(propertyConfig);
        if (property && propertyConfig?.key) {
            acc[propertyConfig.key.trim()] = property;
        }
        return acc;
    }, {});

    if (Object.keys(properties).length === ZERO_LENGTH) {
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
        name: getLocalizedValue(data.name, localization?.name) ?? EMPTY_STRING,
        description: getLocalizedValue(data.description, localization?.description),
        group: getLocalizedValue(data.group, localization?.group),
        icon: data.icon,
        permissions,
        properties: properties as any
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
        const cmsCollectionsRef = collection(firestore, CMS_COLLECTIONS_PATH);

        const unsubscribe = onSnapshot(cmsCollectionsRef, (snapshot) => {
            const parsedCollections = snapshot.docs
                .map(doc => snapshotToEntityCollection(doc, locale))
                .filter((collection): collection is EntityCollection => !!collection);

            setCollections(parsedCollections);
            setError(undefined);
            setLoading(false);
        }, (err) => {
            console.error(ERROR_MESSAGE_CMS_COLLECTIONS, err);
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
