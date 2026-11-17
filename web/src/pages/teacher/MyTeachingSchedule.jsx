import { useState, useEffect } from 'react';
import API from '../../services/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function MyTeachingSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await API.get('/timetable/my-timetable');
        if (res.data?.success && res.data.teacherSchedule) {
          setSchedule(res.data.teacherSchedule);
        }
      } catch (err) {
        console.error('Error fetching teacher schedule:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading your teaching schedule...</div>;
  }

  const totalPeriodsThisWeek = schedule.reduce((acc, curr) => acc + (curr.slots?.length || 0), 0);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <span>📅</span> My Teaching Schedule
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Weekly timetable of all your teaching periods across classes
          </p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold border border-emerald-100 self-start sm:self-auto">
          {totalPeriodsThisWeek} Periods / Week
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DAYS.map((dayName) => {
          const dayData = schedule.find((d) => d.day === dayName);
          const slots = dayData?.slots || [];

          return (
            <div key={dayName} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                <h3 className="font-bold text-slate-800 text-base">{dayName}</h3>
                <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded-full">
                  {slots.length} Classes
                </span>
              </div>

              {slots.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 my-auto">
                  No classes scheduled for {dayName}
                </div>
              ) : (
                <div className="space-y-2.5 flex-1">
                  {slots.map((slot, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100/80 hover:bg-emerald-100/60 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-950">
                          {slot.subject}
                        </span>
                        <span className="text-[10px] font-semibold bg-white text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200">
                          Period {slot.period}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                        <span>🏫 {slot.className}</span>
                        <span>⏰ {slot.startTime} - {slot.endTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
