import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext'; // Your custom toast system
import { useAuth } from '../context/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// Custom Date Picker Component with Month and Year Selection (Copied from UniAuth.jsx)
const DatePicker = ({ value, onChange, placeholder }) => {
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const datePickerRef = useRef(null);

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(dateObj);
    const day = dateObj.getDate();
    const suffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1:
          return 'st';
        case 2:
          return 'nd';
        case 3:
          return 'rd';
        default:
          return 'th';
      }
    };
    return formattedDate.replace(/(\d+)/, (match, p1) => `${p1}<sup style="font-size: 0.7em;">${suffix(parseInt(p1))}</sup>`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

  const handleMonthChange = (e) => {
    const newMonth = months.indexOf(e.target.value);
    setCurrentMonth((prev) => new Date(prev.getFullYear(), newMonth, 1));
  };

  const handleYearChange = (e) => {
    const newYear = parseInt(e.target.value);
    setCurrentMonth((prev) => new Date(newYear, prev.getMonth(), 1));
  };

  const renderDays = useCallback(() => {
    const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center"></div>);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const day = i;
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = value && date.toDateString() === new Date(value).toDateString();
      const isToday = date.toDateString() === new Date().toDateString();
      days.push(
        <div
          key={day}
          className={`w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center rounded-full cursor-pointer text-xs sm:text-sm
            ${isSelected ? 'bg-[#9B87F5] text-white' : ''}
            ${isToday && !isSelected ? 'border border-[#9B87F5]' : ''}
            hover:bg-[#D3E4FD]`}
          style={{ backgroundColor: isSelected ? '#9B87F5' : '', color: isSelected ? 'white' : '#7182B8' }}
          onClick={() => {
            onChange(date.toISOString().split('T')[0]);
            setShowCalendar(false);
          }}
        >
          {day}
        </div>
      );
    }
    return days;
  }, [currentMonth, value, onChange]);

  return (
    <div className="relative" ref={datePickerRef}>
      <div
        className="mt-1 flex items-center w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-3xl shadow-sm cursor-pointer text-xs sm:text-sm"
        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <svg className="h-4 sm:h-5 w-4 sm:w-5 text-[#9B87F5] mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className={value ? 'text-gray-800' : 'text-gray-400'} dangerouslySetInnerHTML={{ __html: value ? formatDate(value) : placeholder }} />
      </div>
      {showCalendar && (
        <div
          className="absolute z-20 bg-white p-3 sm:p-4 rounded-3xl shadow-lg w-full max-w-[300px] sm:max-w-[340px] max-h-[300px] sm:max-h-[350px] overflow-y-auto"
          style={{
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            bottom: 'calc(100% + 0.5rem)',
            left: 0,
            right: 0,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <div className="flex justify-between items-center mb-3 sm:mb-4 space-x-2">
            <select
              value={months[currentMonth.getMonth()]}
              onChange={handleMonthChange}
              className="text-xs sm:text-sm font-semibold text-[#7182B8] border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-[#9B87F5] focus:border-[#9B87F5]"
            >
              {months.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={currentMonth.getFullYear()}
              onChange={handleYearChange}
              className="text-xs sm:text-sm font-semibold text-[#7182B8] border border-gray-300 rounded-md p-1 focus:outline-none focus:ring-[#9B87F5] focus:border-[#9B87F5]"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-7 text-center text-xs sm:text-sm font-medium text-gray-500 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="w-6 sm:w-8 h-6 sm:h-8 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">{renderDays()}</div>
        </div>
      )}
    </div>
  );
};

const Home = () => {
  const { user, logout, login } = useAuth(); // Moved useAuth to top level
  const navigate = useNavigate();
  const showToast = useToast();

  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    mobile_number: '',
    date_of_birth: '',
    nhs_number: '',
    email: '',
  });
  const [errors, setErrors] = useState({});
  const [activityLogs, setActivityLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    if (user) {
      // Initialize form data
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        mobile_number: user.mobile_number || '',
        date_of_birth: user.date_of_birth || '',
        nhs_number: user.nhs_number || '',
        email: user.email || '',
      });
      fetchActivityLogs();
    }
  }, [user]);

  const fetchActivityLogs = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/activity-logs/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error('Failed to fetch activity logs');
      }
      setActivityLogs(data);
      if (data.length > 0) {
        setSelectedLog(data[0]); // Default to the first log
      }
    } catch (error) {
      showToast('Failed to fetch activity logs.', 'error');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    } else if (!/^[A-Za-z\s-]+$/.test(formData.first_name)) {
      newErrors.first_name = 'First name must contain only letters, spaces, or hyphens';
    }

    // Last Name validation
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    } else if (!/^[A-Za-z\s-]+$/.test(formData.last_name)) {
      newErrors.last_name = 'Last name must contain only letters, spaces, or hyphens';
    }

    // Mobile Number validation
    const phoneRegex = /^\+\d{1,3}\d{3,14}$/;
    if (!formData.mobile_number.trim()) {
      newErrors.mobile_number = 'Mobile number is required';
    } else if (!phoneRegex.test(formData.mobile_number)) {
      newErrors.mobile_number = 'Invalid mobile number format';
    }

    // Date of Birth validation
    if (!formData.date_of_birth) {
      newErrors.date_of_birth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.date_of_birth);
      const today = new Date('2025-05-26');
      const ageDiff = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      const dayDiff = today.getDate() - dob.getDate();

      let age = ageDiff;
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      if (age < 13) {
        newErrors.date_of_birth = 'You must be at least 13 years old';
      }
    }

    // NHS Number validation
    if (formData.nhs_number && formData.nhs_number.length > 10) {
      newErrors.nhs_number = 'NHS number must be 10 characters or fewer';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (phone) => {
    setFormData((prev) => ({ ...prev, mobile_number: `+${phone}` }));
    setErrors((prev) => ({ ...prev, mobile_number: '' }));
  };

  const handleLogoutClick = () => {
    setShowLogoutPopup(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutPopup(false);
    try {
      await logout();
      showToast('You have been logged out successfully.', 'info');
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 1500);
    } catch (err) {
      showToast('Logout successful, but failed to notify server.', 'info');
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 1500);
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutPopup(false);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setErrors({});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrors({});
    setFormData({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      mobile_number: user.mobile_number || '',
      date_of_birth: user.date_of_birth || '',
      nhs_number: user.nhs_number || '',
      email: user.email || '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleNhsNumberChange = (e) => {
    const { name, value } = e.target;
    const digitsOnly = value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, [name]: digitsOnly }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form.', 'error');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/update-profile/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      showToast('Updated!', 'success');
      setIsEditing(false);
      setErrors({});
      // Call login to refresh user data
      login({
        access: localStorage.getItem('access_token'),
        refresh: localStorage.getItem('refresh_token'),
      });
      fetchActivityLogs();
    } catch (error) {
      showToast(error.message || 'Failed to update profile.', 'error');
    }
  };

  // Helper to format date for display in profile view
  const formatDateForDisplay = (date) => {
    if (!date) return 'Not provided';
    const dateObj = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(dateObj);
    const day = dateObj.getDate();
    const suffix = (day) => {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1:
          return 'st';
        case 2:
          return 'nd';
        case 3:
          return 'rd';
        default:
          return 'th';
      }
    };
    return formattedDate.replace(/\d+/, (match) => `${match}${suffix(parseInt(match))}`);
  };

  // Helper to format activity log for dropdown
  const formatLogForDropdown = (log) => {
    return `${log.action.replace('_', ' ').toUpperCase()} - ${new Date(log.timestamp).toLocaleString()}`;
  };

  if (!user) {
    return <div className="text-[#7182B8] text-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: '#F1F0FB', fontFamily: 'Inter, sans-serif' }}>
      <style>
        {`
          .react-tel-input .form-control {
            width: 100% !important;
            padding-top: 0.25rem !important;
            padding-bottom: 0.25rem !important;
            border-radius: 1.5rem !important;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
            border-color: #D1D5DB !important;
            padding-left: 3rem !important;
            font-size: 0.75rem !important;
            transition: all 0.3s !important;
          }
          .react-tel-input .form-control:focus {
            outline: none !important;
            box-shadow: 0 0 0 2px #9B87F5 !important;
            border-color: #9B87F5 !important;
          }
          .react-tel-input .form-control.invalid {
            border-color: #ef4444 !important;
          }
          .react-tel-input .flag-dropdown {
            border-radius: 1.5rem 0 0 1.5rem !important;
            border-color: #D1D5DB !important;
            background-color: #F9FAFB !important;
          }
          .react-tel-input .selected-flag {
            border-radius: 1.5rem 0 0 1.5rem !important;
          }
          .react-tel-input .country-list {
            border-radius: 1.5rem !important;
            box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
            max-height: 200px !important;
            overflow-y: auto !important;
          }
          .activity-log-select {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background: url("data:image/svg+xml;utf8,<svg fill='%239B87F5' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/><path d='M0 0h24v24H0z' fill='none'/></svg>") no-repeat right 0.75rem center/16px 16px;
          }
          .activity-log-details {
            max-height: 200px;
            overflow-y: auto;
          }
          .activity-log-details p {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.5rem 1rem;
            border-bottom: 1px solid rgba(113, 130, 184, 0.2);
          }
          .activity-log-details p:last-child {
            border-bottom: none;
          }
          .activity-log-details strong {
            flex: 0 0 30%;
            color: #2A416F;
          }
          .activity-log-details span {
            flex: 1;
            text-align: right;
            color: #7182B8;
          }
        `}
      </style>
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg w-full max-w-md relative z-10" style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}>
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-center" style={{ color: '#7182B8' }}>
          Welcome, {user.first_name}!
        </h1>

        {isEditing ? (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-4 text-center" style={{ color: '#7182B8' }}>
              Edit Your Profile
            </h2>
            <p className="text-gray-600 mb-4 sm:mb-6 text-center text-sm sm:text-base">
              Update your personal details below.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="mb-4">
                <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  className="mt-1 block w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 bg-gray-50 rounded-3xl shadow-sm text-xs sm:text-sm"
                  style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">This field cannot be changed.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
                <div>
                  <label htmlFor="first_name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-2 sm:px-3 py-1 sm:py-2 border rounded-3xl shadow-sm focus:outline-none focus:ring-[#9B87F5] focus:border-[#9B87F5] text-xs sm:text-sm ${
                      errors.first_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  />
                  {errors.first_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className={`mt-1 block w-full px-2 sm:px-3 py-1 sm:py-2 border rounded-3xl shadow-sm focus:outline-none focus:ring-[#9B87F5] focus:border-[#9B87F5] text-xs sm:text-sm ${
                      errors.last_name ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  />
                  {errors.last_name && (
                    <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>
                  )}
                </div>
              </div>
              <div className="mb-4">
        <label htmlFor="mobileNumber" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
          Mobile Number *
        </label>
        <PhoneInput
          country={'gb'}
          value={formData.mobile_number}
          onChange={handlePhoneChange}
          inputStyle={{
            width: '100%',
            paddingTop: '0.25rem',
            paddingBottom: '0.25rem',
            borderRadius: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderColor: '#D1D5DB',
            paddingLeft: '3rem',
            fontSize: '0.75rem',
          }}
          containerStyle={{
            borderRadius: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
          buttonStyle={{
            borderRadius: '1.5rem 0 0 1.5rem',
            borderColor: '#D1D5DB',
            backgroundColor: '#F9FAFB',
          }}
          dropdownStyle={{
            borderRadius: '1.5rem',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
          enableSearch={true}
          disableDropdown={false}
          placeholder="e.g., 7123456789"
          disableCountryCode={false}
          disableCountryGuess={false}
          countryCodeEditable={false}
        />
      </div>
              <div className="mb-4 sm:mb-6">
                <label htmlFor="date_of_birth" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Date of Birth *
                </label>
                <DatePicker
                  value={formData.date_of_birth}
                  onChange={(date) => setFormData((prev) => ({ ...prev, date_of_birth: date }))}
                  placeholder="Pick a date"
                />
                {errors.date_of_birth && (
                  <p className="text-xs text-red-500 mt-1">{errors.date_of_birth}</p>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="nhs_number" className="block text-xs sm:text-sm font-medium text-gray mockingbird-700 mb-1">
                  NHS Number (Optional)
                </label>
                <input
                  type="text"
                  id="nhs_number"
                  name="nhs_number"
                  value={formData.nhs_number}
                  onChange={handleNhsNumberChange}
                  maxLength={10}
                  className={`mt-1 block w-full px-2 sm:px-3 py-1 sm:py-2 border rounded-3xl shadow-sm focus:outline-none focus:ring-[#9B87F5] focus:border-[#9B87F5] text-xs sm:text-sm ${
                    errors.nhs_number ? 'border-red-500' : 'border-gray-300'
                  }`}
                  style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                  placeholder="e.g. 1234567890"
                />
                <p className="text-xs text-gray-500 mt-1">Your 10-digit NHS number can be found on your prescriptions or medical letters.</p>
                {errors.nhs_number && (
                  <p className="text-xs text-red-500 mt-1">{errors.nhs_number}</p>
                )}
              </div>
              <div className="flex justify-between mt-4 sm:mt-6">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="py-1 sm:py-2 px-3 sm:px-4 border border-[#9B87F5] rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-[#9B87F5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9B87F5] transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:border-[#B0A1F8] hover:text-[#B0A1F8]"
                  style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-1 sm:py-2 px-3 sm:px-4 border border-transparent rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9B87F5] transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:bg-[#8A76E0]"
                  style={{ backgroundColor: '#9B87F5', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-[#F1F0FB] p-4 rounded-lg">
              <p className="text-[#7182B8] text-sm sm:text-base">
                <strong>Email:</strong> {user.email}
              </p>
              <p className="text-[#7182B8] text-sm sm:text-base">
                <strong>First Name:</strong> {user.first_name}
              </p>
              <p className="text-[#7182B8] text-sm sm:text-base">
                <strong>Last Name:</strong> {user.last_name}
              </p>
              <p className="text-[#7182B8] text-sm sm:text-base">
                <strong>Mobile Number:</strong> {user.mobile_number}
              </p>
              <p className="text-[#7182B8] text-sm sm:text-base">
                <strong>Date of Birth:</strong> {formatDateForDisplay(user.date_of_birth)}
              </p>
              <p className="text-[#7182B8] text-sm sm:text-base">
                <strong>NHS Number:</strong> {user.nhs_number || 'Not provided'}
              </p>
            </div>
            <div className="flex justify-between">
              <button
                onClick={handleEditClick}
                className="py-1 sm:py-2 px-3 sm:px-4 border border-transparent rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9B87F5] transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:bg-[#8A76E0]"
                style={{ backgroundColor: '#9B87F5', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              >
                Edit Profile
              </button>
              <button
                onClick={handleLogoutClick}
                className="py-1 sm:py-2 px-3 sm:px-4 border border-[#2A416F] rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-[#2A416F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2A416F] transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:border-[#1E2F4D] hover:text-[#1E2F4D]"
                style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              >
                Logout
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 sm:mt-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center" style={{ color: '#7182B8' }}>
            Activity Logs
          </h2>
          {activityLogs.length > 0 ? (
            <div className="space-y-3">
              <div className="relative">
                <select
                  value={selectedLog ? formatLogForDropdown(selectedLog) : ''}
                  onChange={(e) => {
                    const logIndex = activityLogs.findIndex(
                      (log) => formatLogForDropdown(log) === e.target.value
                    );
                    setSelectedLog(activityLogs[logIndex]);
                  }}
                  className="activity-log-select mt-1 block w-full px-2 sm:px-3 py-1 sm:py-2 border border-gray-300 rounded-3xl shadow-sm focus:outline-none focus:ring-[#9B87F5] focus:border-[#9B87F5] text-xs sm:text-sm text-gray-800"
                  style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
                >
                  {activityLogs.map((log, index) => (
                    <option key={index} value={formatLogForDropdown(log)}>
                      {formatLogForDropdown(log)}
                    </option>
                  ))}
                </select>
              </div>
              {selectedLog && (
                <div className="activity-log-details bg-[#F1F0FB] p-4 rounded-lg text-sm sm:text-base">
                  <p>
                    <strong>Action</strong>
                    <span>{selectedLog.action.replace('_', ' ').toUpperCase()}</span>
                  </p>
                  <p>
                    <strong>Time</strong>
                    <span>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                  </p>
                  {selectedLog.ip_address && (
                    <p>
                      <strong>IP</strong>
                      <span>{selectedLog.ip_address}</span>
                    </p>
                  )}
                  {selectedLog.details && (
                    <p>
                      <strong>Details</strong>
                      <span>{selectedLog.details}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-[#7182B8] text-sm sm:text-base text-center">No activity logs available.</p>
          )}
        </div>

        {showLogoutPopup && (
          <div className="fixed inset-0 bg-white/10 backdrop-blur-sm bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg w-full max-w-sm" style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}>
              <h2 className="text-xl sm:text-2xl font-bold mb-4 text-center" style={{ color: '#7182B8' }}>
                Confirm Logout
              </h2>
              <p className="text-gray-600 mb-6 text-center text-sm sm:text-base">
                Are you sure?
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleCancelLogout}
                  className="py-1 sm:py-2 px-3 sm:px-4 border border-[#9B87F5] rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-[#9B87F5] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9B87F5] transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:border-[#B0A1F8] hover:text-[#B0A1F8]"
                  style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutConfirm}
                  className="py-1 sm:py-2 px-3 sm:px-4 border border-transparent rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#9B87F5] transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-lg hover:bg-[#8A76E0]"
                  style={{ backgroundColor: '#9B87F5', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;