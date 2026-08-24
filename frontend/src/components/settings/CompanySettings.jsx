import { useState, useEffect, useRef } from 'react';
import { companyAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding,
  HiOutlineSave,
  HiOutlinePhotograph,
  HiOutlineGlobe,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineCurrencyDollar,
  HiOutlineIdentification,
} from 'react-icons/hi';

export default function CompanySettings() {
  const { isAdmin } = useAuth();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    defaultCurrency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timezone: 'UTC',
  });
  const fileInputRef = useRef(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const fetchCompany = async () => {
    try {
      const res = await companyAPI.get();
      const data = res.data.data;
      setCompany(data);
      setForm({
        companyName: data.companyName || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        taxId: data.taxId || '',
        defaultCurrency: data.defaultCurrency || 'USD',
        dateFormat: data.dateFormat || 'MM/DD/YYYY',
        timezone: data.timezone || 'UTC',
      });
      if (data.logo) {
        setLogoPreview(data.logo);
      }
    } catch {
      toast.error('Failed to load company settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompany(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.companyName.trim()) {
      toast.error('Company name is required');
      return;
    }
    setSaving(true);
    try {
      await companyAPI.update(form);
      toast.success('Company information saved');
      fetchCompany();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await companyAPI.uploadLogo(formData);
      setLogoPreview(res.data.data.logo);
      toast.success('Logo uploaded successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload logo');
    }
  };

  if (loading) {
    return (
      <div className="card p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-10 bg-gray-200 rounded w-32" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <HiOutlineOfficeBuilding className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-secondary-900">Company Information</h2>
          <p className="text-sm text-secondary-500">Manage your organization details and branding</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-lg">
          <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoPreview ? (
              <img src={logoPreview} alt="Company logo" className="w-full h-full object-contain p-1" />
            ) : (
              <HiOutlineOfficeBuilding className="w-8 h-8 text-gray-300" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-secondary-900">Company Logo</p>
            <p className="text-xs text-secondary-500 mb-2">Upload your company logo (JPEG, PNG, GIF, SVG - max 2MB)</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary btn-sm"
            >
              <HiOutlinePhotograph className="w-4 h-4 mr-1.5" />
              {logoPreview ? 'Change Logo' : 'Upload Logo'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Company Name *</label>
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="input-field"
              placeholder="Enter company name"
              required
            />
          </div>
          <div className="col-span-2">
            <label className="label">
              <HiOutlineLocationMarker className="w-4 h-4 inline mr-1" />
              Address
            </label>
            <textarea
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="City, State, ZIP"
            />
          </div>
          <div>
            <label className="label">
              <HiOutlinePhone className="w-4 h-4 inline mr-1" />
              Phone
            </label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field"
              placeholder="+91 99XXXXXXXX"
            />
          </div>
          <div>
            <label className="label">
              <HiOutlineMail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-field"
              placeholder="info@company.com"
              type="email"
            />
          </div>
          <div>
            <label className="label">
              <HiOutlineGlobe className="w-4 h-4 inline mr-1" />
              Website
            </label>
            <input
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
              className="input-field"
              placeholder="https://www.company.com"
            />
          </div>
          <div>
            <label className="label">
              <HiOutlineIdentification className="w-4 h-4 inline mr-1" />
              Tax ID / Registration
            </label>
            <input
              value={form.taxId}
              onChange={(e) => setForm({ ...form, taxId: e.target.value })}
              className="input-field"
              placeholder="Tax ID or registration number"
            />
          </div>
          <div>
            <label className="label">
              <HiOutlineCurrencyDollar className="w-4 h-4 inline mr-1" />
              Default Currency
            </label>
            <select
              value={form.defaultCurrency}
              onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
              className="input-field"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="CHF">CHF (Fr)</option>
              <option value="CNY">CNY (¥)</option>
              <option value="NZD">NZD (NZ$)</option>
            </select>
          </div>
          <div>
            <label className="label">Date Format</label>
            <select
              value={form.dateFormat}
              onChange={(e) => setForm({ ...form, dateFormat: e.target.value })}
              className="input-field"
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD Month YYYY">DD Month YYYY</option>
            </select>
          </div>
          <div>
            <label className="label">Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="input-field"
            >
              <option value="UTC">UTC</option>
              <option value="US/Eastern">US/Eastern</option>
              <option value="US/Central">US/Central</option>
              <option value="US/Mountain">US/Mountain</option>
              <option value="US/Pacific">US/Pacific</option>
              <option value="Europe/London">Europe/London</option>
              <option value="Europe/Berlin">Europe/Berlin</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="Asia/Singapore">Asia/Singapore</option>
              <option value="Asia/Tokyo">Asia/Tokyo</option>
              <option value="Australia/Sydney">Australia/Sydney</option>
            </select>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button type="submit" disabled={saving} className="btn-primary">
              <HiOutlineSave className="w-4 h-4 mr-1.5" />
              {saving ? 'Saving...' : 'Save Company Info'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
