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
import { StorageBrowser } from "./components/storage/StorageBrowser";
import { Link, Route, useParams } from "react-router-dom";
import { useSnackbarController } from "@firecms/core";
import { SnackbarProvider as NotistackSnackbarProvider } from "notistack";

const LOCALE_STORAGE_KEY = "cms_active_locale";

const CustomSnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <NotistackSnackbarProvider
        maxSnack={3}
        autoHideDuration={3500}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        classes={{
            containerAnchorOriginTopRight: "notistack-anchor-top-right"
        }}
    >
        {children}
    </NotistackSnackbarProvider>
);

function AppContent() {

    // Use your own authentication logic here
    const myAuthenticator: Authenticator<FirebaseUserWrapper> = useCallback(async ({
        user,
        authController
    }) => {

        if (user?.email?.includes("flanders")) {
            // You can throw an error to prevent access
            throw Error("Stupid Flanders!");
        }

        const idTokenResult = await user?.firebaseUser?.getIdTokenResult();
        const userIsAdmin = idTokenResult?.claims.admin || user?.email?.endsWith("@firecms.co");

        console.log("Allowing access to", user);

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

    const signInOptions: FirebaseSignInProvider[] = ["google.com", "password"];

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
            path: "storage",
            name: "Storage",
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
                    context,
                    loading
                }) => {
                    const customizationController = useCustomizationController();
                    if (customizationController) {
                        customizationController.locale = activeLocale as any;
                    }

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
                            title={"Travel Guide CMS"}
                            endAdornment={
                                <div className="flex gap-2">
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        component={Link}
                                        to={"/cms/collections"}
                                    >
                                        Manage collections
                                    </Button>
                                    <Button
                                        size="small"
                                        color="primary"
                                        component={Link}
                                        to={"/cms/collections/new"}
                                    >
                                        New collection
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
                            <Route path={"/cms/collections"}
                                element={<CmsCollectionsManager firebaseApp={firebaseApp} />} />
                            <Route
                                path={"/cms/collections/new"}
                                element={<CmsCollectionForm firebaseApp={firebaseApp} />}
                            />
                            <Route
                                path={"/cms/collections/:collectionId/edit"}
                                element={<CmsCollectionEditView />}
                            />
                            <Route
                                path={"/storage"}
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
                message: error.message ?? "Failed to load CMS collections",
                autoHideDuration: 4500
            });
        }
    }, [error, snackbar]);
    return null;
};

const StorageBrowserPage: React.FC<{ firebaseApp: FirebaseApp }> = ({ firebaseApp }) => {
    return (
        <div className="p-4 flex flex-col gap-4">
            <Typography variant="h4">Storage</Typography>
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
