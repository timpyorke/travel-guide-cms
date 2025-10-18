import { buildCollection, buildProperty } from "@firecms/core";

export type Banner = {
    url: string;
};

export const bannersCollection = buildCollection<Banner>({
    name: "Banners",
    singularName: "Banner",
    path: "banners",
    id: "banners",
    icon: "Slideshow",
    group: "Content",
    properties: {
        url: {
            name: "Destination URL",
            dataType: "string",
            url: true
        },

    }
});
