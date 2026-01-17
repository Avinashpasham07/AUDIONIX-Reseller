import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const numToWords = (n) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const getLT20 = (n) => a[Number(n)];
    const get20Plus = (n) => b[n[0]] + ' ' + a[n[1]];
    if (n === 0) return '';
    let i = 0;
    let str = '';
    while (n > 0) {
        if (n % 1000 !== 0) {
            let s = '';
            let num = n % 1000;
            if (num >= 100) {
                s += a[Math.floor(num / 100)] + 'Hundred ';
                num %= 100;
            }
            if (num >= 20) s += b[Math.floor(num / 10)] + ' ' + a[num % 10];
            else s += a[num];

            if (i === 1) str = s + 'Thousand ' + str;
            else if (i === 2) str = s + 'Lakh ' + str;
            else if (i === 3) str = s + 'Crore ' + str;
            else str = s + str;
        }
        n = Math.floor(n / 1000);
        i++;
    }
    return str.trim();
};

export const generateInvoicePDF = (order, companySettings) => {
    const doc = new jsPDF();

    // Colors
    const primaryColor = [200, 0, 0]; // Red
    const secondaryColor = [0, 0, 0]; // Black
    const grayColor = [100, 100, 100];

    let yPos = 20;

    // Reset Text
    doc.setTextColor(...secondaryColor); // Black
    doc.setFont('helvetica', 'normal');

    // Issuer Details (Left)
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    const companyName = companySettings.company_name || 'Audionix Enterprises';
    doc.text(companyName, 14, yPos);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...primaryColor); // Red Phone
    doc.text(companySettings.company_phone || '', 14, yPos + 6);

    // Circle Logo (Right)
    doc.setFillColor(...primaryColor); // Red Circle
    doc.circle(180, yPos, 10, 'F');
    doc.setTextColor(255, 255, 255); // White Text inside circle
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(companyName.charAt(0).toUpperCase(), 180, yPos + 2, { align: 'center' });

    yPos += 20;

    // Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(10, yPos, 200, yPos);
    yPos += 10;

    // Bill To (Left)
    doc.setTextColor(...primaryColor); // Red Label
    doc.setFontSize(10);
    doc.text("Bill To:", 14, yPos);

    doc.setTextColor(...grayColor); // Gray Text
    doc.text(order.resellerId?.businessName || order.resellerId?.name || 'Reseller', 14, yPos + 6);
    doc.text(order.resellerId?.mobileNumber || '', 14, yPos + 12);

    // Invoice Details (Right)
    doc.setTextColor(...primaryColor); // Red Label
    doc.text("Ref No:", 150, yPos);
    doc.setTextColor(...secondaryColor); // Black Text
    doc.text(`#${order._id.slice(-6).toUpperCase()}`, 200, yPos, { align: 'right' });

    doc.setTextColor(...primaryColor); // Red Label
    doc.text("Date of Issue:", 150, yPos + 6);
    doc.setTextColor(...secondaryColor); // Black Text
    doc.text(new Date(order.createdAt).toLocaleDateString('en-GB'), 200, yPos + 6, { align: 'right' });

    yPos += 25;

    // Table
    const tableColumn = ["SR", "Name", "Qty", "Price", "Amount"];
    const tableRows = [];

    order.items.forEach((item, index) => {
        const productData = [
            index + 1,
            (item.product?.title || 'Product') + (item.product?.hsnCode ? `\nHSN/SAC : ${item.product.hsnCode}` : ''),
            item.quantity,
            parseFloat(item.price).toFixed(2),
            (item.quantity * item.price).toFixed(2),
        ];
        tableRows.push(productData);
    });

    // Add Shipping Fee Row
    if (order.shippingFee > 0) {
        tableRows.push([
            '',
            'Shipping Charges',
            '',
            '',
            parseFloat(order.shippingFee).toFixed(2)
        ]);
    }

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: yPos,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 3 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 'auto' },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 30, halign: 'right' },
        },
        showHead: 'firstPage',
    });

    const finalY = (doc.lastAutoTable?.finalY || yPos) + 10;

    // Totals
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...secondaryColor);
    doc.text("Total", 140, finalY);
    doc.text(`${order.totalAmount.toFixed(2)}`, 200, finalY, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.text("Total", 140, finalY + 6);
    doc.text(`${order.totalAmount.toFixed(2)}`, 200, finalY + 6, { align: 'right' });

    // Amount in Words
    doc.setFontSize(10);
    doc.setTextColor(...secondaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text("Amount in Words:", 14, finalY + 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const amountInWords = numToWords(Math.floor(order.totalAmount)) + " Rupees Only";
    doc.text(amountInWords, 14, finalY + 26);

    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(10);
    doc.setTextColor(...grayColor);
    doc.text("Thanks for doing business with us!", 14, pageHeight - 10);

    return doc;
};
