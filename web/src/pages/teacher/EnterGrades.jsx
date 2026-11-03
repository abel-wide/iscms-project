import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/useAuth';
import { useLanguage } from '../../context/useLanguage'; // 👈 ተጨምሯል

export default function EnterGrades() {
  const { user } = useAuth();
  const { t } = useLanguage(); // 👈 ተጨምሯል
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [meta, setMeta] = useState({
    subject: 'Mathematics',
    term: 'Term 1',
    academicYear: '2025/2026',
    assessmentType: 'Final',
    maxScore: 100
  });

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
    return () => {
      cancelled = true;
    };
  }, [user.id]);

  const handleClassSelect = (classId) => {
    setSelectedClass(classId);
    const cls = classes.find((c) => c._id === classId);
    setStudents(cls?.students || []);
    setScores({});
    setMessage(null);
    setSearchQuery('');
  };

  const handleScoreChange = (studentId, value) => {
    setScores({ ...scores, [studentId]: value });
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
      const records = students
        .filter((s) => scores[s._id] !== undefined && scores[s._id] !== '')
        .map((s) => ({
          studentId: s._id,
          score: Number(scores[s._id])
        }));

      if (records.length === 0) {
        setMessage({ type: 'error', text: t('enterScoreError') || 'Please enter at least one score' });
        setSaving(false);
        return;
      }

      const res = await API.post('/grades/entry-bulk', {
        classroomId: selectedClass,
        subject: meta.subject,
        term: meta.term,
        academicYear: meta.academicYear,
        assessmentType: meta.assessmentType,
        maxScore: Number(meta.maxScore),
        records
      });

      setMessage({ type: 'success', text: res.data.message || t('gradesSaved') || 'Grades saved successfully' });
      setScores({});
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || t('gradesSaveFailed') || 'Failed to save grades' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;
  }

  const filteredStudents = students.filter(s => 
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 👇 የተሞሉ ተማሪዎች ብዛት (ለProgress አሞሌ)
  const enteredCount = Object.keys(scores).length;
  const progressPercent = students.length > 0 ? (enteredCount / students.length) * 100 : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">{t('enterGrades') || 'Enter Grades'}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('enterGradesSubtitle') || 'Record exam and assignment scores for your students'}</p>
      </div>

      {message && (
        <div className={`mb-4 px-4 py-3 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-700 border-green-200' 
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Meta Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('class') || 'Class'}</label>
              <select required value={selectedClass} onChange={(e) => handleClassSelect(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="">-- {t('selectClass') || 'Select class'} --</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.className}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('subject') || 'Subject'}</label>
              <input required type="text" value={meta.subject} onChange={(e) => setMeta({ ...meta, subject: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('assessmentType') || 'Assessment Type'}</label>
              <select value={meta.assessmentType} onChange={(e) => setMeta({ ...meta, assessmentType: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="Quiz">{t('quiz') || 'Quiz'}</option>
                <option value="Assignment">{t('assignment') || 'Assignment'}</option>
                <option value="Midterm">{t('midterm') || 'Midterm'}</option>
                <option value="Final">{t('final') || 'Final'}</option>
                <option value="Project">{t('project') || 'Project'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('term') || 'Term'}</label>
              <select value={meta.term} onChange={(e) => setMeta({ ...meta, term: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                <option value="Term 1">{t('term1') || 'Term 1'}</option>
                <option value="Term 2">{t('term2') || 'Term 2'}</option>
                <option value="Term 3">{t('term3') || 'Term 3'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('academicYear') || 'Academic Year'}</label>
              <input required type="text" value={meta.academicYear} onChange={(e) => setMeta({ ...meta, academicYear: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('maxScore') || 'Max Score'}</label>
              <input required type="number" value={meta.maxScore} onChange={(e) => setMeta({ ...meta, maxScore: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
        </div>

        {/* Search Box */}
        {students.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6 flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('searchStudent') || 'Search Student'}</label>
              <input
                type="text"
                placeholder={t('searchStudentPlaceholder') || 'Type name or email to filter students...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            {/* Progress Bar */}
            <div className="hidden sm:block w-48">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>{t('entered') || 'Entered'}: {enteredCount}/{students.length}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }}></div>
              </div>
            </div>
          </div>
        )}

        {/* Student Table */}
        {students.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">{t('student') || 'Student'}</th>
                  <th className="px-6 py-4 text-center">{t('score') || 'Score'} ( / {meta.maxScore})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                      {t('noStudentsMatch') || `No students match your search "${searchQuery}".`}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <tr key={s._id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-sm text-gray-400 font-medium">{idx + 1}</td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-slate-800">{s.fullName}</div>
                        <div className="text-xs text-slate-500">{s.email}</div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <input
                          type="number"
                          min="0"
                          max={meta.maxScore}
                          value={scores[s._id] ?? ''}
                          onChange={(e) => handleScoreChange(s._id, e.target.value)}
                          placeholder="—"
                          className={`w-24 text-center px-2 py-1.5 border rounded-lg font-bold text-lg outline-none transition-all
                            ${scores[s._id] ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-300 focus:border-indigo-500'}`}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button 
                type="submit" 
                disabled={saving || enteredCount === 0} 
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-8 py-2.5 rounded-xl font-medium shadow-sm transition-all flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    {t('saving') || 'Saving...'}
                  </>
                ) : (
                  t('saveGrades') || 'Save Grades'
                )}
              </button>
            </div>
          </div>
        )}

        {selectedClass && students.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center border border-dashed border-slate-300 text-slate-500">
            <span className="text-4xl mb-3 block">🏫</span>
            {t('noStudentsInClass') || 'This class has no students yet.'}
          </div>
        )}
      </form>
    </div>
  );
}