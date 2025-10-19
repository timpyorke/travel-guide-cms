import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FirebaseApp } from "firebase/app";

import {
    AppBar,
    Authenticator,
    CircularProgressCenter,
    Drawer,
    FireCMS,
    ModeControllerProvider,
    NavigationRoutes,
    Scaffold,
    SideDialogs,
    useBuildLocalConfigurationPersistence,
    useBuildModeController,
    useBuildNavigationController,
    useCustomizationController,
    useValidateAuthenticator
} from "@firecms/core";
import {
    FirebaseAuthController,
    FirebaseLoginView,
    FirebaseSignInProvider,
    FirebaseUserWrapper,
    useFirebaseAuthController,
    useFirebaseStorageSource,
    useFirestoreDelegate,
    useInitialiseFirebase,
} from "@firecms/firebase";
import { CenteredView, Button, Typography } from "@firecms/ui";
import { useCmsCollections } from "./collections/CmsCollections";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from "./localization";

import { firebaseConfig } from "./firebase_config";
import { CmsCollectionForm } from "./components/CmsCollectionForm";
import { CmsCollectionsManager } from "./components/CmsCollectionsManager";
import { StorageBrowser } from "./components/StorageBrowser";
import { Link, Route, useParams } from "react-router-dom";
import { useSnackbarController } from "@firecms/core";
import { SnackbarProvider as NotistackSnackbarProvider } from "notistack";
import {
    LOCALE_STORAGE_KEY,
    APP_TITLE,
    DEFAULT_SNACKBAR_MAX_COUNT,
    DEFAULT_SNACKBAR_AUTO_HIDE_DURATION,
    SNACKBAR_ANCHOR_ORIGIN_VERTICAL,
    SNACKBAR_ANCHOR_ORIGIN_HORIZONTAL,
    SNACKBAR_CSS_CLASS,
    FIREBASE_SIGN_IN_PROVIDERS,
    FLANDERS_EMAIL_FILTER,
    ERROR_MESSAGE_FLANDERS,
    ADMIN_EMAIL_DOMAIN,
    ADMIN_CLAIM,
    CONSOLE_LOG_ALLOWING_ACCESS,
    ROUTE_CMS_COLLECTIONS,
    ROUTE_CMS_COLLECTIONS_NEW,
    ROUTE_CMS_COLLECTIONS_EDIT,
    ROUTE_STORAGE,
    BUTTON_TEXT_MANAGE_COLLECTIONS,
    BUTTON_TEXT_NEW_COLLECTION,
    HEADER_STORAGE,
    DEFAULT_ERROR_SNACKBAR_DURATION,
    ERROR_MESSAGE_FAILED_LOAD_CMS_COLLECTIONS
} from "./constants";
import type { CustomizationController } from "./types";

const CustomSnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <NotistackSnackbarProvider
        maxSnack={DEFAULT_SNACKBAR_MAX_COUNT}
        autoHideDuration={DEFAULT_SNACKBAR_AUTO_HIDE_DURATION}
        anchorOrigin={{ vertical: SNACKBAR_ANCHOR_ORIGIN_VERTICAL, horizontal: SNACKBAR_ANCHOR_ORIGIN_HORIZONTAL }}
        classes={{
            containerAnchorOriginTopRight: SNACKBAR_CSS_CLASS
        }}
    >
        {children}
    </NotistackSnackbarProvider>
);

