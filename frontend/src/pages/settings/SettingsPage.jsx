import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { employeeAPI, notificationAPI } from '../../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUser,
  HiOutlineShieldCheck,
  HiOutlineMail,
  HiOutlineSave,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineBadgeCheck,
  HiOutlineOfficeBuilding,
  HiOutlinePhotograph,
  HiOutlineCamera,
} from 'react-icons/hi';

import CompanySettings from '../../components/settings/CompanySettings';

// ── Toggle Switch for Notification Preferences ──
function PreferenceToggle({ label, description, enabled, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100/70 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-secondary-900">{label}</p>
        <p className="text-xs text-secondary-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0 ml-4 ${
          enabled ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { user, employee, changePassword, isAdmin, loadUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    phone: '',
    address: '',
  });

  // Password form
  const [passForm, setPassForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification preferences
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    leaveApprovalAlerts: true,
    taskReminders: true
  });
  const [originalPrefs, setOriginalPrefs] = useState(null);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const preferencesChanged = originalPrefs !== null && (
    prefs.emailNotifications !== originalPrefs.emailNotifications ||
    prefs.leaveApprovalAlerts !== originalPrefs.leaveApprovalAlerts ||
    prefs.taskReminders !== originalPrefs.taskReminders
  );

  useEffect(() => {
    if (employee) {
      setProfileForm({
        phone: employee.phone || '',
        address: employee.address || '',
      });
    }
  }, [employee]);

  // Fetch notification preferences when user changes
  useEffect(() => {
    if (user?.id) {
      fetchPreferences();
    }
  }, [user?.id]);

  const fetchPreferences = async () => {
    setPreferencesLoading(true);
    try {
      const res = await notificationAPI.getPreferences();
      const data = res.data.data;
      setPrefs({
        emailNotifications: data.emailNotifications !== undefined ? data.emailNotifications : true,
        leaveApprovalAlerts: data.leaveApprovalAlerts !== undefined ? data.leaveApprovalAlerts : true,
        taskReminders: data.taskReminders !== undefined ? data.taskReminders : true,
      });
      setOriginalPrefs({ ...data });
    } catch {
      // Defaults if API fails
      const defaults = { emailNotifications: true, leaveApprovalAlerts: true, taskReminders: true };
      setPrefs(defaults);
      setOriginalPrefs({ ...defaults });
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handlePrefChange = (key, value) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      await notificationAPI.updatePreferences(prefs);
      toast.success('Preferences saved');
      setOriginalPrefs({ ...prefs });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleResetPreferences = () => {
    if (originalPrefs) {
      setPrefs({ ...originalPrefs });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!employee?.id) {
      toast.error('Employee data not available');
      return;
    }
    setSaving(true);
    try {
      await employeeAPI.updateSelf(profileForm);
      toast.success('Profile updated successfully');
      loadUser();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passForm.currentPassword || !passForm.newPassword || !passForm.confirmPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (passForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await changePassword(passForm.currentPassword, passForm.newPassword);
      toast.success('Password changed successfully');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: HiOutlineUser },
    { id: 'security', label: 'Security', icon: HiOutlineShieldCheck },
    { id: 'account', label: 'Account', icon: HiOutlineBadgeCheck },
    ...(isAdmin ? [{ id: 'company', label: 'Company', icon: HiOutlineOfficeBuilding }] : []),
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your account and preferences</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="w-full lg:w-56 flex-shrink-0">
          <div className="card p-2 space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-secondary-600 hover:bg-gray-50 hover:text-secondary-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1">
          {/* Profile Tab */}
          {activeTab === 'profile' && (              <div className="card p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative group">
                  <div className="w-20 h-20 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-2xl font-bold overflow-hidden">
                    {employee?.profilePhoto ? (
                      <img src={employee.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <>{employee?.firstName?.charAt(0)}{employee?.lastName?.charAt(0)}</>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Change photo"
                  >
                    <HiOutlineCamera className="w-6 h-6 text-white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      setUploadingPhoto(true);
                      try {
                        const formData = new FormData();
                        formData.append('profilePhoto', file);
                        await employeeAPI.uploadProfilePhoto(formData);
                        toast.success('Profile photo updated');
                        loadUser();
                      } catch (err) {
                        toast.error(err.response?.data?.message || 'Failed to upload photo');
                      } finally {
                        setUploadingPhoto(false);
                      }
                    }}
                  />
                  {uploadingPhoto && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-secondary-900">
                    {employee?.firstName} {employee?.lastName}
                  </h2>
                  <p className="text-sm text-secondary-500">
                    {employee?.designation?.title || 'No designation'}
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-primary-600 hover:text-primary-700 mt-1 font-medium"
                  >
                    <HiOutlinePhotograph className="w-3.5 h-3.5 inline mr-1" />
                    Change photo
                  </button>
                </div>
              </div>

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      value={employee?.firstName || ''}
                      className="input-field bg-gray-50"
                      disabled
                    />
                    <p className="text-xs text-secondary-400 mt-1">
                      Contact admin to change your name
                    </p>
                  </div>
                  <div>
                    <label className="label">Last Name</label>
                    <input
                      value={employee?.lastName || ''}
                      className="input-field bg-gray-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="label">
                      <HiOutlineMail className="w-4 h-4 inline mr-1" />
                      Email
                    </label>
                    <input
                      value={employee?.email || user?.email || ''}
                      className="input-field bg-gray-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="label">Employee ID</label>
                    <input
                      value={employee?.employeeId || '-'}
                      className="input-field bg-gray-50"
                      disabled
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      value={profileForm.phone}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, phone: e.target.value })
                      }
                      className="input-field"
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <input
                      value={employee?.department?.name || '-'}
                      className="input-field bg-gray-50"
                      disabled
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Address</label>
                  <textarea
                    value={profileForm.address}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, address: e.target.value })
                    }
                    className="input-field"
                    rows={3}
                    placeholder="Enter your address"
                  />
                </div>
                <div className="flex items-center gap-3 pt-2 border-t">
                  <button type="submit" disabled={saving} className="btn-primary">
                    <HiOutlineSave className="w-4 h-4 mr-1.5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-1">
                  Change Password
                </h2>
                <p className="text-sm text-secondary-500 mb-6">
                  Update your password to keep your account secure
                </p>

                <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
                  <div>
                    <label className="label">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passForm.currentPassword}
                        onChange={(e) =>
                          setPassForm({ ...passForm, currentPassword: e.target.value })
                        }
                        className="input-field pr-10"
                        placeholder="Enter current password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            current: !prev.current,
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.current ? (
                          <HiOutlineEyeOff className="w-5 h-5" />
                        ) : (
                          <HiOutlineEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passForm.newPassword}
                        onChange={(e) =>
                          setPassForm({ ...passForm, newPassword: e.target.value })
                        }
                        className="input-field pr-10"
                        placeholder="Min. 6 characters"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            new: !prev.new,
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.new ? (
                          <HiOutlineEyeOff className="w-5 h-5" />
                        ) : (
                          <HiOutlineEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="label">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passForm.confirmPassword}
                        onChange={(e) =>
                          setPassForm({ ...passForm, confirmPassword: e.target.value })
                        }
                        className="input-field pr-10"
                        placeholder="Repeat new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowPasswords((prev) => ({
                            ...prev,
                            confirm: !prev.confirm,
                          }))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPasswords.confirm ? (
                          <HiOutlineEyeOff className="w-5 h-5" />
                        ) : (
                          <HiOutlineEye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary"
                    >
                      <HiOutlineLockClosed className="w-4 h-4 mr-1.5" />
                      {saving ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-1">
                  Session
                </h2>
                <p className="text-sm text-secondary-500 mb-4">
                  You are logged in as{' '}
                  <span className="font-medium text-secondary-700">
                    {user?.email}
                  </span>{' '}
                  with{' '}
                  <span className="badge badge-info capitalize">
                    {user?.role?.replace('_', ' ')}
                  </span>{' '}
                  role
                </p>
                <p className="text-xs text-secondary-400">
                  Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Company Tab */}
          {activeTab === 'company' && isAdmin && <CompanySettings />}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-1">
                  Account Information
                </h2>
                <p className="text-sm text-secondary-500 mb-6">
                  Your account details and preferences
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="card-hover p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <HiOutlineUser className="w-5 h-5 text-primary-600" />
                      <span className="font-medium">Username</span>
                    </div>
                    <p className="text-secondary-900">{user?.username || '-'}</p>
                  </div>
                  <div className="card-hover p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <HiOutlineMail className="w-5 h-5 text-primary-600" />
                      <span className="font-medium">Email</span>
                    </div>
                    <p className="text-secondary-900">{user?.email || '-'}</p>
                  </div>
                  <div className="card-hover p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <HiOutlineShieldCheck className="w-5 h-5 text-primary-600" />
                      <span className="font-medium">Role</span>
                    </div>
                    <p className="text-secondary-900 capitalize">
                      {user?.role?.replace('_', ' ') || '-'}
                    </p>
                  </div>
                  <div className="card-hover p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <HiOutlineBadgeCheck className="w-5 h-5 text-primary-600" />
                      <span className="font-medium">Account Status</span>
                    </div>
                    <span className="badge badge-success">
                      {user?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-lg font-semibold text-secondary-900 mb-1">
                  Preferences
                </h2>
                <p className="text-sm text-secondary-500 mb-4">
                  Control which email notifications you receive
                </p>

                {preferencesLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <PreferenceToggle
                      label="Email Notifications"
                      description="Receive email notifications for important updates"
                      enabled={prefs.emailNotifications}
                      onChange={(v) => handlePrefChange('emailNotifications', v)}
                    />
                    <PreferenceToggle
                      label="Leave Approval Alerts"
                      description="Get notified when leave requests are approved or rejected"
                      enabled={prefs.leaveApprovalAlerts}
                      onChange={(v) => handlePrefChange('leaveApprovalAlerts', v)}
                    />
                    <PreferenceToggle
                      label="Task Reminders"
                      description="Receive reminders for upcoming task deadlines"
                      enabled={prefs.taskReminders}
                      onChange={(v) => handlePrefChange('taskReminders', v)}
                    />

                    {preferencesChanged && (
                      <div className="flex items-center gap-3 pt-4 animate-fade-in-up">
                        <button
                          onClick={handleSavePreferences}
                          disabled={savingPrefs}
                          className="btn-primary"
                        >
                          <HiOutlineSave className="w-4 h-4 mr-1.5" />
                          {savingPrefs ? 'Saving...' : 'Save Preferences'}
                        </button>
                        <button
                          onClick={handleResetPreferences}
                          className="btn-secondary"
                        >
                          Reset
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
