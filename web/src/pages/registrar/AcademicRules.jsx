import { useState } from 'react';
import { useLanguage } from '../../context/useLanguage';

export default function AcademicRules() {
  const { t } = useLanguage();
  const [message, setMessage] = useState(null);
  const [rules, setRules] = useState({
    minimumAttendance: 75,
    passMark: 60,
    maxAbsences: 15,
    gradingScale: {
      A: 90,
      B: 80,
      C: 70,
      D: 60,
      F: 0
    }
  });

  const handleSave = (e) => {
    e.preventDefault();
    // In a real system, this would POST to a backend endpoint
    // For now, just show success
    setMessage({
      type: 'success',
      text: t('rulesSavedLocally') || 'Academic rules saved (locally for this session)'
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('academicRules') || 'Academic Rules'}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('academicRulesSubtitle') || 'Configure attendance thresholds and grading policies'}
        </p>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Attendance Rules */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📅</span> {t('attendanceRules') || 'Attendance Rules'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('minimumAttendance') || 'Minimum Attendance Rate (%)'}
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={rules.minimumAttendance}
                onChange={(e) => setRules({ ...rules, minimumAttendance: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('minAttendanceHint') || 'Students below this rate will be flagged'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('maxAbsences') || 'Maximum Absences per Term'}
              </label>
              <input
                type="number"
                min="0"
                value={rules.maxAbsences}
                onChange={(e) => setRules({ ...rules, maxAbsences: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('maxAbsencesHint') || 'After this, students are marked as "at risk"'}
              </p>
            </div>
          </div>
        </section>

        {/* Grading Rules */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>📝</span> {t('gradingRules') || 'Grading Rules'}
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('passMark') || 'Pass Mark (%)'}
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={rules.passMark}
              onChange={(e) => setRules({ ...rules, passMark: Number(e.target.value) })}
              className="w-full md:w-64 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              {t('gradeBoundaries') || 'Grade Boundaries'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {['A', 'B', 'C', 'D', 'F'].map((grade) => (
                <div key={grade} className="bg-slate-50 p-4 rounded-xl text-center border border-slate-100">
                  <div className="text-2xl font-bold text-gray-800 mb-2">{grade}</div>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={rules.gradingScale[grade]}
                    onChange={(e) =>
                      setRules({
                        ...rules,
                        gradingScale: {
                          ...rules.gradingScale,
                          [grade]: Number(e.target.value)
                        }
                      })
                    }
                    className="w-full text-center px-2 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  />
                  <div className="text-xs text-gray-500 mt-1">{t('minPercent') || '% minimum'}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Payment Rules */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span>💰</span> {t('paymentRules') || 'Payment Rules'}
          </h2>
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-100">
            <p className="text-sm text-gray-700 mb-3">
              {t('paymentRulesNote') || 'Current payment deadlines are managed by Admins in the Payments page.'}
            </p>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2">• {t('baseFeeNote') || 'Base fee: Set per class by admin'}</li>
              <li className="flex items-center gap-2">• {t('penalty1Day') || '1 day late: 100 Birr penalty'}</li>
              <li className="flex items-center gap-2">• {t('penalty2Days') || '2 days late: 300 Birr penalty'}</li>
              <li className="flex items-center gap-2">• {t('penalty3Days') || '3 days late: 500 Birr penalty'}</li>
              <li className="flex items-center gap-2">• {t('penalty4Days') || '4+ days late: Payment blocked'}</li>
            </ul>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-medium transition-colors"
          >
            {t('saveRules') || 'Save Rules'}
          </button>
        </div>
      </form>
    </div>
  );
}