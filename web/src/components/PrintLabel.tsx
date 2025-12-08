import { FaxDetail, Allocation } from '@/types/schema';

interface PrintLabelProps {
    detail: FaxDetail;
    allocation: Allocation;
}

export default function PrintLabel({ detail, allocation }: PrintLabelProps) {
    return (
        <div id="print-area" style={{
            width: '100mm',
            height: '60mm',
            border: '1px solid black',
            padding: '5mm',
            fontFamily: 'sans-serif',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
        }}>
            {/* Header: Product & Grade */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid black', paddingBottom: '2mm' }}>
                <span style={{ fontSize: '14px' }}>{detail.productName}</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {detail.grade ? `Grade: ${detail.grade}` : ''}
                    {detail.class ? ` / Class: ${detail.class}` : ''}
                </span>
            </div>

            {/* Main: Customer Name (Huge) */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', margin: 0, textAlign: 'center' }}>
                    {allocation.customerName}
                </h1>
            </div>

            {/* Footer: Quantity & Barcode */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', borderTop: '1px solid black', paddingTop: '2mm' }}>
                <div>
                    <span style={{ fontSize: '12px' }}>Qty:</span>
                    <span style={{ fontSize: '24px', fontWeight: 'bold', marginLeft: '5px' }}>{detail.quantity}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {/* Dummy Barcode */}
                    <div style={{ height: '10mm', width: '40mm', background: 'repeating-linear-gradient(90deg, black, black 1px, white 1px, white 3px)' }}></div>
                    <span style={{ fontSize: '10px' }}>{allocation.id?.substring(0, 8)}</span>
                </div>
            </div>
        </div>
    );
}
