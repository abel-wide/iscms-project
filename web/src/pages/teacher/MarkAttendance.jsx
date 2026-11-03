import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../context/useLanguage'; // 👈 ተጨምሯል

export default function MarkAttendance() {
  const { user } = useAuth();
  const { t } = useLanguage(); // 👈 ተጨምሯል
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().substring(0, 10));
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let cancelled = false;

    const fetchClasses = async () => {
      try {
        const res = await API.get('/classes');
        if (!cancelled) {
          const myClasses = (res.data.classes || []).filter(
            (c) => c.homeroomTeacher?._id === user.id
          );
          setClasses(myClasses);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchClasses();
    return () => { cancelled = true; };
  }, [user.id]);

  const handleClassSelect = (classId) => {
    setSelectedClass(classId);
    setMessage(null);
    setSearchQuery('');

    const cls = classes.find((c) => c._id === classId);
    if (!cls) {
      setStudents([]);
      setAttendance({});
      return;
    }

    setStudents(cls.students || []);

    const initial = {};
    (cls.students || []).forEach((s) => {
      initial[s._id] = 'present';
    });
    setAttendance(initial);
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance({ ...attendance, [studentId]: status });
  };

  const markAll = (status) => {
    const filteredStudents = students.filter(s => 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    const updated = { ...attendance };
    filteredStudents.forEach((s) => {
      updated[s._id] = status;
    });
    setAttendance(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      setMessage({ type: 'error', text: t('selectClassError') || 'Please select a class' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const records = students.map((s) => ({
        studentId: s._id,
        status: attendance[s._id] || 'present'
      }));

      const res = await API.post('/attendance/mark-bulk', {
        classroomId: selectedClass,
        date: attendanceDate,
        records
      });

      setMessage({ type: 'success', text: res.data.message || t('attendanceSaved') || 'Attendance saved successfully' });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('attendanceFailed') || 'Failed to save attendance' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // የስታቲስቲክስ ቆጠራ
  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount = Object.values(attendance).filter(v => v === 'absent').length;
  const lateCount = Object.values(attendance).filter(v => v === 'late').length;
  const excusedCount = Object.values(attendance).filter(v => v === 'excused').length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('markAttendance') || 'Mark Attendance'}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('markAttendanceSubtitle') || 'Record daily attendance for your students'}</p>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('class') || 'Class'}</label>
          <select
            value={selectedClass}
            onChange={(e) => handleClassSelect(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">-- {t('selectClass') || 'Select class'} --</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.className} ({c.students?.length || 0} {t('students') || 'students'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('date') || 'Date'}</label>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        {students.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('searchStudent') || 'Search Student'}</label>
            <input
              type="text"
              placeholder={t('searchStudentPlaceholder') || 'Type name or email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        )}

        {students.length > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => markAll('present')}
              className="text-sm font-medium bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-2 rounded-lg transition"
            >
              {t('allPresent') || 'All Present'}
            </button>
            <button
              type="button"
              onClick={() => markAll('absent')}
              className="text-sm font-medium bg-red-50 hover:bg-red-100 text-red-700 px-3 py-2 rounded-lg transition"
            >
              {t('allAbsent') || 'All Absent'}
            </button>
          </div>
        )}
      </div>

      {/* Student list */}
      {classes.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-300 text-slate-500">
          {t('noClassesAssigned') || 'You are not assigned to any class as homeroom teacher.'}
        </div>
      ) : !selectedClass ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-300 text-slate-500">
          {t('selectClassToStart') || 'Select a class to start marking attendance.'}
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-300 text-slate-500">
          {t('noStudentsInClass') || 'This class has no students yet.'}
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-300 text-slate-500">
          {t('noStudentsMatch') || `No students match your search "${searchQuery}".`}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">{t('student') || 'Student'}</th>
                <th className="px-4 py-3 text-center">{t('status') || 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((s, idx) => (
                <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-400 font-medium">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{s.fullName}</div>
                    <div className="text-xs text-slate-500">{s.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      {['present', 'absent', 'late', 'excused'].map((status) => {
                        const config = {
                          present: { label: t('present'), color: 'bg-emerald-500 text-white border-emerald-500', hover: 'hover:border-emerald-300 hover:bg-emerald-50' },
                          absent: { label: t('absent'), color: 'bg-red-500 text-white border-red-500', hover: 'hover:border-red-300 hover:bg-red-50' },
                          late: { label: t('late'), color: 'bg-amber-500 text-white border-amber-500', hover: 'hover:border-amber-300 hover:bg-amber-50' },
                          excused: { label: t('excused'), color: 'bg-blue-500 text-white border-blue-500', hover: 'hover:border-blue-300 hover:bg-blue-50' }
                        };
                        const isSelected = attendance[s._id] === status;
                        
                        return (
                          <button
                            key={status}
                            type="button"
                            onClick={() => handleStatusChange(s._id, status)}
                            className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                              isSelected 
                                ? config.color
                                : `bg-white text-slate-600 border-slate-200 ${config.hover}`
                            }`}
                          >
                            {config.label}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="p-5 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* 👇 የስታቲስቲክስ ማሳያ (Summary) */}
            <div className="flex gap-4 text-sm font-medium">
              <span className="text-emerald-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> {presentCount} {t('present')}
              </span>
              <span className="text-red-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span> {absentCount} {t('absent')}
              </span>
              <span className="text-amber-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span> {lateCount} {t('late')}
              </span>
              <span className="text-blue-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> {excusedCount} {t('excused')}
              </span>
            </div>

            <button type="submit" disabled={saving} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white px-8 py-2.5 rounded-xl font-medium transition-all flex justify-center items-center gap-2">
              {saving ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  {t('saving') || 'Saving...'}
                </>
              ) : (
                t('saveAttendance') || 'Save Attendance'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}