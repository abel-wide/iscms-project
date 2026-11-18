import { useState, useEffect } from 'react';
import API from '../../services/api';

export default function HeadTimetable() {
  const [timetables, setTimetables] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get('/classes').then(r => setClasses(r.data)).catch(() => {});
  }, []);

  const fetchTimetable = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await API.get(`/timetable?classId=${selectedClass}`);
      setTimetables(Array.isArray(res.data) ? res.data : [res.data]);
    } catch {
      setTimetables([]);
    } finally {
      setLoading(false);
    }
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">📅 School Timetables</h2>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-col sm:flex-row gap-3">
        <select
          value={selectedClass}
          onChange={e => setSelectedClass(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-purple-400 outline-none bg-white"
        >
          <option value="">Select a class</option>
          {classes.map(c => (
            <option key={c._id} value={c._id}>{c.name} {c.section}</option>
          ))}
        </select>
        <button
          onClick={fetchTimetable}
          disabled={!selectedClass || loading}
          className="bg-purple-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'View Timetable'}
        </button>
      </div>

      {timetables.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          Select a class to view its timetable.
        </div>
      ) : (
        timetables.map((tt, idx) => (
          <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
            <div className="p-4 border-b border-gray-100 bg-purple-50">
              <h3 className="font-semibold text-purple-800">{tt.className || 'Class Timetable'} — {tt.term} {tt.academicYear}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-4 py-3">Period</th>
                    {days.map(d => <th key={d} className="text-center px-3 py-3">{d.slice(0, 3)}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[...Array(6)].map((_, periodIdx) => (
                    <tr key={periodIdx} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-600">P{periodIdx + 1}</td>
                      {days.map(day => {
                        const slot = tt.schedule?.find(s => s.day === day && s.period === periodIdx + 1);
                        return (
                          <td key={day} className="px-3 py-3 text-center">
                            {slot ? (
                              <div>
                                <p className="font-medium text-gray-800">{slot.subject}</p>
                                <p className="text-xs text-gray-400">{slot.teacher?.name || slot.teacher?.fullName || ''}</p>
                              </div>
                            ) : (
                              <span className="text-gray-200">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
