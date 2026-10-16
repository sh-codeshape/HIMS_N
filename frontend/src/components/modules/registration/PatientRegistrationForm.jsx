import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuPhone, LuUserPlus } from 'react-icons/lu';
import Input from "../../common/Input.jsx";
import Select from "../../common/Select.jsx";
import Button from "../../common/Button.jsx";
import { required, phone } from "../../utils/validation.js";

export default function PatientRegistrationForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    gender: 'Male',
    age: '',
    type: 'OPD'
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setTouchedField = (name) => setTouched((p) => ({ ...p, [name]: true }));

  const clearFieldError = (name) => setErrors((p) => { const next = { ...p }; delete next[name]; return next; });

  const validateField = (name, value) => {
    let result = { isValid: true, message: null };
    switch (name) {
      case 'firstName': result = required(value, 'First Name'); break;
      case 'lastName': result = required(value, 'Last Name'); break;
      case 'phone': result = phone(value); break;
      case 'age': result = required(value, 'Age'); break;
      default: break;
    }
    if (result.isValid) clearFieldError(name);
    else setErrors((p) => ({ ...p, [name]: result.message }));
    return result.isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === 'phone') nextValue = value.replace(/\D/g, '').slice(0, 10);
    if (name === 'age') nextValue = value.replace(/\D/g, '').slice(0, 3);

    setFormData({ ...formData, [name]: nextValue });
    clearFieldError(name);
    if (touched[name]) validateField(name, nextValue);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouchedField(name);
    validateField(name, value);
  };

  const fieldError = (name) => (touched[name] ? errors[name] : null);

  const validate = () => {
    const fields = ['firstName', 'lastName', 'phone', 'gender', 'age'];
    fields.forEach((f) => setTouchedField(f));
    let ok = true;
    if (!formData.firstName.trim()) { setErrors(p => ({ ...p, firstName: 'First Name is required.' })); ok = false; }
    else clearFieldError('firstName');
    if (!formData.lastName.trim()) { setErrors(p => ({ ...p, lastName: 'Last Name is required.' })); ok = false; }
    else clearFieldError('lastName');
    if (!/^\d{10}$/.test(formData.phone)) { setErrors(p => ({ ...p, phone: 'Valid 10-digit mobile is required.' })); ok = false; }
    else clearFieldError('phone');
    if (!formData.gender) { ok = false; }
    if (!formData.age.trim()) { setErrors(p => ({ ...p, age: 'Age is required.' })); ok = false; }
    else clearFieldError('age');
    return ok;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    // Simulate API call and redirect based on type
    if (formData.type === 'OPD') {
      navigate('/opd/registration');
    } else {
      navigate('/ipd/admission');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6 max-w-md mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          error={fieldError('firstName')}
        />
        <Input
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          onBlur={handleBlur}
          error={fieldError('lastName')}
        />
        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          prefix="+91 "
          value={formData.phone}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          inputMode="tel"
          maxLength={10}
          error={fieldError('phone')}
          helper={!touched.phone ? 'Valid 10-digit mobile number.' : null}
        />
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-xs font-semibold text-slate-600">Gender <span className="text-rose-500">*</span></label>
          <div className="flex items-center gap-4 mt-2">
            {['Male', 'Female', 'Other'].map((g) => (
              <label key={g} className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer">
                <input type="radio" name="gender" value={g}
                  checked={formData.gender === g} onChange={handleChange} onBlur={handleBlur}
                  className="accent-blue-600" />
                {g}
              </label>
            ))}
          </div>
        </div>
        <Input
          label="Age"
          type="number"
          name="age"
          value={formData.age}
          onChange={handleChange}
          onBlur={handleBlur}
          required
          inputMode="numeric"
          maxLength={3}
          error={fieldError('age')}
        />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-xs font-semibold text-slate-600">Registration Type</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="type" value="OPD" checked={formData.type === 'OPD'} onChange={handleChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm font-medium text-slate-800">OPD (Outpatient)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="type" value="IPD" checked={formData.type === 'IPD'} onChange={handleChange} className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm font-medium text-slate-800">IPD (Inpatient Admission)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button type="submit" variant="primary" icon={<LuPhone size={16} />}>Register & Proceed</Button>
      </div>
    </form>
  );
}
