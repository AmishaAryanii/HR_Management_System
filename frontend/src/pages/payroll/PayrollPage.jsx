import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { payrollAPI, companyAPI, employeeAPI } from '../../services/api';
import LoadingSkeleton from '../../components/common/LoadingSkeleton';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import {
  HiOutlineDownload, HiOutlineEye, HiOutlinePrinter, HiOutlineChevronLeft,
  HiOutlineDocumentText, HiOutlineCash, HiOutlineCalendar, HiOutlineFilter,
  HiOutlineSearch, HiOutlineCheckCircle, HiOutlineClock, HiOutlinePlus
} from 'react-icons/hi';

// ── Stat Card ──
function StatBox({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    amber: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
  };
  const c = colors[color] || colors.blue;
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-secondary-900">{value ?? '—'}</p>
          <p className="text-xs text-secondary-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ── Month/Year filter helpers ──
const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];
const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

function monthName(m) { return MONTHS[(m || 1) - 1] || 'Unknown'; }

// ═══════════════════════════════════════════════════════════════
//  Payslip Document Viewer (kept from original, adapted for API)
// ═══════════════════════════════════════════════════════════════

function PremiumHeader({ company }) {
  return (
    <div className="bg-white border-b-4 border-blue-600 px-8 py-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {company?.logo ? (
            <div className="w-16 h-16 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-center p-2 overflow-hidden">
              <img src={company.logo} alt={company.companyName} className="w-full h-full object-contain" />
            </div>
          ) : (
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-2xl font-display">
                {company?.companyName?.charAt(0) || 'D'}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-black font-display">{company?.companyName || 'Debox Technology'}</h1>
            <p className="text-gray-500 text-xs mt-0.5">{company?.tagline || 'Website Development & Digital Marketing Solutions'}</p>
            <div className="flex items-center gap-3 mt-2 text-gray-500 text-[11px]">
              <span>{company?.email || 'hr@deboxtechnology.com'}</span>
              <span className="w-px h-3 bg-gray-300" />
              <span>{company?.phone || '+91-9708455757'}</span>
              <span className="w-px h-3 bg-gray-300" />
              <span>{company?.website || 'www.deboxtechnology.com'}</span>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-2 text-right">
          <p className="text-blue-600 text-[10px] uppercase tracking-wider font-semibold">Payslip</p>
          <p className="text-black font-bold text-sm">{company?.gstin || ''}</p>
        </div>
      </div>
    </div>
  );
}

