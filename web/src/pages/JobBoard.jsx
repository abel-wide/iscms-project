import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showApply, setShowApply] = useState(false);
  const [applyForm, setApplyForm] = useState({ name: '', email: '', phone: '', coverLetter: '' });
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');

  useEffect(() => {
    API.get('/jobs')
      .then(r => setJobs(r.data.filter(j => j.status === 'open')))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const openJob = (job) => {
    setSelected(job);
    setShowApply(false);
    setApplySuccess('');
    setApplyError('');
    setApplyForm({ name: '', email: '', phone: '', coverLetter: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApply = async (e) => {
    e.preventDefault();
    setSubmitting(true); setApplyError(''); setApplySuccess('');
    try {
      await API.post(`/jobs/${selected._id}/apply`, applyForm);
      setApplySuccess('✅ Your application has been submitted successfully!');
      setShowApply(false);
    } catch (err) {
      setApplyError(err.response?.data?.message || 'Failed to submit application.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <img src="/wachemo-school.jpg" alt="Wachemo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800">Wachemo University</h1>
              <p className="text-xs text-gray-500">Career Opportunities</p>
            </div>
          </div>
          <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
            Staff Login →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-800 mb-3">💼 Join Our Team</h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Explore exciting career opportunities at Wachemo University Community School. 
            We are looking for passionate educators and staff to shape the future.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg">No open positions at the moment.</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon for new opportunities!</p>
          </div>
        ) : selected ? (
          /* Job Detail View */
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 mb-6 font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to All Jobs
            </button>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full font-medium">🟢 Open</span>
                <span className="bg-blue-50 text-blue-600 text-xs px-3 py-1 rounded-full">{selected.type}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{selected.title}</h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-6">
                <span>🏢 {selected.department}</span>
                <span>📍 {selected.location}</span>
                <span>💰 {selected.salary}</span>
                <span>📅 Deadline: {new Date(selected.deadline).toLocaleDateString()}</span>
              </div>

              <div className="mb-5">
                <h3 className="font-semibold text-gray-700 mb-2">About the Role</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{selected.description}</p>
              </div>
              <div className="mb-6">
                <h3 className="font-semibold text-gray-700 mb-2">Requirements</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{selected.requirements}</p>
              </div>

              {applySuccess ? (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm">{applySuccess}</div>
              ) : (
                <button onClick={() => setShowApply(!showApply)}
                  className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-semibold hover:bg-indigo-700 transition shadow-md">
                  {showApply ? '✕ Cancel Application' : '🚀 Apply Now'}
                </button>
              )}
            </div>

            {/* Apply Form */}
            {showApply && !applySuccess && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-semibold text-gray-800 mb-4 text-lg">📋 Application Form</h3>
                {applyError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-sm mb-3">{applyError}</div>}
                <form onSubmit={handleApply} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Full Name *</label>
                      <input required value={applyForm.name} onChange={e => setApplyForm({...applyForm, name: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                        placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Email *</label>
                      <input type="email" required value={applyForm.email} onChange={e => setApplyForm({...applyForm, email: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                        placeholder="your@email.com" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Phone Number</label>
                      <input value={applyForm.phone} onChange={e => setApplyForm({...applyForm, phone: e.target.value})}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none"
                        placeholder="+251 9XX XXX XXX" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Cover Letter / Motivation</label>
                    <textarea rows={4} value={applyForm.coverLetter} onChange={e => setApplyForm({...applyForm, coverLetter: e.target.value})}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-400 outline-none resize-none"
                      placeholder="Tell us why you're a great fit for this role..." />
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50">
                    {submitting ? 'Submitting...' : '📤 Submit Application'}
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* Job Listing Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {jobs.map(job => (
              <div key={job._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition cursor-pointer group"
                onClick={() => openJob(job)}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">{job.type}</span>
                  </div>
                  <span className="text-xs text-green-600 font-semibold">🟢 Open</span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1 group-hover:text-indigo-600 transition">{job.title}</h3>
                <p className="text-sm text-indigo-600 font-medium mb-3">{job.department}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 mb-4">
                  <span>📍 {job.location}</span>
                  <span>💰 {job.salary}</span>
                  <span>📅 {new Date(job.deadline).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4">{job.description}</p>
                <div className="flex justify-end">
                  <span className="text-sm text-indigo-600 font-medium group-hover:underline">View & Apply →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center py-8 text-xs text-gray-400">
        © {new Date().getFullYear()} Wachemo University Community School — All rights reserved
      </div>
    </div>
  );
}
