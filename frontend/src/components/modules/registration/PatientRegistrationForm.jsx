import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from "../../common/Input.jsx";
import Select from "../../common/Select.jsx";
import Button from "../../common/Button.jsx";

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate API call and redirect based on type
    if (formData.type === 'OPD') {
      navigate('/opd/registration'); // Or wherever the OPD queue is
    } else {
      navigate('/ipd/admission'); // Or wherever IPD is
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
        <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
        <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required />
        
        <div className="flex flex-col gap-1.5 w-full">
          <label className="text-sm font-semibold text-slate-700">Gender</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className="px-4 py-2.5 border border-slate-300 rounded-lg text-sm w-full bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        
        <Input label="Age" type="number" name="age" value={formData.age} onChange={handleChange} required />
      </div>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-semibold text-slate-700">Registration Type</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="type" 
              value="OPD" 
              checked={formData.type === 'OPD'} 
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-800">OPD (Outpatient)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="radio" 
              name="type" 
              value="IPD" 
              checked={formData.type === 'IPD'} 
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-slate-800">IPD (Inpatient Admission)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-slate-100">
        <Button type="submit" className="px-8">Register & Proceed</Button>
      </div>
    </form>
  );
}
