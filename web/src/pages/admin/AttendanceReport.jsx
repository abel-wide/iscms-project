import { useState, useEffect } from 'react';
import API from '../../services/api';

export default function AttendanceReport() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  
  //  አዲስ የፍለጋ ስቴት
  const [classSearch, setClassSearch] = useState('');

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await API.get('/classes');
        setClasses(res.data.classes || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchClasses();
  }, []);

  const fetchReport = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const res = await API.get(`/attendance/class/${selectedClass}?date=${date}`);
      setRecords(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 👇 በፍለጋ ሳጥኑ መሰረት ክፍሎችን ማጣራት
  const filteredClasses = classes.filter((c) =>
    c.className.toLowerCase().includes(classSearch.toLowerCase()) ||
    c.gradeLevel?.toLowerCase().includes(classSearch.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">የክትትል ሪፖርት</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">ክፍል ይምረጡ</label>
          
          {/* 👇 የፍለጋ ሳጥን */}
          <input
            type="text"
            placeholder="ክፍል በስም ይፈልጉ..."
            value={classSearch}
            onChange={(e) => setClassSearch(e.target.value)}
            className="w-full border p-2 rounded-lg mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
          />

           <select 
            value={selectedClass} 
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full border p-2 rounded-lg"
            required
          >
            {/* 👇 የመጀመሪያውን "ክፍል ይምረጡ" አጥፍተን በ option ውስጥ ብቻ እናስቀምጠው */}
            {filteredClasses.map(c => (
              <option key={c._id} value={c._id}>
                {c.className} ({c.gradeLevel || 'N/A'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ቀን</label>
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="border p-2 rounded-lg"
          />
        </div>

        <div className="flex items-end">
          <button 
            onClick={fetchReport}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            ሪፖርት አምጣ
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">በመጫን ላይ...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-slate-600">የተማሪ ስም</th>
                <th className="p-4 font-semibold text-slate-600">ኢሜይል</th>
                <th className="p-4 font-semibold text-slate-600">ሁኔታ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium">{record.studentId?.fullName || 'N/A'}</td>
                    <td className="p-4 text-slate-500">{record.studentId?.email || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        record.status === 'present' ? 'bg-green-100 text-green-700' :
                        record.status === 'absent' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.status === 'present' ? 'ተገኝ' : record.status === 'absent' ? 'አልተገኘም' : 'ዘግይቷል'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="p-8 text-center text-slate-500">
                    በዚህ ቀን ምንም ክትትል አልተመዘገበም።
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}