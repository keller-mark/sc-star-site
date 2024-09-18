// 1. Import utilities from `astro:content`
import { z, defineCollection, reference } from 'astro:content';

// 2. Define your collection(s)
const sourceCollection = defineCollection({
    type: 'content',
    schema: z.object({
        path: z.string(),
        guid: z.string(),
        name: z.string(),
    })
});

const codeCollection = defineCollection({
    type: 'content',
    schema: z.object({
        guid: z.string(),
        name: z.string(),
        isCodable: z.enum(["true", "false"]),
    }).transform((obj) => {
        return {
            ...obj,
            isCodable: obj.isCodable === "true",
        };
    }),
});

const quoteCollection = defineCollection({
    type: 'content',
    schema: z.object({
        source_guid: reference('sources'),
        attrs: z.object({
            guid: z.string(),
            page: z.string(),
        }),
        Coding: z.array(z.object({
            attrs: z.object({
                guid: z.string(),
            }),
            CodeRef: z.object({
                attrs: z.object({
                    targetGUID: reference('codes'),
                }),
            }),
        })),
    }),
});

const codeSetCollection = defineCollection({
    type: 'content',
    schema: z.object({
        attrs: z.object({
            guid: z.string(),
            name: z.string(),
        }),
        MemberCode: z.array(z.object({
            attrs: z.object({
                targetGUID: reference('codes'),
            }),
        }))
    }),
});


// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"
export const collections = {
  'codes': codeCollection,
  'quotations': quoteCollection,
  'sources': sourceCollection,
  'sets': codeSetCollection,
};