function AppContent() {

    // Use your own authentication logic here
    const myAuthenticator: Authenticator<FirebaseUserWrapper> = useCallback(async ({
        user,
        authController: _authController
    }) => {

        if (user?.email?.includes(FLANDERS_EMAIL_FILTER)) {
            // You can throw an error to prevent access
            throw Error(ERROR_MESSAGE_FLANDERS);
        }

        const idTokenResult = await user?.firebaseUser?.getIdTokenResult();
        const _userIsAdmin = idTokenResult?.claims[ADMIN_CLAIM] || user?.email?.endsWith(ADMIN_EMAIL_DOMAIN);

        console.log(CONSOLE_LOG_ALLOWING_ACCESS, user);

        // we allow access to every user in this case
        return true;
    }, []);

    const {
        firebaseApp,
        firebaseConfigLoading,
        configError
    } = useInitialiseFirebase({
        firebaseConfig
    });

    // Controller used to manage the dark or light color mode
    const modeController = useBuildModeController();

    const signInOptions: FirebaseSignInProvider[] = [...FIREBASE_SIGN_IN_PROVIDERS];

    // Controller for managing authentication
    const authController: FirebaseAuthController = useFirebaseAuthController({
        firebaseApp,
        signInOptions
    });

    // Controller for saving some user preferences locally.
    const userConfigPersistence = useBuildLocalConfigurationPersistence();

    // Delegate used for fetching and saving data in Firestore
    const firestoreDelegate = useFirestoreDelegate({
        firebaseApp
    });

    // Controller used for saving and fetching files in storage
    const storageSource = useFirebaseStorageSource({
        firebaseApp
    });


    const {
        authLoading,
        canAccessMainView,
        notAllowedError
    } = useValidateAuthenticator({
        authController,
        authenticator: myAuthenticator,
        dataSourceDelegate: firestoreDelegate,
        storageSource
    });

    const [activeLocale, setActiveLocale] = useState<string>(() => {
        if (typeof window !== "undefined") {
            return localStorage.getItem(LOCALE_STORAGE_KEY) || DEFAULT_LOCALE;
        }
        return DEFAULT_LOCALE;
    });

    useEffect(() => {
        if (typeof window !== "undefined") {
            localStorage.setItem(LOCALE_STORAGE_KEY, activeLocale);
        }
    }, [activeLocale]);

    const {
        collections: cmsCollections,
        loading: cmsCollectionsLoading,
        error: cmsCollectionsError
    } = useCmsCollections(firebaseApp, activeLocale);

    const storageViews = useMemo(() => {
        if (!firebaseApp) return [];
        return [{
            path: ROUTE_STORAGE.substring(1), // Remove leading slash
            name: HEADER_STORAGE,
            icon: "image",
            view: <StorageBrowserPage firebaseApp={firebaseApp} />
        }];
    }, [firebaseApp]);

    const collections = useMemo(() => [
        ...cmsCollections,
    ], [cmsCollections]);

    const navigationController = useBuildNavigationController({
        disabled: authLoading || cmsCollectionsLoading,
        collections,
        views: storageViews,
        authController,
        dataSourceDelegate: firestoreDelegate
    });

    const customizationController = useCustomizationController() as CustomizationController | null;

    useEffect(() => {
        if (customizationController) {
            customizationController.locale = activeLocale;
        }
    }, [customizationController, activeLocale]);

    if (firebaseConfigLoading || !firebaseApp) {
        return <>
            <CircularProgressCenter />
        </>;
    }

    if (configError) {
        return <CenteredView>{configError}</CenteredView>;
    }

    const CmsCollectionEditView = () => {
        const { collectionId } = useParams<{ collectionId: string }>();
        return <CmsCollectionForm
            firebaseApp={firebaseApp}
            collectionId={collectionId ?? undefined}
        />;
    };

    return (
        <ModeControllerProvider value={modeController}>
            <FireCMS
                navigationController={navigationController}
                authController={authController}
                userConfigPersistence={userConfigPersistence}
                dataSourceDelegate={firestoreDelegate}
                storageSource={storageSource}
            >
                {({
                    context: _context,
                    loading
                }) => {

                    if (loading || authLoading || cmsCollectionsLoading) {
                        return <CircularProgressCenter size={"large"} />;
                    }

                    if (!canAccessMainView) {
                        return <FirebaseLoginView authController={authController}
                            firebaseApp={firebaseApp}
                            signInOptions={signInOptions}
                            notAllowedError={notAllowedError} />;
                    }

                    return <Scaffold
                        autoOpenDrawer={false}>
                        <AppBar
                            title={APP_TITLE}
                            endAdornment={
                                <div className="flex gap-2">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        component={Link}
                                        to={ROUTE_CMS_COLLECTIONS}
                                    >
                                        {BUTTON_TEXT_MANAGE_COLLECTIONS}
                                    </Button>
                                    <Button
                                        size="small"
                                        color="primary"
                                        component={Link}
                                        to={ROUTE_CMS_COLLECTIONS_NEW}
                                    >
                                        {BUTTON_TEXT_NEW_COLLECTION}
                                    </Button>
                                    <select
                                        className="border border-surface-300 dark:border-surface-700 rounded-md px-2 py-1 text-sm bg-white dark:bg-surface-900"
                                        value={activeLocale}
                                        onChange={(event) => setActiveLocale(event.target.value)}
                                    >
                                        {SUPPORTED_LOCALES.map((locale) => (
                                            <option key={locale.code} value={locale.code}>{locale.label}</option>
                                        ))}
                                    </select>
                                </div>
                            }
                        />
                        <Drawer />
                        <NavigationRoutes>
                            <Route path={ROUTE_CMS_COLLECTIONS}
                                element={<CmsCollectionsManager firebaseApp={firebaseApp} />} />
                            <Route
                                path={ROUTE_CMS_COLLECTIONS_NEW}
                                element={<CmsCollectionForm firebaseApp={firebaseApp} />}
                            />
                            <Route
                                path={ROUTE_CMS_COLLECTIONS_EDIT}
                                element={<CmsCollectionEditView />}
                            />
                            <Route
                                path={ROUTE_STORAGE}
                                element={<StorageBrowserPage firebaseApp={firebaseApp} />}
                            />
                        </NavigationRoutes>
                        <SideDialogs />
                        <CmsCollectionsErrorToast error={cmsCollectionsError} />
                    </Scaffold>;
                }}
            </FireCMS>
        </ModeControllerProvider>
    );

}

const CmsCollectionsErrorToast: React.FC<{ error?: Error }> = ({ error }) => {
    const snackbar = useSnackbarController();
    useEffect(() => {
        if (error) {
            snackbar.open({
                type: "error",
                message: error.message ?? ERROR_MESSAGE_FAILED_LOAD_CMS_COLLECTIONS,
                autoHideDuration: DEFAULT_ERROR_SNACKBAR_DURATION
            });
        }
    }, [error, snackbar]);
    return null;
};

const StorageBrowserPage: React.FC<{ firebaseApp: FirebaseApp }> = ({ firebaseApp }) => {
    return (
        <div className="p-4 flex flex-col gap-4">
            <Typography variant="h4">{HEADER_STORAGE}</Typography>
            <StorageBrowser firebaseApp={firebaseApp} />
        </div>
    );
};


function App() {
    return (
        <CustomSnackbarProvider>
            <AppContent />
        </CustomSnackbarProvider>
    );
}

export default App;
