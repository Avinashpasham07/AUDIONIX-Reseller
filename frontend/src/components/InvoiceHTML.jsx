import React from 'react';
import { FaDownload, FaTimes, FaFileInvoice } from 'react-icons/fa';

const InvoiceHTML = ({ order, companySettings, onDownload, onClose }) => {
    if (!order) return null;

    const companyName = companySettings.company_name || 'Audionix Enterprises';
    const primaryColor = '#C80000'; // Audionix Red

    const formatDate = (date) => new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="relative max-w-[850px] mx-auto group animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Invoice Container (The "Paper") */}
            <div className="bg-white text-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-zinc-100 flex flex-col min-h-[1000px] font-sans selection:bg-red-50">

                {/* Visual Header Accent */}
                <div className="h-2 w-full bg-red-600"></div>

                <div className="p-12 md:p-16 flex-1 relative">
                    {/* Brand & Type Header */}
                    <div className="flex justify-between items-start mb-16">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-black flex items-center justify-center rounded-xl rotate-3 shadow-lg group-hover:rotate-0 transition-transform duration-500">
                                    <span className="text-white text-2xl font-black">{companyName.charAt(0)}</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-black tracking-tight leading-none m-0">{companyName}</h1>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em] mt-2">Certified Distributor</p>
                                </div>
                            </div>
                            <div className="text-sm font-medium text-zinc-500 max-w-[200px] leading-relaxed italic">
                                {companySettings.company_address || 'Central Distribution Hub, Phase 3, Industrial Estate, New Delhi.'}
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="inline-block bg-zinc-900 text-white px-4 py-1 rounded-md text-[10px] font-black uppercase tracking-widest mb-4">
                                Tax Invoice
                            </div>
                            <div className="space-y-1">
                                <p className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">Invoice Number</p>
                                <p className="text-xl font-black text-black leading-none">#INV-{order._id.slice(-8).toUpperCase()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 mb-16 border-y border-zinc-100 py-10">
                        {/* Billing Details */}
                        <div className="col-span-2 md:col-span-1">
                            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest mb-4">Invoiced To:</p>
                            <h2 className="text-xl font-black text-zinc-900 mb-2">{order.resellerId?.businessName || order.resellerId?.name || 'Authorized Reseller'}</h2>
                            <div className="text-sm text-zinc-500 space-y-1 font-medium leading-relaxed">
                                <p>{order.resellerId?.email}</p>
                                <p className="text-zinc-900 font-bold">+91 {order.resellerId?.mobileNumber || order.resellerId?.phone}</p>
                                <p className="pt-2">{order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
                                <p>{order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                            </div>
                        </div>

                        {/* Order Meta Data */}
                        <div className="flex flex-col items-end justify-center">
                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Issue Date</p>
                                    <p className="text-sm font-black text-zinc-900">{formatDate(order.createdAt)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Due Date</p>
                                    <p className="text-sm font-black text-zinc-900">COD / Immediate</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Method</p>
                                    <p className="text-sm font-black text-red-600 uppercase italic">
                                        {order.customerPaymentMode === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-sm font-black text-zinc-900 uppercase italic">Verified</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="mb-12 overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b-2 border-black text-black">
                                    <th className="py-4 text-left text-[10px] font-black uppercase tracking-widest w-12">SR</th>
                                    <th className="py-4 text-left text-[10px] font-black uppercase tracking-widest">Inventory Detail</th>
                                    <th className="py-4 text-center text-[10px] font-black uppercase tracking-widest w-20">Qty</th>
                                    <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest w-32">Rate</th>
                                    <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest w-32">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-zinc-100">
                                {order.items.map((item, index) => (
                                    <tr key={index} className="group/row transition-colors hover:bg-zinc-50/50">
                                        <td className="py-6 text-zinc-400 font-bold align-top">{(index + 1).toString().padStart(2, '0')}</td>
                                        <td className="py-6 pr-4 align-top">
                                            <p className="text-zinc-950 font-black mb-1">{item.product?.title || 'Unknown SKU'}</p>
                                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-tight">HSN: {item.product?.hsnCode || '8518'}</p>
                                        </td>
                                        <td className="py-6 text-center text-zinc-500 font-bold align-top">{item.quantity}</td>
                                        <td className="py-6 text-right text-zinc-500 font-bold align-top">₹{parseFloat(item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="py-6 text-right text-zinc-950 font-black align-top">₹{(item.quantity * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                ))}
                                {order.shippingFee > 0 && (
                                    <tr className="bg-zinc-50/50">
                                        <td className="py-4"></td>
                                        <td className="py-4 text-zinc-500 font-bold text-xs uppercase italic">Logistics & Handling Fee</td>
                                        <td className="py-4"></td>
                                        <td className="py-4 text-right"></td>
                                        <td className="py-4 text-right text-zinc-950 font-black">₹{parseFloat(order.shippingFee).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Bottom Summary Section */}
                    <div className="flex justify-end pt-10 mt-10">


                        <div className="w-[320px]">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400 font-bold uppercase tracking-widest">Subtotal</span>
                                    <span className="text-zinc-950 font-black italic">₹{(order.totalAmount - (order.shippingFee || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-400 font-bold uppercase tracking-widest">Shipping</span>
                                    <span className="text-zinc-950 font-black italic">₹{(order.shippingFee || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="pt-6 border-t font-black text-2xl flex justify-between items-center text-black">
                                    <span className="uppercase tracking-tighter scale-y-110 italic">Total</span>
                                    <span className="text-red-600">₹{order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Authentication Section */}

                </div>

                {/* Aesthetic Footer Bar */}
                <div className="mt-auto bg-black text-white p-6 flex justify-between items-center">
                    <div className="text-[9px] font-black tracking-widest uppercase opacity-60">
                        &copy; {new Date().getFullYear()} Audionix Central Hub. All Rights Reserved.
                    </div>
                    <div className="flex gap-6 items-center flex-wrap justify-end">
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-60">info@audionix.com</span>
                        <div className="h-4 w-[1px] bg-white/20"></div>
                        <span className="text-[9px] font-black uppercase tracking-widest bg-red-600 px-2 py-1 rounded">24/7 Priority Support</span>
                    </div>
                </div>
            </div>

            <style jsx>{`
                @media print {
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default InvoiceHTML;
