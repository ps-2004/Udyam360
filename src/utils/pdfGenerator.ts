import jsPDF from 'jspdf';
import { Quote, BusinessProfile } from '../types';

export function generateQuotePDF(quote: Quote, profile: BusinessProfile) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Airtel Brand Header
  doc.setFillColor(228, 0, 0); // #E40000 Airtel Red
  doc.rect(0, 0, 210, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('airtel business', 16, 14);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Udyam360 Quotation & Service Proposal', 110, 14);

  // Document Metadata
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.text(`Quote Reference: ${quote.id}`, 16, 34);
  doc.text(`Date of Issue: ${new Date(quote.created_at).toLocaleDateString('en-IN')}`, 16, 40);
  doc.text(`Validity: 30 Days`, 16, 46);

  doc.text(`Customer Name: ${profile.business_name}`, 120, 34);
  doc.text(`City: ${profile.city} (${profile.city_tier})`, 120, 40);
  doc.text(`GSTIN: ${profile.gstin_number || '29AABCU9603R1ZM'}`, 120, 46);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(16, 52, 194, 52);

  // Bundle Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(228, 0, 0);
  doc.text(quote.bundle_name, 16, 62);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tailored business solution engineered for micro, small, and medium enterprises.', 16, 68);

  // Item Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(16, 75, 178, 8, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Solution Component', 20, 80);
  doc.text('Category', 105, 80);
  doc.text('Monthly (INR)', 140, 80);
  doc.text('Setup (INR)', 170, 80);

  // Items
  let y = 88;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  quote.items.forEach((item, index) => {
    doc.text(`${index + 1}. ${item.product_name}`, 20, y);
    doc.text(item.category || 'Enterprise', 105, y);
    doc.text(`INR ${item.monthly_price.toLocaleString('en-IN')}`, 140, y);
    doc.text(`INR ${item.setup_fee.toLocaleString('en-IN')}`, 170, y);
    y += 8;
  });

  // Pricing Totals
  y += 6;
  doc.setDrawColor(226, 232, 240);
  doc.line(16, y, 194, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Monthly Recurring Charges (MRC):', 100, y);
  doc.text(`INR ${quote.monthly_recurring_charges.toLocaleString('en-IN')}`, 168, y);
  y += 7;

  doc.text('One-Time Setup Charges (OTC):', 100, y);
  doc.text(`INR ${quote.one_time_setup_fees.toLocaleString('en-IN')}`, 168, y);
  y += 7;

  doc.setTextColor(228, 0, 0);
  doc.text('Total Monthly Commitment:', 100, y);
  doc.text(`INR ${quote.monthly_recurring_charges.toLocaleString('en-IN')}`, 168, y);
  y += 7;

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contract Term: ${quote.contract_duration_months} Months with 99.9% Uptime SLA`, 100, y);

  // Terms and Compliance
  y += 18;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(16, y, 178, 38, 3, 3, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Enterprise Terms & DPDP Compliance Summary:', 20, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('1. Service activation SLA is 5-7 business days post KYC verification and optical fiber feasibility check.', 20, y + 13);
  doc.text('2. Customer data processed in compliance with the Digital Personal Data Protection (DPDP) Act, 2023.', 20, y + 19);
  doc.text('3. Installation includes enterprise dual-band Wi-Fi router with proactive 24x7 NOC monitoring.', 20, y + 25);
  doc.text('4. Taxes extra as applicable (18% GST). Payment terms: Monthly automated billing cycle.', 20, y + 31);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Bharti Airtel Limited | Airtel Center, Plot No. 16, Udyog Vihar, Phase-IV, Gurugram - 122015', 38, 285);

  doc.save(`Airtel_Udyam360_Quote_${quote.id}.pdf`);
}
