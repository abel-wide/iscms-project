import { useState, useEffect } from 'react';
import API from '../../services/api';

const STANDARD_PERIODS = [
  { period: 1, time: '08:30 - 09:15' },
  { period: 2, time: '09:20 - 10:05' },
  { period: 3, time: '10:25 - 11:10' },
  { period: 4, time: '11:15 - 12:00' },
  { period: 5, time: '01:00 - 01:45' },
  { period: 6, time: '01:50 - 02:35' }
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function TimetableManagement() {
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Load classrooms
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await API.get('/classes');
        const list = res.data?.data || res.data || [];
        setClasses(list);
        if (list.length > 0) {
          setSelectedClassId(list[0]._id);
        }
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };
    fetchClasses();
  }, []);

  // Fetch timetable whenever selectedClassId changes
  useEffect(() => {
    if (!selectedClassId) return;

    const fetchTimetable = async () => {
      setLoading(true);
      setError('');
      setMessage('');
      try {
        const res = await API.get(`/timetable/class/${selectedClassId}`);
        if (res.data?.success) {
          setTimetable(res.data.data);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setTimetable(null);
        } else {
          setError('Failed to load timetable for this class');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTimetable();
  }, [selectedClassId]);

  // Auto-generate timetable
  const handleAutoGenerate = async () => {
    if (!selectedClassId || generating) return;
    setGenerating(true);
    setError('');
    setMessage('');

    try {
      const res = await API.post(`/timetable/generate/${selectedClassId}`);
      if (res.data?.success) {
        setTimetable(res.data.data);
        setMessage('✨ Balanced, clash-free timetable generated successfully!');
      }
    } catch (err) {
      console.error('Error generating timetable:', err);
      setError(err.response?.data?.message || 'Failed to auto-generate timetable');
    } finally {
      setGenerating(false);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    if (!selectedClassId) return;
    try {
      const response = await API.get(`/timetable/class/${selectedClassId}/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `timetable_${selectedClass?.className || 'class'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not download timetable PDF.');
    }
  };

  const selectedClass = classes.find((c) => c._id === selectedClassId);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span>📅</span> Automated Timetable Generation
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate clash-free weekly class schedules with balanced subject distribution
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Classroom Select */}
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {classes.map((cls) => (
                <option key={cls._id} value={cls._id}>
                  {cls.className} ({cls.gradeLevel})
                </option>
              ))}
            </select>

            {/* Auto Generate Button */}
            <button
              onClick={handleAutoGenerate}
              disabled={generating || !selectedClassId}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium text-sm rounded-xl transition shadow-sm flex items-center gap-2"
            >
              <span>{generating ? '⚙️' : '⚡'}</span>
              {generating ? 'Generating Schedule...' : 'Auto-Generate Timetable'}
            </button>

            {/* Download PDF Button */}
            {timetable && (
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                <span>📄</span> Download PDF
              </button>
            )}
          </div>
        </div>

        {/* Status messages */}
        {message && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Timetable Grid View */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-slate-200">
          Loading timetable...
        </div>
      ) : !timetable ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <div className="w-16 h-16 mx-auto mb-3 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold">
            📅
          </div>
          <h3 className="text-base font-bold text-slate-800">No Timetable Generated Yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Click <strong>"Auto-Generate Timetable"</strong> above to instantly create a collision-free weekly schedule for {selectedClass?.className || 'this class'}.
          </p>
          <button
            onClick={handleAutoGenerate}
            disabled={generating}
            className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition shadow-sm"
          >
            Generate Now
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-800">
                Weekly Schedule: {timetable.classroom?.className}
              </span>
              <span className="text-xs text-slate-500 ml-2">
                Room: {timetable.classroom?.roomNumber || 'Main Block'} • Academic Year: {timetable.academicYear}
              </span>
            </div>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-1 rounded-full">
              6 Periods / Day
            </span>
          </div>

          {/* Responsive Timetable Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-3.5 w-28">Day</th>
                  {STANDARD_PERIODS.map((p) => (
                    <th key={p.period} className="p-3.5 text-center">
                      <div>Period {p.period}</div>
                      <div className="text-[10px] font-normal text-slate-500 lowercase">{p.time}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {DAYS.map((day) => {
                  const dayData = timetable.schedule?.find((d) => d.day === day);
                  return (
                    <tr key={day} className="hover:bg-slate-50/50 transition">
                      <td className="p-3.5 font-bold text-slate-700 bg-slate-50/60 text-sm whitespace-nowrap">
                        {day}
                      </td>
                      {STANDARD_PERIODS.map((periodInfo) => {
                        const slot = dayData?.slots?.find((s) => s.period === periodInfo.period);
                        return (
                          <td key={periodInfo.period} className="p-2.5 text-center align-top">
                            {slot ? (
                              <div className="bg-indigo-50/60 hover:bg-indigo-100/70 transition p-2.5 rounded-xl border border-indigo-100/80 text-left">
                                <p className="text-xs font-bold text-indigo-950 truncate">
                                  {slot.subject}
                                </p>
                                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                  👨‍🏫 {slot.teacher?.fullName || 'Teacher Assigned'}
                                </p>
                              </div>
                            ) : (
                              <div className="p-2.5 text-xs text-slate-300 rounded-xl bg-slate-50">
                                Free
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
