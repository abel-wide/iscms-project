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

export default function MyTimetable() {
  const [timetable, setTimetable] = useState(null);
  const [className, setClassName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimetable = async () => {
      try {
        const res = await API.get('/timetable/my-timetable');
        if (res.data?.success) {
          setTimetable(res.data.data);
          setClassName(res.data.className || '');
        }
      } catch (err) {
        console.error('Error fetching student timetable:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimetable();
  }, []);

  const handleDownloadPDF = async () => {
    if (!timetable?.classroom?._id) return;
    try {
      const response = await API.get(`/timetable/class/${timetable.classroom._id}/pdf`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `timetable_${className || 'class'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      alert('Could not download timetable PDF.');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading your timetable...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>📅</span> My Class Timetable
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Weekly class schedule for <span className="font-semibold text-indigo-600">{className || 'Your Class'}</span>
          </p>
        </div>
        {timetable && (
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <span>📄</span> Download PDF
          </button>
        )}
      </div>

      {!timetable ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
          <span className="text-4xl block mb-2">⏳</span>
          <h3 className="text-base font-bold text-slate-800">No Timetable Published Yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            The school administration has not generated the timetable for your class yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="p-3.5 w-28">Day</th>
                  {STANDARD_PERIODS.map((p) => (
                    <th key={p.period} className="p-3.5 text-center">
                      <div>Period {p.period}</div>
                      <div className="text-[10px] font-normal text-slate-500">{p.time}</div>
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
                              <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/70 text-left">
                                <p className="text-xs font-bold text-amber-950 truncate">
                                  {slot.subject}
                                </p>
                                <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                  👨‍🏫 {slot.teacher?.fullName || 'Assigned Teacher'}
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
