import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from 'uuid';
import { Supply, SupplyStatus } from '../types/schema';
import { Timestamp } from 'firebase-admin/firestore';

dotenv.config();

// --- Configuration ---
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL_NAME || "gemini-1.5-flash";

if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
    console.error("\x1b[31m[FATAL] GEMINI_API_KEY is not set in .env\x1b[0m");
    process.exit(1);
}

// --- Zod Schema ---
// Helper: Accepts string, number, or array of them. Returns the first value as string.
const FirstString = z.union([
    z.string(),
    z.number().transform(String),
    z.array(z.union([z.string(), z.number().transform(String)]))
]).transform((val) => {
    if (Array.isArray(val)) return val[0] || "";
    return val;
});

// Helper: Accepts string, number, or array. Returns number.
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
        // Fallback or throw? User said "throw new Error" but also "don't crash".
        // Let's return 0 if invalid to be safe, or throw if strictness is required.
        // User said: "throw new Error('Quantity is not a valid number')" in the example.
        // But also "Null handling... don't crash".
        // I will throw here, and catch it in the validation step.
        throw new Error(`Quantity is not a valid number: ${v}`);
    }
    return parsed;
});

const ItemSchema = z.object({
    grade: FirstString.optional(),
    class: FirstString.optional(),
    quantity: CoerceNumber, // Strict number coercion
});

const DetailSchema = z.object({
    name: FirstString.optional(),
    packaging: FirstString.optional(),
    items: z.array(ItemSchema).optional(),
});

const OcrResultSchema = z.object({
    send_dt: FirstString.optional(),
    origin: FirstString.optional(),
    details: z.array(DetailSchema).optional(),
});

type OcrResult = z.infer<typeof OcrResultSchema>;

// --- Helper: Flatten to Supply[] ---
function flattenToSupplies(ocrResult: OcrResult): Supply[] {
    const supplies: Supply[] = [];
    const now = Timestamp.now();

    if (!ocrResult.details) return [];

    for (const detail of ocrResult.details) {
        if (!detail.items) continue;
        for (const item of detail.items) {
            supplies.push({
                id: uuidv4(),
                faxId: "dummy-fax-id", // Placeholder
                status: SupplyStatus.PENDING,
                productName: detail.name || "Unknown Product",
                initialQuantity: item.quantity,
                currentQuantity: item.quantity,
                createdAt: now,
            });
        }
    }
    return supplies;
}

// --- Gemini Setup ---
console.log(`Using Model: ${MODEL_NAME}`);
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
        responseMimeType: "application/json",
        temperature: 0,
    }
});

async function main() {
    const imagePath = process.argv[2];

    if (!imagePath) {
        console.log("No image path provided. Usage: npx ts-node scripts/test_gemini.ts <path_to_image>");
        console.log("Running in MOCK mode with text description for testing...");
    }

    try {
        console.log("--- Starting Gemini OCR Extraction ---");

        let promptParts: any[] = [
            "あなたは帳票データ化の専門家です。",
            "添付された画像を、各項目の指示と思考ステップに従って分析し、最終的に全ての情報を統合して一つのJSONとして出力してください。",
            "**出力ルール:**",
            "共通情報はトップレベルに、明細は `details` 配列の中に、等級・階級ごとの数量を `items` 配列内の個別のオブジェクトとして格納してください。",
            "**期待する出力JSON形式 (あくまで構造の例です。この値をそのまま出力しないでください):**",
            `{
              "send_dt": ["YYYY/MM/DD"],
              "origin": ["JA名など"],
              "details": [
                {
                  "name": ["品名"],
                  "packaging": ["荷姿"],
                  "items": [
                    { "grade": ["等級"], "class": ["階級"], "quantity": ["数量"] }
                  ]
                }
              ]
            }`,
            "**思考ステップ:**",
            "1. **画像分析:** 画像が空白、真っ黒、あるいは判読不能な場合は、直ちに `null` を返してください。例示されたデータを返してはいけません。",
            "2. **共通情報の特定:** 帳票全体で共通する「出荷年月日」を探し、日付をYYYY/MM/DD形式で特定する。また、「出荷元」を探し、右上のJA名を2つ見つけて結合する。",
            "3. **明細行の特定:** 品目が書かれている行を特定し、そこから「品名」と「荷姿」を読み取る。",
            "4. **数量マトリクスの分解:** 明細行の表から「0以外の数値セル」を探す。",
            "5. **属性の紐付け:** 見つけた数値セルの列を上に辿ってヘッダーから「等級」と「階級」を特定し、その交差する数値を「数量」とする。",
            "6. **完了:** すべての情報を統合してJSONのみを返す。"
        ];

        if (imagePath && fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            const imageBase64 = imageBuffer.toString('base64');
            promptParts.push({
                inlineData: {
                    data: imageBase64,
                    mimeType: "image/jpeg"
                }
            });
            console.log(`Processing image: ${imagePath}`);
        } else {
            console.log("Using text description of a fax...");
            promptParts.push("Input: A fax image showing 'Product: Sanukihime', 'Quantity: 50', 'Grade: A'.");
        }

        const result = await model.generateContent(promptParts);
        const responseText = result.response.text();

        console.log("\n[Raw AI Response]:");
        console.log(responseText);

        // --- Null/Empty Handling ---
        if (!responseText || responseText.trim() === "null" || responseText.trim() === "```json\nnull\n```") {
            console.warn("\x1b[33m[WARN] Unreadable FAX (AI returned null or empty)\x1b[0m");
            return; // Graceful exit
        }

        // --- Validation ---
        console.log("\n--- Validating with Zod ---");
        let parsedJson;
        try {
            parsedJson = JSON.parse(responseText);
        } catch (e) {
            // If JSON parse fails, treat as unreadable
            console.warn("\x1b[33m[WARN] Unreadable FAX (Invalid JSON)\x1b[0m");
            return;
        }

        // Check if parsedJson is null (JSON.parse('null') returns null)
        if (parsedJson === null) {
            console.warn("\x1b[33m[WARN] Unreadable FAX (JSON is null)\x1b[0m");
            return;
        }

        const validationResult = OcrResultSchema.safeParse(parsedJson);

        if (validationResult.success) {
            console.log("\x1b[32m[SUCCESS] Validation Passed\x1b[0m");

            // --- Flattening ---
            console.log("\n--- Flattening to Supply[] ---");
            const supplies = flattenToSupplies(validationResult.data);
            console.log(JSON.stringify(supplies, null, 2));

        } else {
            console.error("\x1b[31m[ERROR] Validation Failed\x1b[0m");
            console.error(validationResult.error.format());
            // We exit with 1 here because if AI returned data but it's invalid, that's a schema mismatch, not just "unreadable".
            process.exit(1);
        }

    } catch (error) {
        console.error("\x1b[31m[FATAL] Error during execution\x1b[0m", error);
        process.exit(1);
    }
}

main();
