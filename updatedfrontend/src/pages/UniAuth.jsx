import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import axios from 'axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

// Configure Axios instance without interceptors (handled by AuthContext)
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL + '/api/auth/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Custom Date Picker Component with Month and Year Selection
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
            ${isSelected ? 'bg-[#966B9D] text-white' : ''}
            ${isToday && !isSelected ? 'border border-[#966B9D]' : ''}
            hover:bg-[#CBB8D9]`}
          style={{ backgroundColor: isSelected ? '#966B9D' : '', color: isSelected ? 'white' : '#6D4C73' }}
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
        className="mt-1 flex items-center w-full px-3 sm:px-4 py-2 sm:py-3 border bg-[#EDE7F1] border-[#CBB8D9] rounded-3xl shadow-sm cursor-pointer text-xs sm:text-sm"
        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        onClick={() => setShowCalendar(!showCalendar)}
      >
        <svg className="h-4 sm:h-5 w-4 sm:w-5 text-[#966B9D] mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className={value ? 'text-gray-800' : 'text-[#A789AE]'} dangerouslySetInnerHTML={{ __html: value ? formatDate(value) : placeholder }} />
      </div>
      {showCalendar && (
        <div
          className="absolute z-20 bg-white p-3 sm:p-4 rounded-3xl shadow-lg w-full max-w-[300px] sm:max-w-[340px] max-h-[300px] sm:max-h-[350px] overflow-y-auto border border-[#CBB8D9]"
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
              className="text-xs sm:text-sm font-semibold text-[#6D4C73] border border-[#CBB8D9] rounded-md p-1 focus:outline-none focus:ring-[#A789AE] focus:border-[#A789AE]"
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
              className="text-xs sm:text-sm font-semibold text-[#6D4C73] border border-[#CBB8D9] rounded-md p-1 focus:outline-none focus:ring-[#A789AE] focus:border-[#A789AE]"
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

function UniAuth() {
  const { login, isAuthenticated } = useAuth();
  const showToast = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    mobileNumber: '',
    dateOfBirth: '',
    otp: ['', '', '', '', '', ''],
    nhsNumber: '',
    nhsConsent: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [isRegisteredUser, setIsRegisteredUser] = useState(false);
  const otpInputRefs = useRef([]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleOtpChange = (e, index) => {
    const { value } = e.target;
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...formData.otp];
    newOtp[index] = value;
    setFormData((prevData) => ({ ...prevData, otp: newOtp }));
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (!value && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: checked }));
  };

  const checkEmail = async () => {
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('check-email/', { email: formData.email });
      setIsLoading(false);
      if (response.data.exists) {
        setIsRegisteredUser(true);
        await sendOTP();
        setCurrentStep(2);
      } else {
        setIsRegisteredUser(false);
        setCurrentStep(1);
      }
    } catch (error) {
      setIsLoading(false);
      showToast('Error checking email.', 'error');
    }
  };

  const sendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await api.post('send-otp/', { email: formData.email });
      setIsLoading(false);
      setOtpCountdown(60);
      showToast(response.data.message, 'info');
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error.response?.data?.error || 'Failed to send OTP. Please try again or contact support.';
      showToast(errorMessage, 'error');
    }
  };

  const verifyOTP = async () => {
    if (formData.otp.some((digit) => !digit) || formData.otp.join('').length !== 6) {
      showToast('Please enter the complete 6-digit code.', 'error');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('verify-otp/', {
        email: formData.email,
        otp: formData.otp.join(''),
      });
      setIsLoading(false);
      if (response.data.exists) {
        login({ access: response.data.access, refresh: response.data.refresh });
        showToast('Login successful!', 'success');
        navigate('/home', { replace: true });
      } else {
        setCurrentStep(3);
      }
    } catch (error) {
      setIsLoading(false);
      showToast(error.response?.data?.error || 'Invalid OTP.', 'error');
    }
  };

  const registerUser = async (skipNhs = false) => {
    if (!skipNhs) {
      if (formData.nhsNumber && formData.nhsNumber.length !== 10) {
        showToast('NHS Number must be 10 digits long.', 'error');
        return false;
      }
      if (!formData.nhsConsent) {
        showToast('You must consent to complete your profile.', 'error');
        return false;
      }
    }
    setIsLoading(true);
    try {
      const response = await api.post('register/', {
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        mobile_number: formData.mobileNumber,
        date_of_birth: formData.dateOfBirth,
        nhs_number: skipNhs ? '' : formData.nhsNumber,
        nhs_consent: skipNhs ? false : formData.nhsConsent,
      });
      setIsLoading(false);
      login({ access: response.data.access, refresh: response.data.refresh });
      showToast('Profile creation complete!', 'success');
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        mobileNumber: '',
        dateOfBirth: '',
        otp: ['', '', '', '', '', ''],
        nhsNumber: '',
        nhsConsent: false,
      });
      setCurrentStep(0);
      navigate('/home', { replace: true });
      return true;
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error.response?.data?.mobile_number?.[0] || error.response?.data?.error || 'Registration failed.';
      showToast(errorMessage, 'error');
      return false;
    }
  };

  const nextStep = () => {
    switch (currentStep) {
      case 0:
        checkEmail();
        break;
      case 1:
        if (!formData.firstName) {
          showToast('First Name is required.', 'error');
          return;
        }
        if (!formData.lastName) {
          showToast('Last Name is required.', 'error');
          return;
        }
        if (!formData.mobileNumber) {
          showToast('Mobile Number is required.', 'error');
          return;
        }
        if (!formData.dateOfBirth) {
          showToast('Date of Birth is required.', 'error');
          return;
        }
        sendOTP();
        showToast('Profile details submitted. OTP sent!', 'success');
        setCurrentStep(2);
        break;
      case 2:
        verifyOTP();
        break;
      case 3:
        break;
      default:
        setCurrentStep(currentStep + 1);
        break;
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      if (currentStep === 2 && isRegisteredUser) {
        setCurrentStep(0);
      } else if (currentStep === 3 && !isRegisteredUser) {
        setCurrentStep(2);
      } else {
        setCurrentStep(currentStep - 1);
      }
    }
  };

  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => {
        setOtpCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeEmailStep formData={formData} handleChange={handleChange} nextStep={nextStep} isLoading={isLoading} />;
      case 1:
        return (
          <CompleteProfileStep
            formData={formData}
            handleChange={handleChange}
            setFormData={setFormData}
            nextStep={nextStep}
            prevStep={prevStep}
            showToast={showToast}
          />
        );
      case 2:
        return (
          <VerifyEmailStep
            formData={formData}
            handleOtpChange={handleOtpChange}
            otpInputRefs={otpInputRefs}
            nextStep={nextStep}
            prevStep={prevStep}
            isLoading={isLoading}
            otpCountdown={otpCountdown}
            setOtpCountdown={setOtpCountdown}
            showToast={showToast}
          />
        );
      case 3:
        return (
          <NHSInformationStep
            formData={formData}
            handleChange={handleChange}
            handleCheckboxChange={handleCheckboxChange}
            nextStep={nextStep}
            prevStep={prevStep}
            isLoading={isLoading}
            setCurrentStep={setCurrentStep}
            setFormData={setFormData}
            showToast={showToast}
            registerUser={registerUser}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ backgroundColor: '#D7C6E6', fontFamily: 'Inter, sans-serif' }}>
      <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-lg w-full max-w-md relative z-10 border border-[#CBB8D9]" style={{ boxShadow: '0 10px 20px rgba(0,0,0,0.15)' }}>
        {renderStep()}
      </div>
    </div>
  );
}