function PayslipTitle({ heading, subtitle }) {
  return (
    <div className="text-center py-5 border-b border-gray-200 bg-white">
      <h2 className="text-lg font-bold text-black uppercase tracking-wide">{heading}</h2>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}

function SectionTitle({ children }) {
  return <h3 className="font-bold text-black mb-2">{children}</h3>;
}

function InfoGrid({ rows }) {
  return (
    <div className="grid grid-cols-2 gap-x-8 gap-y-1.5 text-sm">
      {rows.map(([label, value], i) => (
        <div key={i} className="flex justify-between border-b border-dotted border-gray-300 py-1">
          <span className="text-gray-500">{label}</span>
          <span className="text-black font-medium text-right">{value}</span>
        </div>
      ))}
    </div>
  );
}

function formatINR(amount) {
  const num = parseFloat(amount || 0);
  return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PayslipDocumentView({ company, payslip }) {
  if (!payslip) return null;

  const allowances = payslip.allowances || {};
  const deductionsData = payslip.deductions || {};
  const emp = payslip.employee || {};
  const payroll = payslip.payroll || {};

  const grossPay = parseFloat(payslip.grossPay || 0);
  const totalDeductions = parseFloat(payslip.totalDeductions || 0);
  const netPay = parseFloat(payslip.netPay || 0);

  const earningsRows = [
    { label: 'Basic Salary', amount: parseFloat(payslip.basicSalary || allowances.basicSalary || 0) },
    { label: 'House Rent Allowance (HRA)', amount: parseFloat(allowances.hra || 0) },
    { label: 'Dearness Allowance', amount: parseFloat(allowances.da || 0) },
    { label: 'Conveyance Allowance', amount: parseFloat(allowances.conveyance || 0) },
    { label: 'Special Allowance', amount: parseFloat(allowances.specialAllowance || 0) },
    { label: 'Medical Allowance', amount: parseFloat(allowances.medicalAllowance || 0) },
    { label: 'Bonus', amount: parseFloat(allowances.bonus || 0) },
    { label: 'Overtime Pay', amount: parseFloat(allowances.overtimePay || 0) },
  ].filter(e => e.amount > 0);

  const deductionsRows = [
    { label: 'Provident Fund (PF)', amount: parseFloat(deductionsData.pf || payroll.pfDeduction || 0) },
    { label: 'Income Tax (TDS)', amount: parseFloat(deductionsData.tds || payroll.taxDeduction || 0) },
    { label: 'Professional Tax', amount: parseFloat(deductionsData.professionalTax || 0) },
    { label: 'Insurance Premium', amount: parseFloat(deductionsData.insurance || 0) },
    { label: 'Loan Repayment', amount: parseFloat(deductionsData.loan || 0) },
    { label: 'Other Deductions', amount: parseFloat(deductionsData.other || 0) },
  ].filter(d => d.amount > 0);

  const maxRows = Math.max(earningsRows.length, deductionsRows.length, 1);

  const deptName = emp.department?.name || emp.department || '—';
  const desigName = emp.designation?.title || emp.designation || '—';
  const empName = emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : emp.name || '—';
  const periodLabel = payslip.month ? `${monthName(payslip.month)} ${payslip.year}` : '—';
  const payslipRef = payslip.payslipNumber || `#${payslip.id}`;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-card">
      {/* Print / Download buttons */}
      <div className="flex justify-end gap-2 px-8 pt-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="btn-secondary flex items-center gap-1.5 text-sm"
        >
          <HiOutlinePrinter className="w-4 h-4" /> Print
        </button>
        <button
          onClick={() => downloadPDF(payslip.id)}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <HiOutlineDownload className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {/* Premium Header with Company Branding */}
      <PremiumHeader company={company} />

      {/* Payslip Title */}
      <PayslipTitle 
        heading="PAYSLIP" 
        subtitle={`SALARY SLIP FOR THE MONTH OF ${periodLabel.toUpperCase()} — REF: ${payslipRef}`}
      />

      <div className="px-8 py-6 space-y-8 bg-white">
        {/* Employee Details - Two column grid */}
        <section>
          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded-full" />
            Employee Information
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 bg-gray-50 rounded-xl p-5 border border-gray-100">
            <div className="flex justify-between items-center border-b border-dotted border-gray-200 pb-1.5">
              <span className="text-xs text-gray-500">Employee Name</span>
              <span className="text-sm font-semibold text-black">{empName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-dotted border-gray-200 pb-1.5">
              <span className="text-xs text-gray-500">Employee ID</span>
              <span className="text-sm font-semibold text-black">{emp.employeeId || '—'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-dotted border-gray-200 pb-1.5">
              <span className="text-xs text-gray-500">Designation</span>
              <span className="text-sm font-semibold text-black">{desigName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-dotted border-gray-200 pb-1.5">
              <span className="text-xs text-gray-500">Department</span>
              <span className="text-sm font-semibold text-black">{deptName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-dotted border-gray-200 pb-1.5">
              <span className="text-xs text-gray-500">Date of Joining</span>
              <span className="text-sm font-semibold text-black">{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-IN') : '—'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-dotted border-gray-200 pb-1.5">
              <span className="text-xs text-gray-500">Pay Period</span>
              <span className="text-sm font-semibold text-black">{periodLabel}</span>
            </div>
            <div className="flex justify-between items-center border-b border-dotted border-gray-200 pb-1.5">
              <span className="text-xs text-gray-500">PAN</span>
              <span className="text-sm font-semibold text-black">{emp.panNumber || '—'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-dotted border-gray-200 pb-1.5">
              <span className="text-xs text-gray-500">UAN</span>
              <span className="text-sm font-semibold text-black">{emp.uanNumber || '—'}</span>
            </div>
            <div className="flex justify-between items-center pb-1.5">
              <span className="text-xs text-gray-500">Bank Account</span>
              <span className="text-sm font-semibold text-black">{emp.bankName ? `${emp.bankName} — ${emp.bankAccount ? `XXXXXX${emp.bankAccount.slice(-4)}` : '—'}` : '—'}</span>
            </div>
            <div className="flex justify-between items-center pb-1.5">
              <span className="text-xs text-gray-500">Pay Date</span>
              <span className="text-sm font-semibold text-black">{payslip.createdAt ? new Date(payslip.createdAt).toLocaleDateString('en-IN') : '—'}</span>
            </div>
          </div>
        </section>

        {/* Earnings & Deductions Table */}
        <section>
          <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-1 h-4 bg-blue-600 rounded-full" />
            Earnings & Deductions
          </h3>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="text-left px-4 py-2.5 font-semibold">Earnings</th>
                  <th className="text-right px-4 py-2.5 font-semibold w-36">Amount (₹)</th>
                  <th className="text-left px-4 py-2.5 font-semibold pl-8">Deductions</th>
                  <th className="text-right px-4 py-2.5 font-semibold w-36">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxRows }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                    <td className="px-4 py-2.5 text-gray-700">{earningsRows[i]?.label ?? ''}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700 font-medium">
                      {earningsRows[i] ? formatINR(earningsRows[i].amount) : ''}
                    </td>
                    <td className="px-4 py-2.5 text-gray-700 pl-8">{deductionsRows[i]?.label ?? ''}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700 font-medium">
                      {deductionsRows[i] ? formatINR(deductionsRows[i].amount) : ''}
                    </td>
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="bg-blue-50 font-bold border-t-2 border-blue-600">
                  <td className="px-4 py-3 text-black">Gross Earnings</td>
                  <td className="px-4 py-3 text-right text-blue-600">{formatINR(grossPay)}</td>
                  <td className="px-4 py-3 text-black pl-8">Total Deductions</td>
                  <td className="px-4 py-3 text-right text-black">{formatINR(totalDeductions)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Net Pay - Premium Highlight */}
        <section>
          <div className="bg-blue-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-xs uppercase tracking-wider">Net Payable</p>
                <p className="text-2xl font-bold mt-1">{formatINR(netPay)}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-[10px] uppercase tracking-wider">Gross − Deductions</p>
                <p className="text-blue-100 text-xs mt-1">
                  {formatINR(grossPay)} − {formatINR(totalDeductions)}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Notes & Issued By */}
        <div className="grid grid-cols-2 gap-6">
          <section>
            <h3 className="text-sm font-bold text-black mb-2 flex items-center gap-2">
              <span className="w-1 h-4 bg-gray-400 rounded-full" />
              Notes
            </h3>
            <ul className="space-y-1.5 text-xs text-gray-500">
              <li className="flex gap-2"><span className="text-gray-300 mt-1">•</span>This is a computer-generated payslip. No signature required.</li>
              <li className="flex gap-2"><span className="text-gray-300 mt-1">•</span>Verify all details within 7 days of receipt.</li>
              <li className="flex gap-2"><span className="text-gray-300 mt-1">•</span>Subject to statutory deductions as per government norms.</li>
            </ul>
          </section>
          <section className="text-right">
            <h3 className="text-sm font-bold text-black mb-2 flex items-center justify-end gap-2">
              Issued By
              <span className="w-1 h-4 bg-gray-400 rounded-full" />
            </h3>
            <p className="text-sm font-bold text-black">{company?.companyName || 'Debox Technology'}</p>
            <p className="text-xs text-gray-500 mt-0.5">{company?.tagline || ''}</p>
            <p className="text-xs text-gray-400 mt-1">Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t-2 border-blue-600 px-8 py-3 text-center">
        <p className="text-[10px] text-gray-400">
          {company?.companyName || 'Debox Technology'} — {company?.address || 'Office No. 1529, 15th Floor, Diamond Galaxy Plaza, Sector 4, Greater Noida, 201009'}
        </p>
      </div>
    </div>
  );
}

// ── Download helper ──
async function downloadPDF(payslipId) {
  try {
    const res = await payrollAPI.downloadPayslipPDF(payslipId);
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payslip-${payslipId}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Payslip downloaded');
  } catch {
    toast.error('Failed to download payslip');
  }
}

// ═══════════════════════════════════════════════════════════════
//  Main Payroll Page
// ═══════════════════════════════════════════════════════════════

export default function PayrollPage() {
  const { userRole } = useAuth();
  const isAdmin = userRole === 'super_admin' || userRole === 'admin';
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);

  // Process Payroll form
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [processForm, setProcessForm] = useState({
    employeeId: '', month: CURRENT_MONTH, year: CURRENT_YEAR,
    basicSalary: '', hra: '', bonus: '', pfDeduction: '', taxDeduction: '',
    payslipType: 'full_month', startDate: '', endDate: ''
  });
  const [processing, setProcessing] = useState(false);

  // Filters
  const [filterMonth, setFilterMonth] = useState(CURRENT_MONTH);
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR);
  const [showFilters, setShowFilters] = useState(false);

  // Stats
  const totalPayslips = payslips.length;
  const totalNetPay = payslips.reduce((sum, p) => sum + parseFloat(p.netPay || 0), 0);

  // Fetch company info
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await companyAPI.get();
        setCompany(res.data.data);
      } catch { /* ignore */ }
    };
    fetchCompany();
    if (isAdmin) {
      employeeAPI.getLite().then(res => setEmployees(res.data.data || [])).catch(() => {});
    }
  }, []);

  // Fetch payslips
  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterMonth) params.month = filterMonth;
      if (filterYear) params.year = filterYear;
      const res = await payrollAPI.getPayslips(params);
      setPayslips(res.data.data || []);
    } catch {
      toast.error('Failed to load payslips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  // View a single payslip
  const viewPayslip = async (id) => {
    setViewLoading(true);
    try {
      const res = await payrollAPI.getPayslip(id);
      setSelectedPayslip(res.data.data);
    } catch {
      toast.error('Failed to load payslip details');
      setSelectedPayslip(null);
    } finally {
      setViewLoading(false);
    }
  };

  const closeView = () => {
    setSelectedPayslip(null);
  };

  // Process Payroll
  const handleProcessPayroll = async (e) => {
    e.preventDefault();
    if (!processForm.employeeId) { toast.error('Please select an employee'); return; }
    if (!processForm.basicSalary || parseFloat(processForm.basicSalary) <= 0) {
      toast.error('Basic salary is required'); return;
    }
    setProcessing(true);
    try {
      const payload = {
        employeeId: parseInt(processForm.employeeId),
        month: processForm.month,
        year: processForm.year,
        basicSalary: parseFloat(processForm.basicSalary) || 0,
        hra: parseFloat(processForm.hra) || 0,
        bonus: parseFloat(processForm.bonus) || 0,
        pfDeduction: parseFloat(processForm.pfDeduction) || 0,
        taxDeduction: parseFloat(processForm.taxDeduction) || 0,
      };
      // Add custom date range if partial month
      if (processForm.payslipType === 'partial' && processForm.startDate && processForm.endDate) {
        payload.startDate = processForm.startDate;
        payload.endDate = processForm.endDate;
      }
      await payrollAPI.process(payload);
      toast.success('Payroll processed successfully!');
      setShowProcessForm(false);
      setProcessForm({
        employeeId: '', month: CURRENT_MONTH, year: CURRENT_YEAR,
        basicSalary: '', hra: '', bonus: '', pfDeduction: '', taxDeduction: '',
        payslipType: 'full_month', startDate: '', endDate: ''
      });
      fetchPayslips();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process payroll');
    } finally {
      setProcessing(false);
    }
  };

  // Calculate totals for form preview
  const formBasic = parseFloat(processForm.basicSalary) || 0;
  const formHra = parseFloat(processForm.hra) || 0;
  const formBonus = parseFloat(processForm.bonus) || 0;
  const formPf = parseFloat(processForm.pfDeduction) || 0;
  const formTax = parseFloat(processForm.taxDeduction) || 0;
  const formGross = formBasic + formHra + formBonus;
  const formDeductions = formPf + formTax;
  const formNet = formGross - formDeductions;

  // Status badge
  const statusBadge = (status) => {
    const map = {
      generated: { label: 'Generated', class: 'bg-gray-100 text-gray-700' },
      sent: { label: 'Sent', class: 'bg-blue-100 text-blue-700' },
      downloaded: { label: 'Downloaded', class: 'bg-green-100 text-green-700' },
    };
    const s = map[status] || { label: status, class: 'bg-gray-100 text-gray-700' };
    return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.class}`}>{s.label}</span>;
  };

  // ── List View ──
  if (!selectedPayslip) {
    return (
      <div>
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Payroll</h1>
            <p className="page-subtitle">Manage payslips and salary records</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowProcessForm(true)}
                className="btn-primary flex items-center gap-1.5"
              >
                <HiOutlinePlus className="w-4 h-4" /> Process Payroll
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary flex items-center gap-1.5"
            >
              <HiOutlineFilter className="w-4 h-4" />
              {showFilters ? 'Hide Filters' : 'Filter'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatBox icon={HiOutlineDocumentText} label="Total Payslips" value={totalPayslips} color="blue" />
          <StatBox icon={HiOutlineCash} label="Total Net Pay" value={totalPayslips > 0 ? formatINR(totalNetPay) : '—'} color="green" />
          <StatBox icon={HiOutlineCalendar} label="Period" value={`${monthName(filterMonth)} ${filterYear}`} color="purple" />
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="card p-4 mb-6 animate-fade-in-down">
            <div className="flex items-end gap-4 flex-wrap">
              <div>
                <label className="label text-xs mb-1">Month</label>
                <select
                  value={filterMonth}
                  onChange={e => setFilterMonth(parseInt(e.target.value))}
                  className="input-field py-2 w-40"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label text-xs mb-1">Year</label>
                <select
                  value={filterYear}
                  onChange={e => setFilterYear(parseInt(e.target.value))}
                  className="input-field py-2 w-28"
                >
                  {Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              <button onClick={fetchPayslips} className="btn-primary flex items-center gap-1.5">
                <HiOutlineSearch className="w-4 h-4" /> Search
              </button>
            </div>
          </div>
        )}

        {/* Payslips List */}
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : payslips.length === 0 ? (
          <div className="card p-12 text-center">
            <HiOutlineDocumentText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-secondary-900 mb-1">No Payslips Found</h3>
            <p className="text-sm text-secondary-500 max-w-md mx-auto">
              No payslips available for {monthName(filterMonth)} {filterYear}. Try selecting a different month or year.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-secondary-900">Payslip #</th>
                    <th className="text-left px-4 py-3 font-semibold text-secondary-900">Employee</th>
                    <th className="text-left px-4 py-3 font-semibold text-secondary-900">Period</th>
                    <th className="text-right px-4 py-3 font-semibold text-secondary-900">Net Pay</th>
                    <th className="text-center px-4 py-3 font-semibold text-secondary-900">Status</th>
                    <th className="text-right px-4 py-3 font-semibold text-secondary-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payslips.map((p) => {
                    const emp = p.employee || {};
                    const empName = emp.firstName ? `${emp.firstName} ${emp.lastName || ''}` : '—';
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-secondary-700 font-mono text-xs">{p.payslipNumber || `#${p.id}`}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                              {emp.firstName?.charAt(0) || '?'}
                            </div>
                            <span className="font-medium text-secondary-900">{empName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-secondary-700">
                          {p.month ? `${monthName(p.month)} ${p.year}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-secondary-900">
                          {formatINR(p.netPay)}
                        </td>
                        <td className="px-4 py-3 text-center">{statusBadge(p.status)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => viewPayslip(p.id)}
                              className="p-2 hover:bg-primary-50 rounded-lg text-primary-600 transition-colors"
                              title="View Payslip"
                            >
                              <HiOutlineEye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => downloadPDF(p.id)}
                              className="p-2 hover:bg-green-50 rounded-lg text-green-600 transition-colors"
                              title="Download PDF"
                            >
                              <HiOutlineDownload className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Process Payroll Modal */}
        <Modal isOpen={showProcessForm} onClose={() => setShowProcessForm(false)} title="Process Payroll">
          <form onSubmit={handleProcessPayroll} className="space-y-4">
            <div>
              <label className="label">Employee *</label>
              <select
                value={processForm.employeeId}
                onChange={e => setProcessForm({...processForm, employeeId: e.target.value})}
                className="input-field"
                required
              >
                <option value="">Select employee...</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Month</label>
                <select
                  value={processForm.month}
                  onChange={e => setProcessForm({...processForm, month: parseInt(e.target.value)})}
                  className="input-field"
                >
                  {MONTHS.map((m, i) => (
                    <option key={i + 1} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <select
                  value={processForm.year}
                  onChange={e => setProcessForm({...processForm, year: parseInt(e.target.value)})}
                  className="input-field"
                >
                  {Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Payslip Type: Full Month vs Partial Month */}
            <div className="border-t border-gray-200 pt-4">
              <label className="label mb-2">Payslip Period</label>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payslipType"
                    value="full_month"
                    checked={processForm.payslipType === 'full_month'}
                    onChange={e => setProcessForm({...processForm, payslipType: 'full_month', startDate: '', endDate: ''})}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm text-secondary-700">Full Month</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="payslipType"
                    value="partial"
                    checked={processForm.payslipType === 'partial'}
                    onChange={e => setProcessForm({...processForm, payslipType: 'partial'})}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm text-secondary-700">Custom Date Range</span>
                </label>
              </div>
              {processForm.payslipType === 'partial' && (
                <div className="grid grid-cols-2 gap-4 mt-3 animate-fade-in-down">
                  <div>
                    <label className="label">Start Date</label>
                    <input
                      type="date"
                      value={processForm.startDate}
                      onChange={e => setProcessForm({...processForm, startDate: e.target.value})}
                      className="input-field"
                      required={processForm.payslipType === 'partial'}
                    />
                  </div>
                  <div>
                    <label className="label">End Date</label>
                    <input
                      type="date"
                      value={processForm.endDate}
                      onChange={e => setProcessForm({...processForm, endDate: e.target.value})}
                      className="input-field"
                      required={processForm.payslipType === 'partial'}
                    />
                  </div>
                </div>
              )}
              {processForm.payslipType === 'partial' && processForm.startDate && processForm.endDate && (
                <p className="text-xs text-primary-600 mt-2 flex items-center gap-1">
                  <HiOutlineCalendar className="w-3.5 h-3.5" />
                  Salary will be pro-rated based on working days in the selected range
                </p>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-secondary-900 mb-3">Earnings</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Basic Salary *</label>
                  <input
                    type="number"
                    value={processForm.basicSalary}
                    onChange={e => setProcessForm({...processForm, basicSalary: e.target.value})}
                    className="input-field"
                    placeholder="25000"
                    required
                  />
                </div>
                <div>
                  <label className="label">HRA</label>
                  <input
                    type="number"
                    value={processForm.hra}
                    onChange={e => setProcessForm({...processForm, hra: e.target.value})}
                    className="input-field"
                    placeholder="8000"
                  />
                </div>
                <div>
                  <label className="label">Bonus</label>
                  <input
                    type="number"
                    value={processForm.bonus}
                    onChange={e => setProcessForm({...processForm, bonus: e.target.value})}
                    className="input-field"
                    placeholder="2000"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-secondary-900 mb-3">Deductions</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">PF Deduction</label>
                  <input
                    type="number"
                    value={processForm.pfDeduction}
                    onChange={e => setProcessForm({...processForm, pfDeduction: e.target.value})}
                    className="input-field"
                    placeholder="1800"
                  />
                </div>
                <div>
                  <label className="label">TDS</label>
                  <input
                    type="number"
                    value={processForm.taxDeduction}
                    onChange={e => setProcessForm({...processForm, taxDeduction: e.target.value})}
                    className="input-field"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            {/* Summary */}
            {formBasic > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Gross Earnings</span>
                  <span className="font-semibold text-secondary-900">{formatINR(formGross)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-secondary-600">Total Deductions</span>
                  <span className="font-semibold text-danger-600">{formatINR(formDeductions)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold">
                  <span className="text-secondary-900">Net Pay</span>
                  <span className="text-success-600">{formatINR(formNet)}</span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowProcessForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={processing}>
                {processing ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : (
                  'Generate Payslip'
                )}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ── Single Payslip View ──
  return (
    <div>
      {/* Back button */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={closeView} className="flex items-center gap-1.5 text-sm text-secondary-600 hover:text-secondary-900 transition-colors">
          <HiOutlineChevronLeft className="w-4 h-4" />
          Back to Payslips
        </button>
        <div className="flex items-center gap-2 text-sm text-secondary-500">
          <HiOutlineDocumentText className="w-4 h-4 text-primary-500" />
          {selectedPayslip.payslipNumber || `#${selectedPayslip.id}`}
        </div>
      </div>

      {/* Payslip Document */}
      {viewLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-secondary-500">Loading payslip details...</p>
          </div>
        </div>
      ) : (
        <PayslipDocumentView company={company} payslip={selectedPayslip} />
      )}
    </div>
  );
}