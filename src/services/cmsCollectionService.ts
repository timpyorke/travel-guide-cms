import { FirebaseApp } from "firebase/app";
import {
    collection,
    doc,
    getDoc,
    getFirestore,
    onSnapshot,
    setDoc,
    QueryDocumentSnapshot,
    DocumentData,
    Unsubscribe
} from "firebase/firestore";
import { CMS_COLLECTIONS_PATH } from "../constants";
import type { CmsCollectionConfig } from "../types";

export class CmsCollectionService {
    private firestore;

    constructor(private firebaseApp: FirebaseApp) {
        this.firestore = getFirestore(firebaseApp);
    }

    /**
     * Subscribe to CMS collections changes
     */
    subscribeToCollections(
        onUpdate: (collections: QueryDocumentSnapshot<DocumentData>[]) => void,
        onError: (error: Error) => void
    ): Unsubscribe {
        const cmsCollectionsRef = collection(this.firestore, CMS_COLLECTIONS_PATH);

        return onSnapshot(
            cmsCollectionsRef,
            (snapshot) => {
                onUpdate(snapshot.docs);
            },
            (error) => {
                console.error("Error loading CMS collections", error);
                onError(error);
            }
        );
    }

    /**
     * Get a single CMS collection by ID
     */
    async getCollection(collectionId: string): Promise<CmsCollectionConfig | null> {
        try {
            const docRef = doc(this.firestore, CMS_COLLECTIONS_PATH, collectionId);
            const docSnapshot = await getDoc(docRef);

            if (!docSnapshot.exists()) {
                return null;
            }

            return {
                ...docSnapshot.data(),
                id: docSnapshot.data().id ?? collectionId
            } as CmsCollectionConfig;
        } catch (error) {
            console.error("Error fetching collection:", error);
            throw error;
        }
    }

    /**
     * Save or update a CMS collection
     */
    async saveCollection(collectionId: string, data: CmsCollectionConfig): Promise<void> {
        try {
            const docRef = doc(this.firestore, CMS_COLLECTIONS_PATH, collectionId);
            await setDoc(docRef, data);
        } catch (error) {
            console.error("Error saving collection:", error);
            throw error;
        }
    }
}

// Factory function to create service instance
export const createCmsCollectionService = (firebaseApp: FirebaseApp): CmsCollectionService => {
    return new CmsCollectionService(firebaseApp);
};