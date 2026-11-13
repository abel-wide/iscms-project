import { useEffect, useState } from 'react';
import API from '../../services/api';
import { useLanguage } from '../../context/useLanguage';

export default function ChildGrades() {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [data, setData] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchChildren = async () => {
      try {
        const res = await API.get('/auth/my-children');
        if (!cancelled) {
          const kids = res.data.children || [];
          setChildren(kids);
          if (kids.length > 0) setSelectedChild(kids[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchChildren();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    let cancelled = false;
    const fetchGrades = async () => {
      try {
        const res = await API.get(`/grades/student/${selectedChild._id}`);
        if (!cancelled) setData(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchGrades();
    return () => { cancelled = true; };
  }, [selectedChild]);

  const handleDownloadReportCard = async () => {
    if (!selectedChild) return;
    setDownloading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${baseURL}/grades/report/${selectedChild._id}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF download failed:', errorText);
        throw new Error(errorText);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report_card_${selectedChild.fullName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download error:', err);
      alert(t('downloadError') || 'Failed to download PDF.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="text-center py-12 text-gray-500">{t('loading')}</div>;

  if (children.length === 0) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-8 text-center">
          <span className="text-5xl mb-4 block">🔗</span>
          <p className="text-amber-800 font-bold text-lg mb-2">{t('noChildrenLinked') || 'No children linked to your account'}</p>
          <p className="text-sm text-amber-700">
            {t('contactAdminLinkChild') || "Please contact the school administrator to link your child's account."}
          </p>
        </div>
      </div>
    );
  }

  const marks = data?.marks || [];
  const subjectSummary = data?.subjectSummary || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('childGrades') || "Child's Grades"}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('academicPerformance') || 'Academic performance overview'}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {children.length > 1 && (
            <select
              value={selectedChild?._id || ''}
              onChange={(e) => {
                const c = children.find((k) => k._id === e.target.value);
                setSelectedChild(c);
              }}
              className="w-full sm:w-48 px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50 font-medium text-gray-700"
            >
              {children.map((c) => (
                <option key={c._id} value={c._id}>{c.fullName}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleDownloadReportCard}
            disabled={downloading}
            className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            {downloading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('downloading') || 'Downloading...'}
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                {t('downloadReportCard') || 'Download Report Card'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Subject averages */}
      {subjectSummary.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>📊</span> {t('subjectAverages') || 'Subject Averages'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectSummary.map((s) => (
              <div key={s.subject} className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-gray-800 mb-2">{s.subject}</h3>
                <p className="text-3xl font-bold text-indigo-600">
                  {s.average} <span className="text-lg text-gray-400">/ 100</span>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {s.markCount} {t('assessments') || 'assessment(s)'}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All marks */}
      <section>
        <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>📝</span> {t('allAssessments') || 'All Assessments'}
        </h2>
        {marks.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500 border border-dashed border-gray-300">
            {t('noGradesYet') || 'No grades recorded yet.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">{t('subject') || 'Subject'}</th>
                    <th className="px-6 py-4 text-center">{t('assessment') || 'Assessment'}</th>
                    <th className="px-6 py-4 text-center">{t('term') || 'Term'}</th>
                    <th className="px-6 py-4 text-center">{t('score') || 'Score'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {marks.map((m) => {
                    const percentage = m.maxScore
                      ? Math.round((m.score / m.maxScore) * 100)
                      : 0;
                    return (
                      <tr key={m._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{m.subject}</td>
                        <td className="px-6 py-4 text-sm text-center text-slate-500">
                          {m.assessmentType}
                          {m.assessmentName && ` — ${m.assessmentName}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-slate-600">{m.term}</td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 rounded-full text-sm font-bold bg-indigo-50 text-indigo-700">
                            {percentage} / 100
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}