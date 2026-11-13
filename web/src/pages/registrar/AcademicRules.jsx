import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/useLanguage';

export default function AcademicRules() {
  const { t } = useLanguage();
  const [message, setMessage] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [rules, setRules] = useState([]);

  // 1. የፎርም ስቴት
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'general',
    penalty: ''
  });

  // 2. ከ localStorage ህጎችን አምጣ (የ ESLint ማስጠንቀቂያን ለማስወገድ)
  useEffect(() => {
    const saved = localStorage.getItem('academicRulesList');
    
    // 👇 በዚህ መንገድ ስቴትን አስተካክል
    const loadRules = () => {
      if (saved) {
        setRules(JSON.parse(saved));
      } else {
        const defaultRules = [
          {
            id: '1',
            title: 'Minimum Attendance Requirement',
            description: 'Students must maintain at least 75% attendance to pass.',
            category: 'attendance',
            penalty: 'Warning after 3 absences'
          },
          {
            id: '2',
            title: 'Late Submission Penalty',
            description: 'Assignments submitted late will lose 10% per day.',
            category: 'grading',
            penalty: '-10% per day'
          }
        ];
        setRules(defaultRules);
        localStorage.setItem('academicRulesList', JSON.stringify(defaultRules));
      }
    };

    loadRules();
  }, []);

  // 3. ህግ አስቀምጥ (አዲስ ወይም አርትዕ)
  const handleSubmit = (e) => {
    e.preventDefault();
    let updatedRules;

    if (editingId) {
      // ማርትዕ
      updatedRules = rules.map(r => 
        r.id === editingId ? { ...form, id: editingId } : r
      );
      setMessage({ type: 'success', text: t('ruleUpdated') || 'Rule updated successfully!' });
    } else {
      // 👇 አዲስ ጨምር (የ Date.now() ስህተትን ለማስወገድ በ event handler ውስጥ ተጠቀም)
      const newRule = { ...form, id: crypto.randomUUID() };
      updatedRules = [newRule, ...rules];
      setMessage({ type: 'success', text: t('ruleAdded') || 'Rule added successfully!' });
    }

    setRules(updatedRules);
    localStorage.setItem('academicRulesList', JSON.stringify(updatedRules));
    resetForm();
  };

  // 4. ህግ አርትዕ
  const handleEdit = (rule) => {
    setForm({
      title: rule.title,
      description: rule.description,
      category: rule.category,
      penalty: rule.penalty
    });
    setEditingId(rule.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 5. ህግ ሰርዝ
  const handleDelete = (id) => {
    if (!window.confirm(t('confirmDeleteRule') || 'Delete this rule?')) return;
    const updatedRules = rules.filter(r => r.id !== id);
    setRules(updatedRules);
    localStorage.setItem('academicRulesList', JSON.stringify(updatedRules));
    setMessage({ type: 'success', text: t('ruleDeleted') || 'Rule deleted' });
  };

  // 6. ፎርም አጽዳ
  const resetForm = () => {
    setForm({ title: '', description: '', category: 'general', penalty: '' });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('academicRules') || 'Academic Rules'}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('academicRulesSubtitle') || 'Manage school academic policies and guidelines'}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); if(showForm) resetForm(); }}
          className={`px-4 py-2.5 rounded-xl font-medium transition-colors text-white ${
            showForm ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {showForm ? t('cancel') : `+ ${t('newRule') || 'New Rule'}`}
        </button>
      </div>

      {message && (
        <div className={`px-4 py-3 rounded-xl border ${
          message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">
            {editingId ? (t('editRule') || 'Edit Rule') : (t('createNewRule') || 'Create New Rule')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('title') || 'Title'}</label>
              <input
                required
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Minimum Attendance Requirement"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('category') || 'Category'}</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="general">{t('general') || 'General'}</option>
                <option value="attendance">{t('attendance') || 'Attendance'}</option>
                <option value="grading">{t('grading') || 'Grading'}</option>
                <option value="conduct">{t('conduct') || 'Conduct'}</option>
                <option value="payment">{t('payment') || 'Payment'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('description') || 'Description'}</label>
            <textarea
              required
              rows="3"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Write the rule details here..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('penalty') || 'Penalty'}</label>
            <input
              type="text"
              value={form.penalty}
              onChange={(e) => setForm({ ...form, penalty: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Warning, -10% grade, etc."
            />
          </div>

          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
            {editingId ? (t('updateRule') || 'Update Rule') : (t('saveRule') || 'Save Rule')}
          </button>
        </form>
      )}

      {/* Rules List */}
      {rules.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-slate-300 text-slate-500">
          <span className="text-5xl mb-4 block">📜</span>
          <p className="font-bold text-lg">{t('noRules') || 'No academic rules defined yet'}</p>
          <p className="text-sm mt-1">{t('addFirstRule') || 'Click "New Rule" to get started.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                  rule.category === 'attendance' ? 'bg-blue-100 text-blue-700' :
                  rule.category === 'grading' ? 'bg-purple-100 text-purple-700' :
                  rule.category === 'payment' ? 'bg-emerald-100 text-emerald-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {t(rule.category) || rule.category}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(rule)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800"
                  >
                    {t('edit') || 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDelete(rule.id)}
                    className="text-xs font-medium text-red-600 hover:text-red-800"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">{rule.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed flex-1">{rule.description}</p>
              
              {rule.penalty && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    <span className="font-bold text-red-600">{t('penalty') || 'Penalty'}:</span> {rule.penalty}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}