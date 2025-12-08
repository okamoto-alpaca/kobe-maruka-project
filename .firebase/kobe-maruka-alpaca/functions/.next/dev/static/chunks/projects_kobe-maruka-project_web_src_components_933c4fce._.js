(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AllocationForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/projects/kobe-maruka-project/web/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/projects/kobe-maruka-project/web/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$swr$2f$dist$2f$_internal$2f$config$2d$context$2d$12s$2d$Dh3trQsc$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__j__as__mutate$3e$__ = __turbopack_context__.i("[project]/projects/kobe-maruka-project/web/node_modules/swr/dist/_internal/config-context-12s-Dh3trQsc.mjs [app-client] (ecmascript) <export j as mutate>");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function AllocationForm({ selectedSupplyId }) {
    _s();
    const [customerName, setCustomerName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [quantity, setQuantity] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isSubmitting, setIsSubmitting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [message, setMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const handleSubmit = async (e)=>{
        e.preventDefault();
        if (!selectedSupplyId) return;
        setIsSubmitting(true);
        setMessage('');
        try {
            const res = await fetch('/api/allocate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    supplyId: selectedSupplyId,
                    customerName,
                    quantity: Number(quantity)
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Allocation failed');
            }
            setMessage('Allocation successful!');
            setCustomerName('');
            setQuantity('');
            // Optimistic update or revalidation
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$swr$2f$dist$2f$_internal$2f$config$2d$context$2d$12s$2d$Dh3trQsc$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__j__as__mutate$3e$__["mutate"])('/api/supplies');
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        } finally{
            setIsSubmitting(false);
        }
    };
    if (!selectedSupplyId) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                padding: '20px',
                border: '1px solid #ccc'
            },
            children: "Select a supply from the grid to allocate."
        }, void 0, false, {
            fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
            lineNumber: 55,
            columnNumber: 16
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: '20px',
            border: '1px solid #ccc',
            marginTop: '20px'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: "Allocation Form"
            }, void 0, false, {
                fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                lineNumber: 60,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                onSubmit: handleSubmit,
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: "Supply ID: "
                            }, void 0, false, {
                                fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                                lineNumber: 63,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: selectedSupplyId
                            }, void 0, false, {
                                fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                                lineNumber: 64,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                        lineNumber: 62,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: "Customer Name: "
                            }, void 0, false, {
                                fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                                lineNumber: 67,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "text",
                                value: customerName,
                                onChange: (e)=>setCustomerName(e.target.value),
                                required: true,
                                style: {
                                    border: '1px solid black',
                                    padding: '4px'
                                }
                            }, void 0, false, {
                                fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                                lineNumber: 68,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                        lineNumber: 66,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                children: "Quantity: "
                            }, void 0, false, {
                                fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                                lineNumber: 77,
                                columnNumber: 21
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                value: quantity,
                                onChange: (e)=>setQuantity(e.target.value),
                                required: true,
                                min: "1",
                                style: {
                                    border: '1px solid black',
                                    padding: '4px'
                                }
                            }, void 0, false, {
                                fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                                lineNumber: 78,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                        lineNumber: 76,
                        columnNumber: 17
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "submit",
                        disabled: isSubmitting,
                        style: {
                            border: '1px solid black',
                            padding: '8px',
                            background: '#eee',
                            cursor: 'pointer'
                        },
                        children: isSubmitting ? 'Allocating...' : 'Confirm Allocation'
                    }, void 0, false, {
                        fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                        lineNumber: 87,
                        columnNumber: 17
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                lineNumber: 61,
                columnNumber: 13
            }, this),
            message && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                style: {
                    marginTop: '10px',
                    fontWeight: 'bold'
                },
                children: message
            }, void 0, false, {
                fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
                lineNumber: 95,
                columnNumber: 25
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx",
        lineNumber: 59,
        columnNumber: 9
    }, this);
}
_s(AllocationForm, "Iz1x6UhVpUg4hjNY294StLxeGXI=");
_c = AllocationForm;
var _c;
__turbopack_context__.k.register(_c, "AllocationForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/projects/kobe-maruka-project/web/src/components/StockManager.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StockManager
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/projects/kobe-maruka-project/web/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/projects/kobe-maruka-project/web/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$swr$2f$dist$2f$index$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/projects/kobe-maruka-project/web/node_modules/swr/dist/index/index.mjs [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$ag$2d$grid$2d$react$2f$dist$2f$package$2f$index$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/projects/kobe-maruka-project/web/node_modules/ag-grid-react/dist/package/index.esm.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$ag$2d$grid$2d$community$2f$dist$2f$package$2f$main$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/projects/kobe-maruka-project/web/node_modules/ag-grid-community/dist/package/main.esm.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$src$2f$components$2f$AllocationForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/projects/kobe-maruka-project/web/src/components/AllocationForm.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
// Register AG Grid modules
__TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$ag$2d$grid$2d$community$2f$dist$2f$package$2f$main$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ModuleRegistry"].registerModules([
    __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$ag$2d$grid$2d$community$2f$dist$2f$package$2f$main$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ClientSideRowModelModule"]
]);
const fetcher = (url)=>fetch(url).then((res)=>res.json());
function StockManager() {
    _s();
    const { data: supplies, error, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$swr$2f$dist$2f$index$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"])('/api/supplies', fetcher, {
        refreshInterval: 1000
    });
    const [selectedSupplyId, setSelectedSupplyId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const columnDefs = [
        {
            field: 'productName',
            headerName: 'Product Name',
            flex: 1
        },
        {
            field: 'currentQuantity',
            headerName: 'Current Qty',
            flex: 1
        },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1
        },
        {
            field: 'id',
            headerName: 'ID',
            hide: true
        }
    ];
    if (error) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Failed to load supplies"
    }, void 0, false, {
        fileName: "[project]/projects/kobe-maruka-project/web/src/components/StockManager.tsx",
        lineNumber: 29,
        columnNumber: 23
    }, this);
    if (isLoading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: "Loading..."
    }, void 0, false, {
        fileName: "[project]/projects/kobe-maruka-project/web/src/components/StockManager.tsx",
        lineNumber: 30,
        columnNumber: 27
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "ag-theme-alpine",
                style: {
                    height: '400px',
                    width: '100%'
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$ag$2d$grid$2d$react$2f$dist$2f$package$2f$index$2e$esm$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AgGridReact"], {
                    rowData: supplies,
                    columnDefs: columnDefs,
                    rowSelection: "single",
                    onRowClicked: (event)=>setSelectedSupplyId(event.data?.id || null),
                    animateRows: true
                }, void 0, false, {
                    fileName: "[project]/projects/kobe-maruka-project/web/src/components/StockManager.tsx",
                    lineNumber: 35,
                    columnNumber: 17
                }, this)
            }, void 0, false, {
                fileName: "[project]/projects/kobe-maruka-project/web/src/components/StockManager.tsx",
                lineNumber: 34,
                columnNumber: 13
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$src$2f$components$2f$AllocationForm$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                selectedSupplyId: selectedSupplyId,
                supplies: supplies
            }, void 0, false, {
                fileName: "[project]/projects/kobe-maruka-project/web/src/components/StockManager.tsx",
                lineNumber: 43,
                columnNumber: 13
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/projects/kobe-maruka-project/web/src/components/StockManager.tsx",
        lineNumber: 33,
        columnNumber: 9
    }, this);
}
_s(StockManager, "gzttnP3klwSNvggrCBnR6H7nuqI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$projects$2f$kobe$2d$maruka$2d$project$2f$web$2f$node_modules$2f$swr$2f$dist$2f$index$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"]
    ];
});
_c = StockManager;
var _c;
__turbopack_context__.k.register(_c, "StockManager");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=projects_kobe-maruka-project_web_src_components_933c4fce._.js.map