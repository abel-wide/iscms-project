import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../services/api';

export default function StudentProfile() {
  const { id } = useParams(); 
  
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await API.get(`/users/${id}`);
        console.log("Student API response:", res.data); // 👈 ሙሉውን መረጃ ተመልከት
        const userData = res.data.user || res.data; // 👈 user ን ብቻ ውሰድ
        setStudent(userData);
      } catch (err) {
        console.error("Error fetching student:", err);
        setError('የተማሪውን መረጃ ማምጣት አልተቻለም።');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-slate-500">በመጫን ላይ...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!student) return <div className="p-8 text-center text-slate-500">ተማሪው አልተገኘም።</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <Link 
        to="/admin/students" 
        className="inline-flex mb-6 text-indigo-600 hover:text-indigo-800 items-center gap-2 font-medium transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        ወደ ተማሪዎች ዝርዝር ተመለስ
      </Link>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
        
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 rounded-full bg-white p-1 shadow-lg">
              <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold uppercase">
                {student.fullName ? student.fullName.charAt(0) : 'S'}
              </div>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold mb-2">
              ንቁ (Active)
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">{student.fullName || 'ስም አልተመዘገበም'}</h1>
            <p className="text-slate-500 mt-1">{student.email}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">ክፍል (Class)</p>
              {/* 👇 የ gradeLevel ዋጋ በግልጽ ይታያል */}
              <p className="font-semibold text-slate-800 text-lg">
                {student.gradeLevel || student.className || 'አልተመደበም'}
              </p>
            </div>
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">ሮል (Role)</p>
              <p className="font-semibold text-slate-800 capitalize text-lg">{student.role}</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">ስልክ ቁጥር (Phone)</p>
              <p className="font-semibold text-slate-800 text-lg">{student.phone || 'አልተመዘገበም'}</p>
            </div>
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
              <p className="text-sm text-slate-500 mb-1">የተመዘገበበት ቀን (Joined)</p>
              <p className="font-semibold text-slate-800 text-lg">
                {student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}