import React, { useCallback, useMemo } from "react";

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
    SnackbarProvider,
    useBuildLocalConfigurationPersistence,
    useBuildModeController,
    useBuildNavigationController,
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
import { CenteredView, Button } from "@firecms/ui";
import { useCmsCollections } from "./collections/cmsColecctions";

import { firebaseConfig } from "./firebase_config";
import { CreateCollectionForm } from "./components/CreateCollectionForm";
import { Link, Route } from "react-router-dom";

function App() {

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

    const {
        collections: cmsCollections,
        loading: cmsCollectionsLoading,
        error: cmsCollectionsError
    } = useCmsCollections(firebaseApp);

    const collections = useMemo(() => [
        ...cmsCollections
    ], [cmsCollections]);

    const navigationController = useBuildNavigationController({
        disabled: authLoading || cmsCollectionsLoading,
        collections,
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

    return (
        <SnackbarProvider>
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
                                    <Button
                                        size="small"
                                        color="primary"
                                        component={Link}
                                        to={"/collections/new"}
                                    >
                                        New collection
                                    </Button>
                                }
                            />
                            <Drawer />
                            <NavigationRoutes>
                                <Route
                                    path={"/collections/new"}
                                    element={<CreateCollectionForm firebaseApp={firebaseApp} />}
                                />
                            </NavigationRoutes>
                            <SideDialogs />
                        </Scaffold>;
                    }}
                </FireCMS>
            </ModeControllerProvider>
        </SnackbarProvider>
    );

}

export default App;
