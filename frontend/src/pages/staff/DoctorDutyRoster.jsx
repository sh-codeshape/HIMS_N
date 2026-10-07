import React, { useState, useEffect } from "react";
import PageContainer from "../../components/common/PageContainer.jsx";
import axiosInstance from "../../api/axiosInstance";
import { ENDPOINTS } from "../../api/endpoints";
import toast from "react-hot-toast";
import { FiEdit2, FiPlus, FiX, FiTrash2, FiClock } from "react-icons/fi";
import Input from "../../components/common/Input.jsx";
import Button from "../../components/common/Button.jsx";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorDutyRoster() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [schedules, setSchedules] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);

  const [formData, setFormData] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    slot_minutes: 15,
    consultation_mode: "both"
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchSchedules(selectedDoctor.practitioner_id);
    } else {
      setSchedules([]);
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(ENDPOINTS.PRACTITIONERS.BASE);
      setDoctors(res.data.data || []);
      if (res.data.data?.length > 0) {
        setSelectedDoctor(res.data.data[0]);
      }
    } catch (error) {
      toast.error("Failed to fetch doctors list");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async (practitionerId) => {
    try {
      const res = await axiosInstance.get(`${ENDPOINTS.PRACTITIONERS.BASE}/${practitionerId}/schedules`);
      setSchedules(res.data.data || []);
    } catch (error) {
      toast.error("Failed to fetch schedules");
      console.error(error);
    }
  };

  const handleOpenModal = (schedule = null) => {
    if (!selectedDoctor) return toast.error("Please select a doctor first");
    
    if (schedule) {
      setEditingSchedule(schedule);
      setFormData({
        day_of_week: schedule.day_of_week,
        start_time: schedule.start_time.substring(0, 5), // Format HH:mm
        end_time: schedule.end_time.substring(0, 5),
        slot_minutes: schedule.slot_minutes || 15,
        consultation_mode: schedule.consultation_mode || "both"
      });
    } else {
      setEditingSchedule(null);
      setFormData({
        day_of_week: 1, // Default Monday
        start_time: "09:00",
        end_time: "17:00",
        slot_minutes: 15,
        consultation_mode: "both"
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingSchedule(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSchedule) {
        await axiosInstance.put(
          `${ENDPOINTS.PRACTITIONERS.BASE}/${selectedDoctor.practitioner_id}/schedules/${editingSchedule.id}`,
          formData
        );
        toast.success("Schedule updated successfully");
      } else {
        await axiosInstance.post(
          `${ENDPOINTS.PRACTITIONERS.BASE}/${selectedDoctor.practitioner_id}/schedules`,
          formData
        );
        toast.success("Schedule created successfully");
      }
      handleCloseModal();
      fetchSchedules(selectedDoctor.practitioner_id);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Operation failed");
      console.error(error);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm("Are you sure you want to delete this schedule block?")) return;
    try {
      await axiosInstance.delete(`${ENDPOINTS.PRACTITIONERS.BASE}/${selectedDoctor.practitioner_id}/schedules/${scheduleId}`);
      toast.success("Schedule deleted successfully");
      fetchSchedules(selectedDoctor.practitioner_id);
    } catch (error) {
      toast.error(error.response?.data?.error?.message || "Failed to delete schedule");
      console.error(error);
    }
  };

  if (loading && doctors.length === 0) {
    return <PageContainer title="Doctor Duty Roster">Loading...</PageContainer>;
  }

  return (
    <PageContainer title="Doctor Duty Roster">
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-160px)]">
        {/* Left Sidebar: Doctors List */}
        <div className="w-full md:w-1/3 lg:w-1/4 bg-white rounded-lg shadow flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-700">Select Doctor</h3>
          </div>
          <div className="overflow-y-auto flex-1">
            {doctors.map(doc => (
              <button
                key={doc.practitioner_id}
                onClick={() => setSelectedDoctor(doc)}
                className={`w-full text-left p-4 border-b hover:bg-blue-50 transition-colors ${selectedDoctor?.practitioner_id === doc.practitioner_id ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'}`}
              >
                <div className="font-medium text-gray-800">Dr. {doc.first_name} {doc.last_name}</div>
                <div className="text-sm text-gray-500 mt-1">{doc.staff_code}</div>
              </button>
            ))}
            {doctors.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No doctors found. Ensure staff members are created as 'doctor'.</div>
            )}
          </div>
        </div>

        {/* Right Main Content: Schedules */}
        <div className="flex-1 bg-white rounded-lg shadow flex flex-col overflow-hidden">
          {selectedDoctor ? (
            <>
              <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Dr. {selectedDoctor.first_name} {selectedDoctor.last_name}'s Schedule
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Manage weekly availability and consultation modes</p>
                </div>
                <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
                  <FiPlus /> Add Slot
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                {schedules.length > 0 ? (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {schedules.map((sched) => (
                      <div key={sched.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <div className="bg-blue-100 text-blue-700 p-2 rounded-lg">
                              <FiClock size={20} />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-800 text-lg">{DAYS_OF_WEEK[sched.day_of_week]}</h4>
                              <p className="text-sm text-gray-500 font-medium">
                                {sched.start_time.substring(0, 5)} - {sched.end_time.substring(0, 5)}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => handleOpenModal(sched)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Edit">
                              <FiEdit2 />
                            </button>
                            <button onClick={() => handleDelete(sched.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors" title="Delete">
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Mode</p>
                            <p className="text-sm font-medium text-gray-700 capitalize mt-1">
                              {sched.consultation_mode.replace('_', ' ')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Slot Duration</p>
                            <p className="text-sm font-medium text-gray-700 mt-1">
                              {sched.slot_minutes} mins
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <FiClock size={48} className="mb-4 text-gray-300" />
                    <p className="text-lg font-medium text-gray-500">No schedules configured</p>
                    <p className="text-sm mt-1">Click "Add Slot" to set up weekly availability.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 p-8 text-center">
              Select a doctor from the list on the left to view and manage their duty roster.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold text-gray-800">{editingSchedule ? 'Edit Schedule Slot' : 'Add Schedule Slot'}</h2>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Day of Week</label>
                <select
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                  required
                >
                  {DAYS_OF_WEEK.map((day, idx) => (
                    <option key={idx} value={idx}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Time"
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
                <Input
                  label="End Time"
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Consultation Mode</label>
                  <select
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.consultation_mode}
                    onChange={(e) => setFormData({ ...formData, consultation_mode: e.target.value })}
                    required
                  >
                    <option value="in_person">In Person</option>
                    <option value="teleconsult">Teleconsult</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Slot Duration (mins)</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.slot_minutes}
                    onChange={(e) => setFormData({ ...formData, slot_minutes: parseInt(e.target.value) || 15 })}
                    min="5"
                    step="5"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <Button variant="secondary" onClick={handleCloseModal} type="button">
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSchedule ? 'Save Changes' : 'Add Slot'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
