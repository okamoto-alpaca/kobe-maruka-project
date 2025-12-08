import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';
import { FaxDocument, FaxDetail } from '@/types/schema';
import { Timestamp } from 'firebase-admin/firestore';

// --- Configuration ---
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";

// --- Zod Schema ---
const FirstString = z.union([
    z.string(),
    z.number().transform(String),
    z.array(z.union([z.string(), z.number().transform(String)]))
]).transform((val) => {
    if (Array.isArray(val)) return val[0] || "";
    return val;
});

const CoerceNumber = z.union([
    z.string(),
    z.number(),
    z.array(z.union([z.string(), z.number()]))
]).transform((val) => {
    let v: string | number;
    if (Array.isArray(val)) {
        v = val[0];
    } else {
        v = val;
    }
    const parsed = Number(v);
    if (isNaN(parsed)) {
        return 0; // Default to 0 instead of error for robustness
    }
    return parsed;
});

const ItemSchema = z.object({
    grade: FirstString.optional(),
    class: FirstString.optional(),
    quantity: CoerceNumber,
    remarks: FirstString.optional(), // Added remarks
});

const DetailSchema = z.object({
    name: FirstString.optional(),
    packaging: FirstString.optional(), // Can be mapped to remarks or ignored
    items: z.array(ItemSchema).optional(),
});

const OcrResultSchema = z.object({
    send_dt: FirstString.optional(),
    origin: FirstString.optional(),
    details: z.array(DetailSchema).optional(),
});

type OcrResult = z.infer<typeof OcrResultSchema>;

export async function POST(req: NextRequest) {
    // --- Phase 1: Ingest (Zero Loss Protocol) ---
    const docId = uuidv4();
    const now = Timestamp.now();

    // Create the document record IMMEDIATELY
    const faxDoc: FaxDocument = {
        id: docId,
        storagePath: `fax/${new Date().toISOString().split('T')[0]}/${docId}.jpg`, // Mock path
        status: 'received',
        uploadTimestamp: now,
        shippingDate: new Date().toISOString().split('T')[0],
        originName: null,
        originCode: null,
        slipNumber: null,
        reporter: null,
        transporter: null,
        assigneeId: null,
        assigneeName: null,
        originId: null
    };

    try {
        await db.collection('fax_documents').doc(docId).set(faxDoc);
        console.log(`[Phase 1] FaxDocument created: ${docId}`);
    } catch (e: any) {
        console.error("Failed to create FaxDocument:", e);
        return NextResponse.json({ error: "Database Error (Phase 1)" }, { status: 500 });
    }

    try {
        if (!API_KEY) throw new Error("GEMINI_API_KEY missing");

        const body = await req.json();
        const { imageBase64 } = body;

        if (!imageBase64) throw new Error("Missing imageBase64");

        // --- Upload to Storage ---
        const bucket = admin.storage().bucket('kobe-maruka-alpaca.appspot.com');
        const buffer = Buffer.from(imageBase64, 'base64');
        const storagePath = `fax/${new Date().toISOString().split('T')[0]}/${docId}.jpg`;

        await bucket.file(storagePath).save(buffer, {
            metadata: { contentType: 'image/jpeg' },
            public: true
        });
        console.log(`[Phase 1.5] Uploaded image to ${storagePath}`);

        // Update status to analyzing AND update storagePath (just in case)
        await db.collection('fax_documents').doc(docId).update({
            status: 'analyzing',
            storagePath: storagePath
        });

        // --- Phase 2 & 3: OCR Analysis ---
        let responseText: string;

        // MOCK MODE CHECK
        if (imageBase64 === "TEST_IMAGE_DATA") {
            console.log("--- MOCK MODE ---");
            responseText = JSON.stringify({
                send_dt: "2023/11/24",
                origin: "Mock JA",
                details: [
                    {
                        name: "Mock Product",
                        items: [
                            { grade: "A", class: "L", quantity: 100, remarks: "Mock Remark" }
                        ]
                    }
                ]
            });
        } else {
            const genAI = new GoogleGenerativeAI(API_KEY);
            const model = genAI.getGenerativeModel({
                model: MODEL_NAME,
                generationConfig: { responseMimeType: "application/json", temperature: 0 }
            });

            const prompt = `
            あなたは帳票データ化の専門家です。
            添付画像を分析し、以下のJSON形式で出力してください。
            
            **重要: 等級と階級の分離**
            - "秀L" や "A 2L" のように書かれている場合、必ず "grade": "秀", "class": "L" のように分離してください。
            - 備考欄（"水濡れ"、"20穴"など）があれば必ず "remarks" に含めてください。

            **出力JSON形式:**
            {
              "send_dt": "YYYY/MM/DD",
              "origin": "出荷元名",
              "details": [
                {
                  "name": "品名",
                  "items": [
                    { "grade": "等級", "class": "階級", "quantity": 数値, "remarks": "備考" }
                  ]
                }
              ]
            }
            `;

            const result = await model.generateContent([
                prompt,
                { inlineData: { data: imageBase64, mimeType: "image/jpeg" } }
            ]);
            responseText = result.response.text();
        }

        // Parse & Validate
        const parsedJson = JSON.parse(responseText);
        const validation = OcrResultSchema.safeParse(parsedJson);

        if (!validation.success) {
            throw new Error("Validation Failed: " + JSON.stringify(validation.error.format()));
        }

        const data = validation.data;

        // --- Save Results ---
        const batch = db.batch();

        // 1. Update FaxDocument (Header)
        const docRef = db.collection('fax_documents').doc(docId);
        batch.update(docRef, {
            status: 'completed',
            shippingDate: data.send_dt || null,
            originName: data.origin || null,
        });

        // 2. Create FaxDetails (Lines)
        const details: FaxDetail[] = [];
        if (data.details) {
            for (const detail of data.details) {
                if (!detail.items) continue;
                for (const item of detail.items) {
                    const detailId = uuidv4();
                    const d: FaxDetail = {
                        id: detailId,
                        parentId: docId,
                        productName: detail.name || "Unknown",
                        grade: item.grade || null,
                        class: item.class || null,
                        quantity: item.quantity,
                        remarks: item.remarks || null,
                        unitPrice: null,
                        isAllocated: false,
                        allocationStatus: 'none',
                        createdAt: Timestamp.now(),
                        assigneeId: null
                    };
                    details.push(d);
                    batch.set(db.collection('fax_details').doc(detailId), d);
                }
            }
        }

        await batch.commit();
        console.log(`[Phase 3] Saved ${details.length} details.`);

        return NextResponse.json({
            status: "success",
            documentId: docId,
            detailsCount: details.length
        });

    } catch (error: any) {
        console.error("Ingest Error:", error);
        // Error Fallback: Update document status to error
        await db.collection('fax_documents').doc(docId).update({
            status: 'error',
            errorMessage: error.message
        });
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
