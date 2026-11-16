'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Layers,
  ShoppingBag,
  Sparkles,
  Users,
  Store,
  MessageSquare,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  MapPin,
  Clock,
  Printer,
  Barcode,
  Menu,
  X,
  Send,
  Lock,
  Globe,
  Receipt,
  AlertCircle
} from 'lucide-react';
import { subscriptionService } from '@/services/subscriptionService';

export default function VexaLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Product Showcase Active Tab State
  const [activeShowcaseTab, setActiveShowcaseTab] = useState('dashboard');

  // Contact / Lead Form State
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    mobile: '',
    email: '',
    businessType: 'RETAIL',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const toggleFaq = (idx) => {
    setOpenFaqIndex(openFaqIndex === idx ? null : idx);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (submitError) setSubmitError('');
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setSubmitError('Please enter your full name.');
    if (!formData.businessName.trim()) return setSubmitError('Please enter your business or shop name.');
    if (!formData.mobile.trim()) return setSubmitError('Please enter your mobile contact number.');
    if (!formData.email.trim()) return setSubmitError('Please enter a valid email address.');
    if (!formData.message.trim()) return setSubmitError('Please write a short message or requirement.');

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await subscriptionService.submitSalesEnquiry({
        contact_name: formData.name.trim(),
        business_name: formData.businessName.trim(),
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        business_type: formData.businessType,
        interested_plan: 'General Enquiry / Free Trial Consultation',
        message: formData.message.trim()
      });

      setSubmitSuccess(true);
      setFormData({
        name: '',
        businessName: '',
        mobile: '',
        email: '',
        businessType: 'RETAIL',
        message: ''
      });
    } catch (err) {
      setSubmitError(
        err.response?.data?.message ||
        err.message ||
        'Unable to send your message. Please try again or reach out directly via WhatsApp/Email.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Showcase screens configuration
  const showcaseScreens = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      tag: 'Overview & Metrics',
      image: '/landing/dashboard_overview.png',
      description: 'Real-time sales velocity, revenue metrics, payment balances, and stock summaries at a glance.'
    },
    {
      id: 'invoices',
      name: 'POS & Billing',
      tag: 'Fast Checkout',
      image: '/landing/invoices_billing.png',
      description: 'Lightning-fast GST sales invoice creation, itemized discounts, multi-payment options, and thermal printing.'
    },
    {
      id: 'products',
      name: 'Product Inventory',
      tag: 'SKU & Variant Control',
      image: '/landing/products_inventory.png',
      description: 'Multi-variant management (sizes, colors), barcode generator, automated low-stock warnings, and bulk imports.'
    },
    {
      id: 'details',
      name: 'Product Specs',
      tag: 'Barcode & Pricing',
      image: '/landing/product_details.png',
      description: 'Detailed product specifications, HSN tax classifications, multiple price levels, and instant label generation.'
    },
    {
      id: 'scanner',
      name: 'Barcode Scanner',
      tag: 'Hardware & Camera',
      image: '/landing/barcode_scanner.png',
      description: 'Native dual scanning engine supporting USB physical barcode guns on desktop and rear camera on mobile phones.'
    },
    {
      id: 'customers',
      name: 'Customer Intelligence',
      tag: 'Ledger & Balances',
      image: '/landing/customer_intelligence.png',
      description: 'Detailed customer purchase histories, outstanding balances, credit notes, and smart segmentation.'
    },
    {
      id: 'returns',
      name: 'Sales Returns',
      tag: 'Credit Notes',
      image: '/landing/sales_returns.png',
      description: 'Itemized sales returns and debit/credit note tracking that automatically restores inventory in real-time.'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Campaigns',
      tag: 'Customer Outreach',
      image: '/landing/whatsapp_campaigns.png',
      description: 'Automated digital invoice dispatch, payment reminder alerts, and customer engagement via WhatsApp.'
    }
  ];

  const currentShowcase = showcaseScreens.find((s) => s.id === activeShowcaseTab) || showcaseScreens[0];

  // FAQs configuration
  const faqs = [
    {
      q: 'What is VEXA Invoice?',
      a: 'VEXA Invoice is a modern, high-speed cloud billing and business management platform designed by VEXA TECH. It centralizes Point-of-Sale (POS) invoicing, multi-variant inventory control, customer & supplier ledgers, barcode scanning, and GST compliance in one unified system.'
    },
    {
      q: 'Which businesses can use VEXA Invoice?',
      a: 'VEXA Invoice is built specifically for retail storefronts, garment and textile showrooms, footwear stores, wholesale distributors, hardware shops, supermarkets, and electronics retailers that require fast billing, accurate stock control, and barcode workflows.'
    },
    {
      q: 'Can I manage my product inventory and variants?',
      a: 'Yes! VEXA Invoice provides full support for matrix variants (such as sizes, colors, and cuts), automated barcode/EAN assignment, low-stock threshold alerts, purchase stock-inward, and real-time inventory adjustments upon billing and returns.'
    },
    {
      q: 'Does VEXA Invoice support GST billing?',
      a: 'Absolutely. You can generate professional GST-compliant tax invoices with automatic CGST, SGST, and IGST breakdowns based on customer state, HSN code lookups, thermal receipt (80mm/58mm) formats, and standard A4 tax invoice printouts.'
    },
    {
      q: 'Can I manage customers and suppliers?',
      a: 'Yes. Maintain customer profiles, track outstanding payments, view historical ledger transactions, record supplier purchases, manage supplier credit returns (debit notes), and log partial or full settlements seamlessly.'
    },
    {
      q: 'Can I send invoices through WhatsApp?',
      a: 'Yes. VEXA Invoice features built-in WhatsApp integration to instantly dispatch digital invoices, payment receipts, balance reminders, and promotional campaigns directly to your customers’ phones, subject to proper configuration and customer consent.'
    },
    {
      q: 'Can my employees access the software with restricted roles?',
      a: 'Yes. VEXA Invoice offers enterprise-grade Role-Based Access Control (RBAC). You can assign distinct permissions to Store Managers, Cashiers/Billing Staff, Accountants, and Stock Managers, keeping financial summaries and sensitive administrative settings restricted to business owners.'
    },
    {
      q: 'What is included in the Growth plan?',
      a: 'The Growth plan includes everything in Starter plus the Customer Self-Service Portal, digital Online Shop catalogue, QR-Code table/counter shopping, online customer order placements, and direct WhatsApp customer order notifications.'
    },
    {
      q: 'Is a free trial available?',
      a: 'Yes! Every new business gets an instant 14-day full-featured free trial with no credit card required. You can test billing, upload your inventory, print barcodes, and explore all capabilities immediately.'
    },
    {
      q: 'How can I contact VEXA TECH for support or custom setup?',
      a: 'You can reach out to our team anytime via email at vexatech.connect@gmail.com, visit vexatech.in, or submit the contact enquiry form at the bottom of this page. Our technical onboarding specialists will assist you directly.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* =========================================================================
          3. HEADER / STICKY NAVIGATION BAR
      ========================================================================= */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="#home" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-xs border border-slate-100 flex items-center justify-center bg-blue-600">
              <Image
                src="/vexa-logo.png"
                alt="VEXA Invoice Logo"
                width={40}
                height={40}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-950 flex items-center">
                VEXA <span className="text-blue-600 ml-1.5 font-bold">INVOICE</span>
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 tracking-wider uppercase -mt-1">
                By VEXA TECH
              </span>
            </div>
          </Link>

          {/* Desktop Center Navigation */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-semibold text-slate-600">
            <Link href="#home" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <Link href="#features" className="hover:text-blue-600 transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="hover:text-blue-600 transition-colors">
              How It Works
            </Link>
            <Link href="#showcase" className="hover:text-blue-600 transition-colors">
              Showcase
            </Link>
            <Link href="#pricing" className="hover:text-blue-600 transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="hover:text-blue-600 transition-colors">
              FAQ
            </Link>
            <Link href="#contact" className="hover:text-blue-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Desktop Right CTA Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-bold text-slate-700 hover:text-blue-600 rounded-xl hover:bg-slate-100 transition-all"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-xs shadow-blue-500/20 transition-all flex items-center space-x-1.5"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-5 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-4 duration-200">
            <nav className="flex flex-col space-y-3 text-sm font-bold text-slate-700">
              <Link
                href="#home"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-blue-600 transition-colors"
              >
                Home
              </Link>
              <Link
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-blue-600 transition-colors"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-blue-600 transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="#showcase"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-blue-600 transition-colors"
              >
                Showcase
              </Link>
              <Link
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-blue-600 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-blue-600 transition-colors"
              >
                FAQ
              </Link>
              <Link
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 hover:text-blue-600 transition-colors"
              >
                Contact
              </Link>
            </nav>
            <div className="pt-3 border-t border-slate-100 flex flex-col space-y-2.5">
              <Link
                href="/login"
                className="w-full text-center py-2.5 text-sm font-bold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="w-full text-center py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-xs transition-all"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          4. HERO SECTION
      ========================================================================= */}
      <section id="home" className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Next-Gen Retail & Wholesale Billing</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.12]">
                Smart Billing.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                  Complete Business Control.
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed max-w-xl mx-auto lg:mx-0">
                Manage your sales, inventory, customers, purchases and business finances with one simple billing solution.
              </p>

              {/* Supporting Text */}
              <p className="text-xs sm:text-sm font-semibold text-slate-500 max-w-lg mx-auto lg:mx-0">
                Designed for retail shops, wholesale businesses, garment stores and textile businesses.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto px-7 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-center flex items-center justify-center space-x-2"
                >
                  <span>Start Your Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="#features"
                  className="w-full sm:w-auto px-6 py-3.5 text-base font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 rounded-2xl transition-all text-center"
                >
                  Explore Features
                </Link>
              </div>

              {/* Small Feature Highlight Pills */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Easy Billing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Smart Inventory</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Customer CRM</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold text-slate-700">Reports</span>
                </div>
              </div>
            </div>

            {/* Right Product Screenshot */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto rounded-2xl md:rounded-3xl p-2.5 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 shadow-2xl border border-slate-200/80">
                <div className="relative rounded-xl md:rounded-2xl overflow-hidden bg-white shadow-inner aspect-[16/10]">
                  <Image
                    src="/landing/dashboard_overview.png"
                    alt="VEXA Invoice Application Dashboard"
                    width={1024}
                    height={640}
                    className="w-full h-full object-cover object-top"
                    priority
                  />
                </div>
              </div>

              {/* Decorative Trust Badge Overlay */}
              <div className="hidden sm:flex absolute -bottom-5 -left-5 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-extrabold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">GST-Ready & Secure</p>
                  <p className="text-[11px] text-slate-500">100% Data Isolation by VEXA TECH</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. BUSINESS CHALLENGES SECTION
      ========================================================================= */}
      <section className="py-20 bg-slate-50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold uppercase tracking-wider">
            <span>Daily Operational Headaches</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Running a Business Shouldn't Be Complicated.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium">
            VEXA Invoice brings your daily business operations together in one organized platform.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-10 text-left">
            {[
              {
                title: 'Managing bills manually.',
                desc: 'Handwritten bills take too long, cause arithmetic calculation errors, and create long checkout queues.'
              },
              {
                title: 'Tracking product stock.',
                desc: 'Stock mismatch leads to out-of-stock items, unfulfilled customer orders, and unsellable stale inventory.'
              },
              {
                title: 'Finding customer purchase history.',
                desc: 'Searching through old paper bill books for warranty claims or customer preferences wastes valuable hours.'
              },
              {
                title: 'Managing outstanding payments.',
                desc: 'Uncollected customer credits and unrecorded pending balances hurt cash flow and profitability.'
              },
              {
                title: 'Tracking supplier purchases.',
                desc: 'Misplaced supplier invoices and unadjusted return items lead to overpaying vendors.'
              },
              {
                title: 'Understanding business performance.',
                desc: 'Lack of clear daily sales, profit margins, and expense figures makes growth decisions difficult.'
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm mb-4 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  0{idx + 1}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. FEATURES SECTION
      ========================================================================= */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <span>Built For Precision</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Everything Your Business Needs.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium">
            From checkout counter to backend warehouse, VEXA Invoice delivers specialized tools designed for high efficiency.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-12 text-left">
            {/* Feature 1: Billing & POS */}
            <div className="bg-slate-50 p-7 rounded-3xl border border-slate-200/80 hover:bg-white hover:border-blue-500 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Billing & POS</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Create professional invoices and complete sales quickly. Supports thermal receipt printing, keyboard shortcuts, multiple payment modes, and split tenders.
              </p>
            </div>

            {/* Feature 2: Product & Inventory Management */}
            <div className="bg-slate-50 p-7 rounded-3xl border border-slate-200/80 hover:bg-white hover:border-blue-500 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Product & Inventory Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Manage products, categories, variants, barcodes and stock levels. Matrix combinations for sizes and colors with real-time stock deductions upon billing.
              </p>
            </div>

            {/* Feature 3: Customer Management */}
            <div className="bg-slate-50 p-7 rounded-3xl border border-slate-200/80 hover:bg-white hover:border-blue-500 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Customer Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Maintain customer details, purchase history, payment records and outstanding balances. Track customer loyalty and overdue receivables effortlessly.
              </p>
            </div>

            {/* Feature 4: Purchase Management */}
            <div className="bg-slate-50 p-7 rounded-3xl border border-slate-200/80 hover:bg-white hover:border-blue-500 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Store className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Purchase Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Manage suppliers, purchase records, stock inward and supplier payments. Log vendor returns and debit notes with automatic inventory synchronization.
              </p>
            </div>

            {/* Feature 5: GST & Invoices */}
            <div className="bg-slate-50 p-7 rounded-3xl border border-slate-200/80 hover:bg-white hover:border-blue-500 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-700 text-white flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">GST & Invoices</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Create invoices with applicable GST and professional invoice formats. Automatic CGST, SGST, IGST tax breakdown, HSN classification, and B2B/B2C formats.
              </p>
            </div>

            {/* Feature 6: Business Reports */}
            <div className="bg-slate-50 p-7 rounded-3xl border border-slate-200/80 hover:bg-white hover:border-blue-500 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Business Reports</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Understand sales, purchases, expenses and business performance. One-click Excel and PDF export for accountants and tax filing periods.
              </p>
            </div>

            {/* Feature 7: WhatsApp Integration */}
            <div className="bg-slate-50 p-7 rounded-3xl border border-slate-200/80 hover:bg-white hover:border-blue-500 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">WhatsApp Integration</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Send invoices, receipts, reminders and promotional campaigns through WhatsApp, subject to configuration and customer consent. Eco-friendly digital bills.
              </p>
            </div>

            {/* Feature 8: Employee & Role Management */}
            <div className="bg-slate-50 p-7 rounded-3xl border border-slate-200/80 hover:bg-white hover:border-blue-500 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Employee & Role Management</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Manage staff access with role-based permissions. Protect sensitive financial data while allowing billing staff and inventory managers to work freely.
              </p>
            </div>

            {/* Feature 9: Customer Self-Service Portal */}
            <div className="bg-slate-50 p-7 rounded-3xl border border-slate-200/80 hover:bg-white hover:border-blue-500 hover:shadow-lg transition-all space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Customer Self-Service Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Allow customers to access invoices, payment history and supported online shopping features with the applicable Growth and Lifetime plans.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. HOW IT WORKS SECTION
      ========================================================================= */}
      <section id="how-it-works" className="py-24 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <span>Fast Onboarding</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Get Started in Three Simple Steps.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-medium">
            No complex setup or hardware lock-in. Be up and running with your business billing in under 5 minutes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 text-center">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs relative space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl">
                1
              </div>
              <h3 className="text-lg font-bold text-slate-900">Create Your Business Account</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Sign up in 30 seconds with your business name, phone, and optional GSTIN. Instant 14-day free trial access.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs relative space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xl">
                2
              </div>
              <h3 className="text-lg font-bold text-slate-900">Add Your Products & Customers</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Add stock items manually or upload your catalogue. Configure sizes, colors, retail pricing, and generate barcodes.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs relative space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-black text-xl">
                3
              </div>
              <h3 className="text-lg font-bold text-slate-900">Start Billing & Managing Operations</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Open POS billing, scan product barcodes, print receipts, and send digital invoices instantly over WhatsApp.
              </p>
            </div>
          </div>

          <div className="pt-10">
            <Link
              href="/signup"
              className="inline-flex items-center space-x-2 px-8 py-3.5 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-2xl shadow-lg shadow-blue-500/25 transition-all"
            >
              <span>Get Started Today</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. PRODUCT SHOWCASE SECTION (ACTUAL SCREENSHOTS)
      ========================================================================= */}
      <section id="showcase" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <span>Verified Interface</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            See VEXA Invoice In Action.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto font-medium">
            Explore real screens from the active VEXA Invoice platform. Clean typography, streamlined workflows, and high contrast.
          </p>

          {/* Interactive Showcase Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-8 pb-4">
            {showcaseScreens.map((screen) => (
              <button
                key={screen.id}
                type="button"
                onClick={() => setActiveShowcaseTab(screen.id)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                  activeShowcaseTab === screen.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {screen.name}
              </button>
            ))}
          </div>

          {/* Screenshot Display Frame */}
          <div className="pt-6 max-w-5xl mx-auto">
            <div className="rounded-3xl p-3 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 border border-slate-300/80 shadow-2xl">
              <div className="rounded-2xl overflow-hidden bg-slate-900 shadow-inner">
                {/* Mock Window Controls Header */}
                <div className="bg-slate-800 px-4 py-2.5 flex items-center justify-between border-b border-slate-700">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-3 text-[11px] font-mono text-slate-400 truncate">
                      vexainvoice.vexatech.in/{currentShowcase.id}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {currentShowcase.tag}
                  </span>
                </div>

                {/* Actual Image */}
                <div className="relative aspect-[16/10] bg-slate-950">
                  <Image
                    src={currentShowcase.image}
                    alt={currentShowcase.name}
                    width={1024}
                    height={640}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            </div>

            {/* Description Caption */}
            <p className="mt-4 text-xs sm:text-sm font-semibold text-slate-600 max-w-2xl mx-auto">
              {currentShowcase.description}
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          9. PRICING SECTION
      ========================================================================= */}
      <section id="pricing" className="py-24 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <span>Transparent Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Choose the Right Plan for Your Business.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-medium">
            Affordable monthly subscriptions or one-time lifetime ownership. Upgrade or change your plan at any time.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-12 text-left items-stretch">
            {/* Plan 1: Starter */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                    STARTER
                  </span>
                  <h3 className="text-2xl font-black text-slate-950 mt-1">Single Shop</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Ideal for small retail stores, boutique garment outlets & standalone shops.
                  </p>
                </div>

                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-black text-slate-950">₹599</span>
                  <span className="text-xs font-semibold text-slate-500">/ month</span>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                  <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Included Features:</p>
                  {[
                    'Core billing & POS interface',
                    'Product and inventory management',
                    'Customer and supplier management',
                    'GST tax invoices & thermal receipt print',
                    'Purchases and supplier returns',
                    'Reports and Excel data analytics',
                    'Multi-format Barcode & QR scanning',
                    'Staff role permissions (Cashier/Manager)'
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-600 font-medium">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="/signup"
                  className="w-full block py-3 text-center text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all"
                >
                  Start Free Trial
                </Link>
              </div>
            </div>

            {/* Plan 2: Growth (Highlighted) */}
            <div className="bg-white rounded-3xl p-8 border-2 border-blue-600 shadow-xl relative flex flex-col justify-between transform lg:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest py-1 px-4 rounded-full shadow-xs">
                Most Popular
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                    GROWTH
                  </span>
                  <h3 className="text-2xl font-black text-slate-950 mt-1">Growing Retail & Online</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    For multi-counter showrooms, wholesalers and stores seeking online customer orders.
                  </p>
                </div>

                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-black text-slate-950">₹999</span>
                  <span className="text-xs font-semibold text-slate-500">/ month</span>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                  <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Everything in Starter, plus:</p>
                  {[
                    'Customer Self-Service Portal access',
                    'Digital Online Shop catalogue',
                    'QR Code Shopping for tables & counters',
                    'Customer online order submission & tracking',
                    'Direct WhatsApp order notifications',
                    'Priority customer onboarding support'
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span className="text-slate-700 font-semibold">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="/signup"
                  className="w-full block py-3 text-center text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 rounded-xl transition-all"
                >
                  Choose Growth
                </Link>
              </div>
            </div>

            {/* Plan 3: Lifetime */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-extrabold text-purple-600 uppercase tracking-wider">
                    LIFETIME
                  </span>
                  <h3 className="text-2xl font-black text-slate-950 mt-1">Complete Ownership</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Permanent software entitlement with dedicated custom business domain and cloud hosting.
                  </p>
                </div>

                <div className="flex items-baseline space-x-1">
                  <span className="text-4xl font-black text-slate-950">₹59,999</span>
                  <span className="text-xs font-semibold text-slate-500">one-time</span>
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
                  <p className="font-bold text-slate-900 uppercase text-[10px] tracking-wider">Everything in Growth, plus:</p>
                  {[
                    'Lifetime software entitlement',
                    'Custom business domain free for first year',
                    'Server hosting free for first year',
                    'Initial domain and hosting setup assistance',
                    'Dedicated technical support channel',
                    'Zero monthly recurring software fee'
                  ].map((feat, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                      <span className="text-slate-600 font-medium">{feat}</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 font-medium">
                    Note: Domain and server hosting renewals after the first year may be chargeable based on standard registrar rates.
                  </p>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="#contact"
                  className="w-full block py-3 text-center text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-xl transition-all"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. FREE TRIAL CTA SECTION
      ========================================================================= */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight">
            Experience Smarter Business Management.
          </h2>
          <p className="text-base sm:text-lg text-blue-100 max-w-2xl mx-auto font-medium leading-relaxed">
            Start managing your business with VEXA Invoice. Explore the features and discover a simpler way to run your shop.
          </p>
          <div className="pt-4">
            <Link
              href="/signup"
              className="inline-flex items-center space-x-2 px-9 py-4 text-base font-bold text-blue-700 bg-white hover:bg-slate-100 active:scale-95 rounded-2xl shadow-xl transition-all"
            >
              <span>Start Your Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <p className="text-xs text-blue-200 font-medium">
            No credit card required • Instant access in 30 seconds • Full features included
          </p>
        </div>
      </section>

      {/* =========================================================================
          11. FAQ SECTION (EXPANDABLE ACCORDIONS)
      ========================================================================= */}
      <section id="faq" className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 text-center">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            <span>Got Questions?</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Frequently Asked Questions.
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-medium pb-8">
            Clear answers about features, supported hardware, pricing and setup.
          </p>

          <div className="space-y-3.5 text-left">
            {faqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left flex items-center justify-between text-sm sm:text-base font-bold text-slate-900 hover:text-blue-600 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-blue-600 shrink-0 ml-4" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 shrink-0 ml-4" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          12. CONTACT SECTION
      ========================================================================= */}
      <section id="contact" className="py-24 bg-slate-50 border-t border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Contact Details */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                <span>Direct Support & Consultation</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                Let's Simplify Your Business Management.
              </h2>
              <p className="text-sm text-slate-600 font-medium leading-relaxed">
                Have questions regarding the Lifetime plan, custom integrations, or multi-store onboarding? Our technical team is ready to help your shop modernize.
              </p>

              <div className="space-y-4 pt-4 text-xs font-medium text-slate-700">
                <div className="flex items-center space-x-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Official Website</span>
                    <a
                      href="https://vexatech.in"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      vexatech.in
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Direct Email</span>
                    <a
                      href="mailto:vexatech.connect@gmail.com"
                      className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      vexatech.connect@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-center space-x-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Response Time</span>
                    <span className="font-bold text-slate-900">Within 24 Hours on Business Days</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Contact Enquiry Form */}
            <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl">
              <h3 className="text-xl font-bold text-slate-950 mb-1">Send Us a Message</h3>
              <p className="text-xs text-slate-500 mb-6">
                Fill in the details below. Our team will review your business requirements and get back to you promptly.
              </p>

              {submitSuccess ? (
                <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="text-lg font-bold text-emerald-950">Thank You! Your Enquiry Has Been Received.</h4>
                  <p className="text-xs text-emerald-800 font-medium max-w-md mx-auto">
                    A VEXA TECH onboarding specialist has received your request and will contact you via phone or email shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setSubmitSuccess(false)}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {submitError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Your Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleFormChange}
                        placeholder="e.g. Srinivas"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Business / Shop Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="businessName"
                        value={formData.businessName}
                        onChange={handleFormChange}
                        placeholder="e.g. Asva Textiles"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleFormChange}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleFormChange}
                        placeholder="e.g. shop@example.com"
                        className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Business Type
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleFormChange}
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    >
                      <option value="RETAIL">Retail Shop</option>
                      <option value="GARMENT_TEXTILE">Garment & Textile Store</option>
                      <option value="WHOLESALE">Wholesale & Distribution</option>
                      <option value="SUPERMARKET">Supermarket / Grocery</option>
                      <option value="OTHER">Other Business</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Message / Requirements <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      rows={4}
                      value={formData.message}
                      onChange={handleFormChange}
                      placeholder="Tell us about your billing counters, inventory requirements, or plan questions..."
                      className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span>Submitting Enquiry...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Enquiry</span>
                      </>
                    )}
                  </button>
                  <p className="text-[11px] text-center text-slate-400">
                    Your details are securely saved in VEXA TECH CRM and never shared with third parties.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          13. FOOTER
      ========================================================================= */}
      <footer className="bg-slate-950 text-white pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
            {/* Col 1: Brand */}
            <div className="space-y-4 md:col-span-1">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-blue-600 flex items-center justify-center">
                  <Image
                    src="/vexa-logo.png"
                    alt="VEXA Logo"
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
                <span className="text-lg font-black tracking-tight text-white">
                  VEXA <span className="text-blue-500">INVOICE</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed">
                Smart Billing. Complete Business Control. Built with precision for retail, wholesale and textile enterprises by VEXA TECH.
              </p>
              <p className="text-[11px] font-mono text-slate-500">
                vexainvoice.vexatech.in
              </p>
            </div>

            {/* Col 2: Product */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Product</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li>
                  <Link href="#features" className="hover:text-blue-400 transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-blue-400 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="hover:text-blue-400 transition-colors">
                    Free Trial
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-blue-400 transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Company */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Company</h4>
              <ul className="space-y-2 text-xs text-slate-400 font-medium">
                <li>
                  <a
                    href="https://vexatech.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-400 transition-colors"
                  >
                    About VEXA TECH
                  </a>
                </li>
                <li>
                  <Link href="#contact" className="hover:text-blue-400 transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-blue-400 transition-colors">
                    Knowledge Base
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:vexatech.connect@gmail.com"
                    className="hover:text-blue-400 transition-colors"
                  >
                    Technical Support
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 4: Platform Security */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Security & Isolation</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Multi-tenant isolated company databases, encrypted sessions, automated Excel backups, and role-based staff isolation.
              </p>
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Enterprise Grade Security</span>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium gap-4">
            <p>© {new Date().getFullYear()} VEXA TECH. All rights reserved.</p>
            <div className="flex items-center space-x-6">
              <a href="https://vexatech.in" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
                vexatech.in
              </a>
              <span>•</span>
              <a href="mailto:vexatech.connect@gmail.com" className="hover:text-slate-400 transition-colors">
                vexatech.connect@gmail.com
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

