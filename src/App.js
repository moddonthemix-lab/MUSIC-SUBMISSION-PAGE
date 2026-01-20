import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, Star, ExternalLink } from 'lucide-react';
import './App.css';

export default function MusicSubmissionPlatform() {
  const [view, setView] = useState('home');
  const [submissions, setSubmissions] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [submissionType, setSubmissionType] = useState('review');
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showQueue, setShowQueue] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [queueOrder, setQueueOrder] = useState([]);
  const [formData, setFormData] = useState({
    email: '',
    artistName: '',
    trackTitle: '',
    socialHandle: '',
    priority: 'free',
    mixNotes: '',
    mixOption: 'standard',
    fileLink: ''
  });
  const fileInputRef = useRef(null);
  const isLive = true;

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      // Replace with your backend API
      const stored = localStorage.getItem('submissions');
      if (stored) {
        setSubmissions(JSON.parse(stored));
      }
      
      const queueData = localStorage.getItem('queue_order');
      if (queueData) {
        setQueueOrder(JSON.parse(queueData));
      }
    } catch (error) {
      console.log('No submissions yet');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // For mix & master, accept zip files. For reviews, accept audio files
      const validType = submissionType === 'mix'
        ? (file.type === 'application/zip' || file.type === 'application/x-zip-compressed' || file.name.endsWith('.zip'))
        : file.type.startsWith('audio/');

      if (validType) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setUploadedFile({
            name: file.name,
            data: event.target.result,
            type: file.type
          });
        };
        reader.readAsDataURL(file);
      } else {
        alert(submissionType === 'mix'
          ? 'Please upload a ZIP file for Mix & Master submissions'
          : 'Please upload an audio file (MP3, WAV, etc.)'
        );
      }
    }
  };

  const handleSubmit = async () => {
    // For mix & master, require either file OR link. For reviews, require file.
    const hasFile = uploadedFile !== null;
    const hasLink = formData.fileLink.trim() !== '';

    if (submissionType === 'mix') {
      if (!hasFile && !hasLink) {
        alert('Please either upload a ZIP file or provide a WeTransfer/Google Drive link');
        return;
      }
    } else {
      if (!hasFile) {
        alert('Please upload a track');
        return;
      }
    }

    if (!formData.email || !formData.artistName || !formData.trackTitle) {
      alert('Please fill in all required fields');
      return;
    }

    const requiresPayment = submissionType === 'review' ? formData.priority !== 'free' : true;

    // Open Cash App payment link if payment is required
    if (requiresPayment) {
      let amount = 0;
      if (submissionType === 'review') {
        if (formData.priority === 'priority') amount = 5;
        else if (formData.priority === 'premium') amount = 10;
        else if (formData.priority === 'king') amount = 25;
      } else {
        amount = formData.mixOption === 'standard' ? 60 : 100;
      }
      const cashAppUrl = `https://cash.app/$moddonthemix/${amount}`;
      window.open(cashAppUrl, '_blank');
    }

    const submission = {
      id: Date.now().toString(),
      ...formData,
      submissionType,
      fileName: uploadedFile ? uploadedFile.name : 'Link provided',
      fileData: uploadedFile ? uploadedFile.data : null,
      fileType: uploadedFile ? uploadedFile.type : null,
      submittedAt: new Date().toISOString(),
      status: 'pending',
      paid: requiresPayment
    };

    try {
      const stored = localStorage.getItem('submissions');
      const existing = stored ? JSON.parse(stored) : [];
      existing.push(submission);
      localStorage.setItem('submissions', JSON.stringify(existing));

      await loadSubmissions();
      setFormData({ email: '', artistName: '', trackTitle: '', socialHandle: '', priority: 'free', mixNotes: '', mixOption: 'standard', fileLink: '' });
      setUploadedFile(null);

      if (requiresPayment) {
        alert('Submission successful! Cash App has opened - please complete your payment.');
      } else {
        alert('Free submission successful!');
      }
      setView('home');
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Error submitting track. Please try again.');
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'producertour') {
      setIsAdmin(true);
      setView('admin');
      setAdminPassword('');
    } else {
      alert('Incorrect password');
    }
  };

  const updateSubmissionStatus = async (id, newStatus) => {
    try {
      const stored = localStorage.getItem('submissions');
      if (stored) {
        const subs = JSON.parse(stored);
        const updated = subs.map(s => s.id === id ? {...s, status: newStatus} : s);
        localStorage.setItem('submissions', JSON.stringify(updated));
        await loadSubmissions();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteSubmission = async (id) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        const stored = localStorage.getItem('submissions');
        if (stored) {
          const subs = JSON.parse(stored);
          const filtered = subs.filter(s => s.id !== id);
          localStorage.setItem('submissions', JSON.stringify(filtered));
          await loadSubmissions();
        }
      } catch (error) {
        console.error('Error deleting submission:', error);
      }
    }
  };

  const getQueuedSubmissions = () => {
    const pending = submissions.filter(s => s.submissionType === 'review' && s.status === 'pending');
    
    if (queueOrder.length === 0) {
      return pending.sort((a, b) => {
        const priorityOrder = { king: 0, premium: 1, priority: 2, free: 3 };
        const aPriority = priorityOrder[a.priority] ?? 4;
        const bPriority = priorityOrder[b.priority] ?? 4;
        if (aPriority !== bPriority) return aPriority - bPriority;
        return new Date(a.submittedAt) - new Date(b.submittedAt);
      });
    }
    
    const ordered = [];
    const unordered = [...pending];
    
    queueOrder.forEach(id => {
      const index = unordered.findIndex(s => s.id === id);
      if (index !== -1) {
        ordered.push(unordered[index]);
        unordered.splice(index, 1);
      }
    });
    
    return [...ordered, ...unordered];
  };

  const saveQueueOrder = async (newOrder) => {
    try {
      localStorage.setItem('queue_order', JSON.stringify(newOrder));
      setQueueOrder(newOrder);
    } catch (error) {
      console.error('Error saving queue order:', error);
    }
  };

  const handleDragStart = (e, submission) => {
    setDraggedItem(submission);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetSubmission) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.id === targetSubmission.id) return;

    const queuedSubs = getQueuedSubmissions();
    const draggedIndex = queuedSubs.findIndex(s => s.id === draggedItem.id);
    const targetIndex = queuedSubs.findIndex(s => s.id === targetSubmission.id);

    const newQueue = [...queuedSubs];
    newQueue.splice(draggedIndex, 1);
    newQueue.splice(targetIndex, 0, draggedItem);

    const newOrder = newQueue.map(s => s.id);
    saveQueueOrder(newOrder);
    setDraggedItem(null);
  };

  const getFilteredSubmissions = () => {
    let filtered = [...submissions];
    
    if (filterType !== 'all') {
      filtered = filtered.filter(sub => sub.submissionType === filterType);
    }
    
    if (filterPriority !== 'all') {
      filtered = filtered.filter(sub => sub.priority === filterPriority);
    }
    
    return filtered.sort((a, b) => {
      const priorityOrder = { king: 0, premium: 1, priority: 2, free: 3 };
      const aPriority = priorityOrder[a.priority] ?? 4;
      const bPriority = priorityOrder[b.priority] ?? 4;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    });
  };

  const getPriorityInfo = (priority) => {
    const info = {
      free: { label: 'Free', price: 'Free', color: 'bg-gray-600', tier: 'Tier 4' },
      priority: { label: 'Priority', price: '$5', color: 'bg-blue-600', tier: 'Tier 3' },
      premium: { label: 'Premium', price: '$10', color: 'bg-purple-600', tier: 'Tier 2' },
      king: { label: 'King', price: '$25', color: 'bg-yellow-600', tier: 'Top Tier' }
    };
    return info[priority];
  };

  // ADMIN LOGIN VIEW
  if (view === 'adminLogin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white flex items-center justify-center p-8">
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-8 border border-gray-700 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
            placeholder="Enter password"
            className="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 outline-none mb-4"
          />
          <button
            onClick={handleAdminLogin}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-bold mb-3"
          >
            Login
          </button>
          <button
            onClick={() => {
              setView('home');
              setAdminPassword('');
            }}
            className="w-full py-2 text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }
  // ADMIN DASHBOARD VIEW
  if (view === 'admin') {
    const filteredSubs = getFilteredSubmissions();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">Manage all submissions and payments</p>
            </div>
            <button
              onClick={() => {
                setView('home');
                setIsAdmin(false);
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Logout
            </button>
          </div>

          {/* Filters */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 mb-6 border border-gray-700">
            <div className="flex gap-4 flex-wrap">
              <div>
                <label className="text-sm text-gray-400 block mb-2">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <option value="all">All Types</option>
                  <option value="review">Live Review</option>
                  <option value="mix">Mix & Master</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-2">Priority</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-2 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <option value="all">All Priorities</option>
                  <option value="king">King ($25)</option>
                  <option value="premium">Premium ($10)</option>
                  <option value="priority">Priority ($5)</option>
                  <option value="free">Free</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="text-sm">
                  <span className="text-gray-400">Total: </span>
                  <span className="font-bold text-xl">{filteredSubs.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Queue Manager - Drag and Drop */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 mb-6 border border-gray-700">
            <h3 className="text-xl font-bold mb-4">Queue Manager (Drag to Reorder)</h3>
            <p className="text-sm text-gray-400 mb-4">Top 20 songs in queue - drag and drop to change order</p>
            <div className="space-y-2">
              {getQueuedSubmissions().slice(0, 20).map((sub, index) => {
                const info = getPriorityInfo(sub.priority);
                return (
                  <div
                    key={sub.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, sub)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, sub)}
                    className={`bg-gray-900/50 rounded-lg p-4 flex items-center gap-4 cursor-move hover:bg-gray-700/50 ${draggedItem?.id === sub.id ? 'opacity-50' : ''}`}
                  >
                    <div className={`w-10 h-10 rounded-full ${info.color} flex items-center justify-center font-bold`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{sub.trackTitle}</p>
                      <p className="text-sm text-gray-400">{sub.artistName}</p>
                    </div>
                    <span className={`px-3 py-1 ${info.color} rounded-full text-xs font-bold`}>
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Artist</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Track</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Priority</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Contact</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Payment</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubs.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                        No submissions found
                      </td>
                    </tr>
                  ) : (
                    filteredSubs.map((sub) => {
                      const priorityInfo = getPriorityInfo(sub.priority);
                      return (
                        <tr key={sub.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-semibold">{sub.artistName}</p>
                              {sub.socialHandle && (
                                <p className="text-xs text-gray-400">{sub.socialHandle}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{sub.trackTitle}</p>
                            {sub.fileLink ? (
                              <p className="text-xs text-blue-400">📎 Link provided</p>
                            ) : (
                              <p className="text-xs text-gray-400">{sub.fileName}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              sub.submissionType === 'review' ? 'bg-purple-600' : 'bg-blue-600'
                            }`}>
                              {sub.submissionType === 'review' ? 'Review' : `Mix ${sub.mixOption === 'live' ? '(Live)' : ''}`}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${priorityInfo.color}`}>
                              {priorityInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm">{sub.email}</p>
                            {sub.socialHandle && (
                              <p className="text-xs text-gray-400 mt-1">TikTok: {sub.socialHandle}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {sub.paid ? (
                              <span className="text-green-400 text-xs font-semibold">✓ Paid</span>
                            ) : (
                              <span className="text-gray-400 text-xs">Free</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={sub.status}
                              onChange={(e) => updateSubmissionStatus(sub.id, e.target.value)}
                              className="px-2 py-1 bg-gray-700 rounded text-xs"
                            >
                              <option value="pending">Pending</option>
                              <option value="in-progress">In Progress</option>
                              <option value="completed">Completed</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {sub.fileLink ? (
                                <a
                                  href={sub.fileLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-xs font-semibold"
                                >
                                  Open Link
                                </a>
                              ) : sub.fileData ? (
                                <a
                                  href={sub.fileData}
                                  download={sub.fileName}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs font-semibold"
                                >
                                  Download
                                </a>
                              ) : (
                                <span className="px-3 py-1 bg-gray-600 rounded text-xs">No File</span>
                              )}
                              <button
                                onClick={() => deleteSubmission(sub.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mix Notes Section */}
          {filteredSubs.some(sub => sub.mixNotes) && (
            <div className="mt-6 bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              <h3 className="font-bold mb-4">Mix Notes</h3>
              {filteredSubs.filter(sub => sub.mixNotes).map(sub => (
                <div key={sub.id} className="mb-3 p-3 bg-gray-900/50 rounded">
                  <p className="font-semibold text-sm mb-1">{sub.artistName} - {sub.trackTitle}</p>
                  <p className="text-sm text-gray-300">{sub.mixNotes}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }
  // SUBMIT FORM VIEW
  if (view === 'submit') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white p-8">
        <div className="max-w-5xl mx-auto">
          <button 
            onClick={() => setView('home')}
            className="mb-6 text-blue-300 hover:text-blue-200"
          >
            ← Back to Home
          </button>

          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 mx-auto mb-4 flex items-center justify-center">
              <Music className="w-10 h-10" />
            </div>
            {isLive && <span className="inline-block px-3 py-1 bg-red-500 rounded-full text-sm font-bold mb-2">🔴 LIVE</span>}
            <h1 className="text-3xl font-bold mb-2">Submit to @Moddonthemix</h1>
            <p className="text-gray-300">Drag & drop your track or load from library</p>
          </div>

          {/* Tab Selection */}
          <div className="flex gap-4 mb-6 justify-center">
            <button 
              onClick={() => setSubmissionType('review')}
              className={`px-6 py-2 rounded-full font-semibold flex items-center gap-2 ${
                submissionType === 'review' ? 'bg-purple-600' : 'bg-gray-700'
              }`}
            >
              <Music className="w-4 h-4" />
              Live Review
            </button>
            <button 
              onClick={() => setSubmissionType('mix')}
              className={`px-6 py-2 rounded-full font-semibold ${
                submissionType === 'mix' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              Mix & Master
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold">
                  {submissionType === 'mix' ? 'Upload Files or Share Link' : 'Submit Your Track'}
                </h2>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept={submissionType === 'mix' ? '.zip,application/zip,application/x-zip-compressed' : 'audio/*'}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-purple-500 transition-colors mb-4"
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-300">
                  {submissionType === 'mix' ? 'Click to upload ZIP file' : 'Click to upload track'}
                </p>
                {uploadedFile && (
                  <p className="mt-2 text-sm text-green-400">✓ {uploadedFile.name}</p>
                )}
              </div>

              {submissionType === 'mix' && (
                <div>
                  <div className="text-center text-gray-400 text-sm mb-3">- OR -</div>
                  <input
                    type="text"
                    value={formData.fileLink}
                    onChange={(e) => setFormData({...formData, fileLink: e.target.value})}
                    placeholder="Paste WeTransfer or Google Drive link"
                    className="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 outline-none text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-2">Share your project files via WeTransfer or Google Drive</p>
                </div>
              )}
            </div>

            {/* Form Section */}
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              {submissionType === 'mix' ? (
                <>
                  {/* Mix & Master Options */}
                  <h2 className="text-xl font-bold mb-4">Selected Service</h2>
                  <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
                    <h3 className="text-2xl font-bold mb-4">Mix & Master</h3>
                    <div className="space-y-3 mb-6">
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-300">Professional mix and master</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-300">Industry quality output</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-300">Includes radio versions and acapellas</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-gray-300">Delivery within 1-3 days (EXCLUDING SUNDAYS)</span>
                      </div>
                    </div>

                    <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="radio"
                          name="mixOption"
                          value="standard"
                          checked={formData.mixOption === 'standard'}
                          onChange={(e) => setFormData({...formData, mixOption: e.target.value})}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm font-semibold">Private No Stream Mix & Master</span>
                          <span className="text-2xl font-bold text-blue-300">$60</span>
                        </div>
                      </label>
                    </div>

                    <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-4">
                      <label className="flex items-center gap-3 cursor-pointer mb-2">
                        <input
                          type="radio"
                          name="mixOption"
                          value="live"
                          checked={formData.mixOption === 'live'}
                          onChange={(e) => setFormData({...formData, mixOption: e.target.value})}
                          className="w-4 h-4"
                        />
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm font-semibold">Mix & Master on Live Stream</span>
                          <span className="text-2xl font-bold text-purple-300">$100</span>
                        </div>
                      </label>
                      <p className="text-xs text-gray-400 ml-7">Get your track mixed live with audience interaction</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Live Review Priority Options */}
                  <h2 className="text-xl font-bold mb-4">Select Priority</h2>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-gray-400">QUEUE PRIORITY</span>
                      <span className="text-xs px-2 py-1 bg-gray-700 rounded">{getPriorityInfo(formData.priority).tier}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      {['free', 'priority', 'premium', 'king'].map((p) => {
                        const info = getPriorityInfo(p);
                        return (
                          <button
                            key={p}
                            onClick={() => setFormData({...formData, priority: p})}
                            className={`py-3 rounded-lg font-semibold ${
                              formData.priority === p ? info.color : 'bg-gray-700'
                            }`}
                          >
                            {info.price}
                          </button>
                        );
                      })}
                    </div>
                    
                    {formData.priority === 'king' && (
                      <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                        <p className="text-xs text-yellow-200">
                          <strong>👑 King Tier:</strong> 2 songs back to back! Skip everyone in order of kings.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 mb-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-xs text-gray-300">
                        I certify that I own or have the rights to use this content. I grant @Moddonthemix permission to review this content live.
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* Contact Form Fields */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="text-sm font-semibold block mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1">Artist Name *</label>
                  <input
                    type="text"
                    value={formData.artistName}
                    onChange={(e) => setFormData({...formData, artistName: e.target.value})}
                    placeholder="Your artist name"
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1">Track Title *</label>
                  <input
                    type="text"
                    value={formData.trackTitle}
                    onChange={(e) => setFormData({...formData, trackTitle: e.target.value})}
                    placeholder="Song title"
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold block mb-1">TikTok Handle (optional)</label>
                  <input
                    type="text"
                    value={formData.socialHandle}
                    onChange={(e) => setFormData({...formData, socialHandle: e.target.value})}
                    placeholder="@yourhandle"
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
                  />
                </div>

                {submissionType === 'mix' && (
                  <div>
                    <label className="text-sm font-semibold block mb-1">Mix Notes</label>
                    <textarea
                      value={formData.mixNotes}
                      onChange={(e) => setFormData({...formData, mixNotes: e.target.value})}
                      placeholder="Tell me what you want me to focus on"
                      rows="4"
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-200">
                  Free submissions are welcome! Please follow me on TikTok to support the stream: <span className="font-bold">@Moddonthemix</span>
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold"
              >
                {submissionType === 'mix'
                  ? `Submit & Pay $${formData.mixOption === 'standard' ? '60' : '100'}`
                  : (formData.priority === 'free'
                    ? 'Submit Free'
                    : `Submit & Pay $${formData.priority === 'priority' ? '5' : formData.priority === 'premium' ? '10' : '25'}`
                  )
                }
              </button>

              {(submissionType === 'mix' || formData.priority !== 'free') && (
                <p className="text-xs text-gray-400 text-center mt-2">
                  Cash App will open in a new window for payment
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  // HOMEPAGE VIEW
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 text-white">
      {/* Hero Section */}
      <div className="text-center py-20 px-8">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">
          Submit Your Music
        </h1>
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Get your tracks deeply reviewed by charting engineers, get mixes, and get your song mixed on live stream!
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button 
            onClick={() => setView('submit')}
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-full font-bold text-lg transition-all"
          >
            Send Your Music
          </button>
          <button 
            onClick={() => setShowQueue(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full font-bold text-lg transition-all"
          >
            View Queue
          </button>
          <button 
            onClick={() => window.open('https://tiktok.com/@moddonthemix', '_blank')}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-full font-bold text-lg transition-all flex items-center gap-2"
          >
            JOIN THE LIVE
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
        
        {!isAdmin && view === 'home' && (
          <div className="mt-8">
            <button
              onClick={() => setView('adminLogin')}
              className="text-sm text-gray-500 hover:text-gray-400"
            >
              Admin
            </button>
          </div>
        )}
      </div>

      {/* Queue Modal */}
      {showQueue && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden border border-gray-700">
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Submission Queue - Top 20</h2>
              <button
                onClick={() => setShowQueue(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
              >
                Close
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              {getQueuedSubmissions().slice(0, 20).length === 0 ? (
                <p className="text-center text-gray-400 py-8">No submissions in queue</p>
              ) : (
                <div className="space-y-3">
                  {getQueuedSubmissions().slice(0, 20).map((sub, index) => {
                    const info = getPriorityInfo(sub.priority);
                    return (
                      <div key={sub.id} className="bg-gray-900/50 rounded-lg p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full ${info.color} flex items-center justify-center font-bold text-xl`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold">{sub.trackTitle}</p>
                          <p className="text-sm text-gray-400">{sub.artistName}</p>
                        </div>
                        <span className={`px-3 py-1 ${info.color} rounded-full text-xs font-bold`}>
                          {info.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-8 pb-16">
        {/* How This Works Section */}
        <div className="mb-16">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            How This Works
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Live Mix Reviews */}
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-6 text-purple-400">How Live Mix Reviews Work</h3>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Submit Your Song</h4>
                    <p className="text-gray-300 text-sm">Submit your song through the form above</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Live Review</h4>
                    <p className="text-gray-300 text-sm">I review 60 secs or the full song live on stream</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">Get Feedback</h4>
                    <p className="text-gray-300 text-sm">Clear, actionable feedback on mixing, recording and musical advice</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
                <p className="text-sm text-yellow-200">
                  <span className="font-bold">Note:</span> Free submissions are rotation-based and not guaranteed.
                </p>
              </div>

              <div className="mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
                <h4 className="font-bold text-red-300 mb-2 flex items-center gap-2">
                  🛑 SUBMISSION RULES 🛑
                </h4>
                <ul className="space-y-2 text-sm text-red-200">
                  <li><strong>NO APPLE/SPOTIFY OR RELEASED MUSIC OR WAV FILES</strong></li>
                  <li>Unreleased Music ONLY</li>
                  <li><strong>MP3s only</strong></li>
                  <li>Can upgrade priority after submitting via Cash App</li>
                </ul>
              </div>
            </div>

            {/* Live Mix Sessions */}
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-6 text-blue-400">How Live Mix Sessions Work (Paid)</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-300">Full song mixed live on stream</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-300">Real-time explanations</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-300">Final high-quality mix delivered</p>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-gray-300">Optional permission to clip session for exposure</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                <p className="text-sm text-blue-200">
                  Perfect for artists who want to learn while getting professional results!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Music className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-center">Direct Submissions</h3>
            <p className="text-gray-300 text-center">
              Send your tracks directly to live queues with priority options.
            </p>
          </div>

          <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
            <div className="w-16 h-16 bg-pink-600 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <Star className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-center">Get Feedback</h3>
            <p className="text-gray-300 text-center">
              Receive live feedback or get your song mixed and mastered to industry quality or get your song mixed on live stream.
            </p>
          </div>
        </div>

        {/* Recent Submissions */}
        {submissions.length > 0 && (
          <div className="mt-8 bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-6">Recent Submissions</h2>
            <div className="space-y-3">
              {submissions.slice(0, 5).map((sub) => {
                const info = getPriorityInfo(sub.priority);
                return (
                  <div key={sub.id} className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Music className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="font-semibold">{sub.trackTitle}</p>
                        <p className="text-sm text-gray-400">{sub.artistName}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 ${info.color} rounded-full text-xs font-bold`}>
                      {info.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}