const WelcomeEmailStep = ({ formData, handleChange, nextStep, isLoading }) => (
  <>
    <div className="flex justify-center items-center px-4 sm:px-6 py-3 sm:py-4">
      <a className="flex items-center space-x-2">
        <img 
          src="/logo.png" 
          alt="MindKonnect Logo" 
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full"
        />
        <h1
          className="text-lg sm:text-xl font-bold text-center"
          style={{ fontFamily: "kommissar" }}
        >
          <span className="text-[#6D4C73] font-extrabold">MINDKONNECT</span>
        </h1>
      </a>
    </div>
    <h2 className="text-xl sm:text-2xl font-extrabold mb-4 sm:mb-6 text-center text-gray-800">
      Welcome to MindKonnect
    </h2>
    <p className="text-[#6D4C73] mb-4 sm:mb-6 text-center text-sm sm:text-base">
      Enter your email to get started
    </p>
    <div className="mb-4">
      <label htmlFor="email" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
        Email
      </label>
      <input
        type="email"
        id="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        placeholder="your@domain.com"
        className="mt-1 block w-full px-3 sm:px-4 py-2 sm:py-3 border bg-[#EDE7F1] border-[#CBB8D9] rounded-3xl shadow-sm focus:outline-none focus:ring-[#A789AE] focus:border-[#A789AE] text-xs sm:text-sm placeholder-[#A789AE]"
        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
      />
    </div>
    <button
      onClick={nextStep}
      disabled={isLoading}
      className={`w-full py-2 sm:py-3 px-4 sm:px-5 border border-transparent rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A789AE] transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg
        ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        background: 'linear-gradient(135deg, #966B9D 0%, #8A5F8F 100%)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      }}
    >
      {isLoading ? 'Please wait...' : 'Continue'}
    </button>
  </>
);

const CompleteProfileStep = ({ formData, handleChange, setFormData, nextStep, prevStep, showToast }) => {
  const handlePhoneInputChange = (phone, country) => {
    const formattedPhone = `+${phone}`;
    setFormData((prevData) => ({ ...prevData, mobileNumber: formattedPhone }));
  };

  const validateMobileNumber = () => {
    const mobileRegex = /^\+\d+$/;
    return mobileRegex.test(formData.mobileNumber);
  };

  const handleNextStep = () => {
    if (!validateMobileNumber()) {
      showToast('Mobile number must start with a "+" followed by the country code and number.', 'error');
      return;
    }
    nextStep();
  };

  return (
    <>
      <h2 className="text-xl sm:text-2xl font-extrabold mb-4 sm:mb-4 text-center text-gray-800">
        Complete Your Profile
      </h2>
      <p className="text-[#6D4C73] mb-4 sm:mb-6 text-center text-sm sm:text-base">
        Please provide your personal details to create your account.
      </p>
      <div className="mb-4">
        <label htmlFor="emailDisplay" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="text"
          id="emailDisplay"
          value={formData.email}
          readOnly
          className="mt-1 block w-full px-3 sm:px-4 py-2 sm:py-3 border bg-[#EDE7F1] border-[#CBB8D9] rounded-3xl shadow-sm text-xs sm:text-sm placeholder-[#A789AE]"
          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        />
        <p className="text-[0.65rem] sm:text-xs text-[#6D4C73] mt-1">
          We'll send a verification code to this email
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div>
          <label htmlFor="firstName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="mt-1 block w-full px-3 sm:px-4 py-2 sm:py-3 border bg-[#EDE7F1] border-[#CBB8D9] rounded-3xl shadow-sm focus:outline-none focus:ring-[#A789AE] focus:border-[#A789AE] text-xs sm:text-sm placeholder-[#A789AE]"
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="mt-1 block w-full px-3 sm:px-4 py-2 sm:py-3 border bg-[#EDE7F1] border-[#CBB8D9] rounded-3xl shadow-sm focus:outline-none focus:ring-[#A789AE] focus:border-[#A789AE] text-xs sm:text-sm placeholder-[#A789AE]"
            style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          />
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="mobileNumber" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
          Mobile Number *
        </label>
        <PhoneInput
          country={'gb'}
          value={formData.mobileNumber}
          onChange={handlePhoneInputChange}
          inputStyle={{
            width: '100%',
            paddingTop: '0.5rem',
            paddingBottom: '0.5rem',
            borderRadius: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            borderColor: '#CBB8D9',
            backgroundColor: '#EDE7F1',
            paddingLeft: '3rem',
            fontSize: '0.75rem',
          }}
          containerStyle={{
            borderRadius: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
          buttonStyle={{
            borderRadius: '1.5rem 0 0 1.5rem',
            borderColor: '#CBB8D9',
            backgroundColor: '#F9FAFB',
          }}
          dropdownStyle={{
            borderRadius: '1.5rem',
            boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
            maxHeight: '200px',
            overflowY: 'auto',
            borderColor: '#CBB8D9',
          }}
          enableSearch={true}
          disableDropdown={false}
          placeholder="e.g., +447123456789"
          disableCountryCode={false}
          disableCountryGuess={false}
          countryCodeEditable={false}
        />
        <p className="text-[0.65rem] sm:text-xs text-[#6D4C73] mt-1">
          Please enter a valid mobile number (e.g., +447123456789)
        </p>
      </div>
      <div className="mb-4 sm:mb-6">
        <label htmlFor="dateOfBirth" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
          Date of Birth *
        </label>
        <DatePicker
          value={formData.dateOfBirth}
          onChange={(date) => handleChange({ target: { name: 'dateOfBirth', value: date } })}
          placeholder="Pick a date"
        />
      </div>
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="py-2 sm:py-3 px-4 sm:px-5 bg-transparent border border-[#966B9D] rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-[#966B9D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A789AE] transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg hover:border-[#A789AE] hover:text-[#A789AE]"
          style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          Back
        </button>
        <button
          onClick={handleNextStep}
          className="py-2 sm:py-3 px-4 sm:px-5 border border-transparent rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A789AE] transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #966B9D 0%, #8A5F8F 100%)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          Continue to Verification
        </button>
      </div>
    </>
  );
};

const VerifyEmailStep = ({ formData, handleOtpChange, otpInputRefs, nextStep, prevStep, isLoading, otpCountdown, setOtpCountdown, showToast }) => {
  const handleResendCode = async () => {
    setOtpCountdown(60);
    try {
      const response = await api.post('send-otp/', { email: formData.email });
      showToast(response.data.message, 'info');
    } catch (error) {
      showToast('Failed to resend OTP.', 'error');
    }
  };

  return (
    <>
      <h2 className="text-xl sm:text-2xl font-extrabold mb-4 sm:mb-4 text-center text-gray-800">
        Verify Your Email
      </h2>
      <p className="text-[#6D4C73] mb-4 sm:mb-6 text-center text-sm sm:text-base">
        We've sent a verification code to your email.
      </p>
      <p className="text-gray-800 mb-4 sm:mb-4 text-center text-sm sm:text-base">
        Enter the 6-digit code sent to: <span className="font-semibold">{formData.email}</span>
      </p>
      <div className="flex justify-center space-x-2 mb-6">
        {formData.otp.map((digit, index) => (
          <input
            key={index}
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleOtpChange(e, index)}
            ref={(el) => (otpInputRefs.current[index] = el)}
            className="w-10 h-10 text-center text-lg border bg-[#EDE7F1] border-[#CBB8D9] rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#A789AE] focus:border-[#A789AE]"
            style={{ borderRadius: '0.75rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
          />
        ))}
      </div>
      <div className="text-center mb-4 sm:mb-6">
        <button
          onClick={handleResendCode}
          disabled={otpCountdown > 0}
          className={`text-xs sm:text-sm font-medium transition-all duration-300 ease-in-out
            ${otpCountdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-[#6D4C73] hover:opacity-80 hover:underline'}`}
        >
          Resend Code {otpCountdown > 0 && `in ${otpCountdown}s`}
        </button>
      </div>
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          className="py-2 sm:py-3 px-4 sm:px-5 bg-transparent border border-[#966B9D] rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-[#966B9D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A789AE] transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg hover:border-[#A789AE] hover:text-[#A789AE]"
          style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          Back
        </button>
        <button
          onClick={nextStep}
          disabled={isLoading}
          className={`py-2 sm:py-3 px-4 sm:px-5 border border-transparent rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A789AE] transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg
            ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            background: 'linear-gradient(135deg, #966B9D 0%, #8A5F8F 100%)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          {isLoading ? 'Processing...' : 'Verify & Continue'}
        </button>
      </div>
    </>
  );
};

const NHSInformationStep = ({ formData, handleChange, handleCheckboxChange, nextStep, prevStep, isLoading, setCurrentStep, setFormData, showToast, registerUser }) => {
  const navigate = useNavigate();

  const handleNhsNumberChange = (e) => {
    const { name, value } = e.target;
    const digitsOnly = value.replace(/\D/g, '');
    setFormData((prevData) => ({ ...prevData, [name]: digitsOnly }));
  };

  const isNhsNumberValid = formData.nhsNumber.length === 10;
  const isCompleteProfileEnabled = () => {
    return formData.nhsNumber.length === 10 && formData.nhsConsent;
  };

  const handleSkip = async () => {
    const success = await registerUser(true);
    if (success) {
      showToast('Profile creation complete (NHS information skipped).', 'success');
    }
  };

  const handleCompleteProfile = async () => {
    const success = await registerUser(false);
    if (success) {
      nextStep();
    }
  };

  return (
    <>
      <h2 className="text-xl sm:text-2xl font-extrabold mb-4 sm:mb-4 text-center text-gray-800">
        NHS Information
      </h2>
      <p className="text-[#6D4C73] mb-4 sm:mb-6 text-center text-sm sm:text-base">
        Connect your NHS information for better support
      </p>
      <div className="mb-4">
        <label htmlFor="nhsNumber" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
          NHS Number (optional)
        </label>
        <input
          type="text"
          id="nhsNumber"
          name="nhsNumber"
          value={formData.nhsNumber}
          onChange={handleNhsNumberChange}
          placeholder="e.g. 1234567890"
          maxLength={10}
          className="mt-1 block w-full px-3 sm:px-4 py-2 sm:py-3 border bg-[#EDE7F1] border-[#CBB8D9] rounded-3xl shadow-sm focus:outline-none focus:ring-[#A789AE] focus:border-[#A789AE] text-xs sm:text-sm placeholder-[#A789AE]"
          style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        />
        <p className="text-[0.65rem] sm:text-xs text-[#6D4C73] mt-1">
          Your 10-digit NHS number can be found on your prescriptions or medical letters
        </p>
      </div>
      <div className="flex items-start mb-4 sm:mb-6">
        <input
          id="nhsConsent"
          name="nhsConsent"
          type="checkbox"
          checked={formData.nhsConsent}
          onChange={handleCheckboxChange}
          disabled={!isNhsNumberValid}
          className={`h-4 w-4 text-[#966B9D] border-[#CBB8D9] rounded focus:ring-[#A789AE] ${
            !isNhsNumberValid ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        />
        <label htmlFor="nhsConsent" className="ml-2 block text-xs sm:text-sm text-gray-900">
          I consent to MindKonnect retrieving and storing my NHS medical data
        </label>
      </div>
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 rounded-3xl" style={{ backgroundColor: '#CBB8D9', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 className="font-semibold mb-2 text-sm sm:text-base text-[#6D4C73]">
          Data Consent
        </h3>
        <ul className="list-disc list-inside text-xs sm:text-sm text-gray-700">
          <li>Retrieve relevant medical information from NHS Digital</li>
          <li>Store your data securely to provide personalised care</li>
          <li>Identify potential health concerns earlier</li>
          <li>You can withdraw consent at any time from your account settings.</li>
        </ul>
      </div>
      <div className="flex justify-between mt-4 sm:mt-6">
        <button
          onClick={prevStep}
          className="py-2 sm:py-3 px-4 sm:px-5 bg-transparent border border-[#966B9D] rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-[#966B9D] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A789AE] transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg hover:border-[#A789AE] hover:text-[#A789AE]"
          style={{ boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          Back
        </button>
        <button
          onClick={handleCompleteProfile}
          disabled={isLoading || !isCompleteProfileEnabled()}
          className={`py-2 sm:py-3 px-4 sm:px-5 border border-transparent rounded-3xl shadow-sm text-xs sm:text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#A789AE] transition-all duration-300 ease-in-out transform hover:scale-110 hover:shadow-lg
            ${isLoading || !isCompleteProfileEnabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            background: 'linear-gradient(135deg, #966B9D 0%, #8A5F8F 100%)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          {isLoading ? 'Processing...' : 'Complete Profile'}
        </button>
      </div>
      <div className="text-center mt-3 sm:mt-4">
        <button
          onClick={handleSkip}
          className="text-xs sm:text-sm font-medium text-[#6D4C73] transition-all duration-300 ease-in-out hover:opacity-80 hover:underline"
        >
          Skip for now
        </button>
      </div>
    </>
  );
};

export default UniAuth;