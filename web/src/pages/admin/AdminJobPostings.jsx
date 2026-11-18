import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';

export default function AdminJobPostings() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [viewApplications, setViewApplications] = useState(null); // { title, applications }

  const emptyForm = {
    title: '', department: '', description: '', requirements: '',
    type: 'Full-time', location: 'Wachemo University, Hossana',
    salary: 'Negotiable', deadline: ''
  };
  const [form, setForm] = useState(emptyForm);

  const fetchJobs = () => {
    API.get('/jobs?status=all')
      .then(r => setJobs(r.data))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(''); setSuccess('');
    try {
      await API.post('/jobs', form);
      setSuccess('✅ Job posted successfully!');
      setForm(emptyForm);
      setShowForm(false);
      fetchJobs();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post job.');
    } finally { setSubmitting(false); }
  };

  const toggleStatus = async (job) => {
    try {
      await API.put(`/jobs/${job._id}`, { status: job.status === 'open' ? 'closed' : 'open' });
      fetchJobs();
    } catch {}
  };

  const deleteJob = async (id) => {
    if (!window.confirm('Delete this job posting?')) return;
    try { await API.delete(`/jobs/${id}`); fetchJobs(); } catch {}
  };

  const loadApplications = async (job) => {
    try {
      const res = await API.get(`/jobs/${job._id}/applications`);
      setViewApplications(res.data);
    } catch {}
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💼 Job Postings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage vacancies and view applications</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow-md">
          {showForm ? '✕ Cancel' : '+ Post Job'}
        </button>
      </div>

      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm">{success}</div>}
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>}

      {/* Create Job Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-700 mb-4 text-lg">📝 New Job Posting</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Job Title *</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="e.g. Mathematics Teacher" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Department *</label>
                <input required value={form.department} onChange={e => setForm({...form, department: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="e.g. Science Department" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Job Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none bg-white">
                  {['Full-time','Part-time','Contract','Internship'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Deadline *</label>
                <input type="datetime-local" required value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Salary</label>
                <input value={form.salary} onChange={e => setForm({...form, salary: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                  placeholder="e.g. 8,000 ETB / month" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Location</label>
                <input value={form.location} onChange={e => setForm({...form, location: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Job Description *</label>
              <textarea required rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                placeholder="Describe the role and responsibilities..." />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Requirements *</label>
              <textarea required rows={3} value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                placeholder="List qualifications, experience, skills..." />
            </div>
            <button type="submit" disabled={submitting}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50">
              {submitting ? 'Posting...' : '🚀 Publish Job'}
            </button>
          </form>
        </div>
      )}

      {/* Applications Modal */}
      {viewApplications && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewApplications(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 text-lg">Applications — {viewApplications.title}</h3>
              <button onClick={() => setViewApplications(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {viewApplications.applications.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No applications yet.</p>
            ) : (
              <div className="space-y-3">
                {viewApplications.applications.map((app, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-gray-800">{app.name}</p>
                        <p className="text-sm text-gray-500">{app.email} {app.phone && `· ${app.phone}`}</p>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                    {app.coverLetter && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-3">{app.coverLetter}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job List */}
      {jobs.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">💼</div>
          <p className="text-gray-500">No job postings yet. Click "+ Post Job" to create one.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-800 text-lg">{job.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {job.status === 'open' ? '🟢 Open' : '🔴 Closed'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{job.type}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-gray-500 mt-2">
                    <span>🏢 {job.department}</span>
                    <span>📍 {job.location}</span>
                    <span>💰 {job.salary}</span>
                    <span>📅 Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                    <span>👥 {job.applications?.length || 0} applicants</span>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => loadApplications(job)}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition font-medium">
                    View Apps ({job.applications?.length || 0})
                  </button>
                  <button onClick={() => toggleStatus(job)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition font-medium ${job.status === 'open' ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {job.status === 'open' ? 'Close' : 'Reopen'}
                  </button>
                  <button onClick={() => deleteJob(job._id)}
                    className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-medium">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
