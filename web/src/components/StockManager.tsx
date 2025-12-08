'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { FaxDetail } from '@/types/schema';
import AllocationForm from './AllocationForm';

// Register all community modules to prevent missing module errors (like #239)
ModuleRegistry.registerModules([AllCommunityModule]);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function StockManager() {
    // Fetch FaxDetails (unallocated)
    const { data: details, error, isLoading } = useSWR<FaxDetail[]>('/api/supplies', fetcher, { refreshInterval: 1000 });
    const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

    const columnDefs: ColDef<FaxDetail>[] = [
        { field: 'productName', headerName: 'Product', flex: 2 },
        {
            headerName: 'Grade/Class',
            valueGetter: (params) => `${params.data?.grade || '-'} / ${params.data?.class || '-'}`,
            flex: 1
        },
        { field: 'quantity', headerName: 'Qty', flex: 1 },
        { field: 'remarks', headerName: 'Remarks', flex: 1, cellStyle: { color: 'red' } },
        { field: 'id', headerName: 'ID', hide: true },
    ];

    if (error) return <div>Failed to load details</div>;
    if (isLoading) return <div>Loading...</div>;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="ag-theme-alpine" style={{ height: '400px', width: '100%' }}>
                <AgGridReact
                    theme="legacy"
                    rowData={details}
                    columnDefs={columnDefs}
                    rowSelection="single"
                    onRowClicked={(event) => setSelectedDetailId(event.data?.id || null)}
                    animateRows={true}
                />
            </div>
            <AllocationForm selectedDetailId={selectedDetailId} details={details} />
        </div>
    );
}
