import React, { useRef } from 'react';
import { FaPrint, FaDownload, FaBox } from 'react-icons/fa';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const ShippingLabel = ({ order, orderDetails, onClose }) => {
    const labelRef = useRef();

    // Determine data source (Order Object vs Raw Checkout Data)
    const data = order || {};
    const address = order?.shippingAddress || orderDetails?.address || {};
    const items = order?.items || orderDetails?.items || [];
    const orderId = order?._id || `PREVIEW-${Date.now().toString().slice(-6)}`;
    const paymentMode = order?.customerPaymentMode || orderDetails?.customerPaymentMode || 'cod';
    const totalAmount = order ? (order.totalAmount + (order.resellerMargin || 0)) : (orderDetails?.totalAmount || 0);

    const handlePrint = () => {
        const printContent = labelRef.current.innerHTML;
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Shipping Label</title>');
        printWindow.document.write('</head><body >');
        printWindow.document.write(printContent);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    };

    const handleDownload = async () => {
        if (!labelRef.current) return;
        try {
            const canvas = await html2canvas(labelRef.current, {
                scale: 2, // Higher resolution
                useCORS: true,
                backgroundColor: '#ffffff' // Ensure white background
            });
            const link = document.createElement('a');
            link.download = `shipping-label-${orderId}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success("Label Downloaded! 📥");
        } catch (error) {
            console.error("Download failed:", error);
            toast.error("Failed to download label image");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex justify-center items-center p-4 backdrop-blur-sm">
            <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-800 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white m-0">Shipping Label Preview</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition text-2xl leading-none">&times;</button>
                </div>

                {/* THE LABEL TO PRINT - Must remain white for thermal printers */}
                <div className="overflow-auto bg-zinc-800/50 p-4 rounded-xl mb-6">
                    <div ref={labelRef} className="bg-white text-black p-5 border-2 border-black font-sans mx-auto max-w-[400px]">

                        {/* Header */}
                        <div className="flex justify-between items-center border-b-2 border-black pb-2 mb-4">
                            <div className="font-bold text-lg">STANDARD DELIVERY</div>
                            <div className="text-4xl font-bold">E</div>
                        </div>

                        {/* From/To Grid */}
                        <div className="grid grid-cols-1 gap-6 mb-6">
                            {/* Ship To */}
                            <div>
                                <div className="text-xs text-gray-600 uppercase mb-1">Ship To:</div>
                                {address?.name ? (
                                    <>
                                        <div className="font-bold text-lg leading-tight">{address.name}</div>
                                        <div className="leading-tight">{address.address || address.addressLine}</div>
                                        <div className="leading-tight">{address.city}, {address.state}</div>
                                        <div className="font-bold mt-1">PIN: {address.pincode}</div>
                                        <div className="text-sm mt-1">Ph: {address.phone}</div>
                                    </>
                                ) : (
                                    <div className="text-red-500 font-bold italic">Missing Shipping Address Data</div>
                                )}
                            </div>

                            {/* Sold By */}
                            <div>
                                {(() => {
                                    const method = order?.shippingMethod || orderDetails?.shippingMethod;

                                    if (method === 'audionix') {
                                        return (
                                            <>
                                                <div className="text-xs text-gray-600 uppercase mb-1">Shipped By (Audionix):</div>
                                                <div className="font-bold">Audionix Central Warehouse</div>
                                                <div className="text-sm">Plot No. 45, Industrial Area</div>
                                                <div className="text-sm">New Delhi, India - 110020</div>
                                                <div className="text-sm">support@audionix.com</div>
                                            </>
                                        );
                                    }

                                    const reseller = order?.resellerId || orderDetails?.reseller || {};
                                    return (
                                        <>
                                            <div className="text-xs text-gray-600 uppercase mb-1">Sold By (Reseller):</div>
                                            <div className="font-bold">{reseller.businessDetails?.businessName || reseller.name || 'Authorized Reseller'}</div>
                                            {reseller.businessDetails?.address && (
                                                <div className="text-sm">{reseller.businessDetails.address}</div>
                                            )}
                                            <div className="text-sm">{reseller.email}</div>
                                            <div className="text-sm">Ph: {reseller.mobileNumber || 'N/A'}</div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="border-t-2 border-black pt-4 mb-4">
                            <div className="flex justify-between font-bold text-sm mb-2">
                                <span>Order #{orderId.slice(-8).toUpperCase()}</span>
                                <span>{new Date().toLocaleDateString()}</span>
                            </div>
                            <div className="text-sm mb-2 break-words">
                                {items.length > 0 ? (items[0].product?.title || items[0].title || 'Product').substring(0, 30) : 'Item'}
                                {items.length > 1 && ` + ${items.length - 1} others`}
                            </div>
                            <div className="text-sm font-bold">
                                Type: {paymentMode === 'cod' ? 'COD - Collect Payment' : 'Prepaid'}
                            </div>
                            {paymentMode === 'cod' && (
                                <div className="mt-4 text-xl font-bold text-center border-2 dashed border-black p-2 border-dashed">
                                    COD Amount: ₹{totalAmount}
                                </div>
                            )}
                        </div>

                        {/* Barcode Mock */}
                        <div className="text-center mt-6">
                            <div className="h-12 w-4/5 mx-auto bg-[repeating-linear-gradient(90deg,black,black_2px,white_2px,white_4px)]"></div>
                            <div className="text-xs tracking-[0.3em] mt-1">{orderId}</div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 justify-end">
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 bg-zinc-800 text-white border border-zinc-700 rounded-lg hover:bg-zinc-700 transition flex items-center gap-2 font-bold text-sm"
                    >
                        <FaPrint /> Print PDF
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-white text-black rounded-lg hover:bg-zinc-200 transition flex items-center gap-2 font-bold text-sm"
                    >
                        <FaDownload /> Download Image
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShippingLabel;
