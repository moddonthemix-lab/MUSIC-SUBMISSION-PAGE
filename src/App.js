import React, { useState, useRef, useEffect } from 'react';
import { Upload, Music, Star } from 'lucide-react';
import './App.css';
import { supabase } from './supabaseClient';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [isValidatingCode, setIsValidatingCode] = useState(false);
  const [affiliateCodes, setAffiliateCodes] = useState([]);
  const [showAffiliateManager, setShowAffiliateManager] = useState(false);
  const [nowPlayingId, setNowPlayingId] = useState(null);
  const [newCodeForm, setNewCodeForm] = useState({
    code: '',
    affiliate_name: '',
    affiliate_email: '',
    discount_percentage: 15
  });
  const [formData, setFormData] = useState({
    email: '',
    artistName: '',
    trackTitle: '',
    socialHandle: '',
    priority: 'free',
    mixNotes: '',
    mixOption: 'standard',
    fileLink: '',
    subscriptionTier: null,
    recordingDuration: '1hour',
    recordingStudio: 'home'
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadSubmissions();
    loadNowPlaying();

    // Subscribe to realtime changes on submissions table
    const submissionsSubscription = supabase
      .channel('submissions-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'submissions' }, () => {
        loadSubmissions();
      })
      .subscribe();

    // Subscribe to realtime changes on settings table (now playing)
    const settingsSubscription = supabase
      .channel('settings-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => {
        loadNowPlaying();
      })
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      submissionsSubscription.unsubscribe();
      settingsSubscription.unsubscribe();
    };
  }, []);

  const loadSubmissions = async () => {
    try {
      // Fetch submissions from Supabase
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Convert snake_case from database to camelCase for React
        const submissions = data.map(sub => ({
          id: sub.id,
          email: sub.email,
          artistName: sub.artist_name,
          trackTitle: sub.track_title,
          socialHandle: sub.social_handle,
          priority: sub.priority,
          mixNotes: sub.mix_notes,
          mixOption: sub.mix_option,
          fileLink: sub.file_link,
          submissionType: sub.submission_type,
          fileName: sub.file_name,
          fileData: sub.file_data,
          fileType: sub.file_type,
          submittedAt: sub.submitted_at,
          status: sub.status,
          paid: sub.paid,
          affiliateCode: sub.affiliate_code,
          originalPrice: sub.original_price,
          discountAmount: sub.discount_amount,
          finalPrice: sub.final_price
        }));
        setSubmissions(submissions);
      }

      // Load queue order
      const { data: queueData } = await supabase
        .from('queue_order')
        .select('submission_ids')
        .limit(1)
        .single();

      if (queueData && queueData.submission_ids) {
        setQueueOrder(queueData.submission_ids);
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const validateAffiliateCode = async (code) => {
    if (!code.trim()) {
      setAppliedDiscount(null);
      return;
    }

    setIsValidatingCode(true);
    try {
      const { data, error } = await supabase
        .from('affiliate_codes')
        .select('*')
        .eq('code', code.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !data) {
        alert('Invalid or inactive discount code');
        setAppliedDiscount(null);
      } else {
        setAppliedDiscount(data);
        alert(`${data.discount_percentage}% discount applied!`);
      }
    } catch (error) {
      console.error('Error validating code:', error);
      setAppliedDiscount(null);
    } finally {
      setIsValidatingCode(false);
    }
  };

  const calculatePrice = () => {
    let basePrice = 0;

    if (submissionType === 'review') {
      if (formData.priority === 'priority') basePrice = 5;
      else if (formData.priority === 'premium') basePrice = 10;
      else if (formData.priority === 'king') basePrice = 25;
    } else if (submissionType === 'consultation') {
      basePrice = 50;
    } else if (submissionType === 'recording') {
      // Handle recording session pricing
      if (formData.recordingStudio === 'home') {
        // Home studio pricing
        if (formData.recordingDuration === '1hour') basePrice = 55;
        else if (formData.recordingDuration === '2hour') basePrice = 100;
        else if (formData.recordingDuration === '3hour') basePrice = 150;
        else if (formData.recordingDuration === '4hour') basePrice = 180;
        else if (formData.recordingDuration === '5hour') basePrice = 225;
        else if (formData.recordingDuration === '8hour') basePrice = 320;
      } else if (formData.recordingStudio === 'blackdiamond') {
        // Black Diamond Studios pricing
        if (formData.recordingDuration === '1hour') basePrice = 100;
        else if (formData.recordingDuration === '2hour') basePrice = 195;
        else if (formData.recordingDuration === '3hour') basePrice = 280;
        else if (formData.recordingDuration === '4hour') basePrice = 360;
        else if (formData.recordingDuration === '5hour') basePrice = 435;
      }
    } else {
      // Handle subscription tiers for mix & master
      if (formData.mixOption === 'subscription-tier1') {
        basePrice = 175;
      } else if (formData.mixOption === 'subscription-tier2') {
        basePrice = 325;
      } else {
        basePrice = formData.mixOption === 'standard' ? 75 : 100;
      }
    }

    if (basePrice === 0) return { original: 0, discount: 0, final: 0 };

    const discountAmount = appliedDiscount
      ? (basePrice * appliedDiscount.discount_percentage) / 100
      : 0;
    const finalPrice = basePrice - discountAmount;

    return {
      original: basePrice,
      discount: discountAmount,
      final: finalPrice
    };
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
    // Prevent double submission
    if (isSubmitting) return;

    // For mix & master, require either file OR link. For reviews, require file. For consultation and recording, no file needed.
    const hasFile = uploadedFile !== null;
    const hasLink = formData.fileLink.trim() !== '';

    if (submissionType === 'mix') {
      if (!hasFile && !hasLink) {
        alert('Please either upload a ZIP file or provide a WeTransfer/Google Drive link');
        return;
      }
    } else if (submissionType === 'review') {
      if (!hasFile) {
        alert('Please upload a track');
        return;
      }
    }
    // For consultation and recording, no file is required

    if (!formData.email || !formData.artistName || !formData.trackTitle) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    const requiresPayment = submissionType === 'review' ? formData.priority !== 'free' : true; // Mix, consultation, recording always require payment

    // Calculate pricing with discount
    const pricing = calculatePrice();

    // Open Cash App payment link if payment is required
    if (requiresPayment) {
      const cashAppUrl = `https://cash.app/$moddonthemix/${pricing.final}`;
      window.open(cashAppUrl, '_blank');
    }

    // Prepare submission data for Supabase (convert camelCase to snake_case)
    const submissionData = {
      id: Date.now().toString(),
      email: formData.email,
      artist_name: formData.artistName,
      track_title: formData.trackTitle,
      social_handle: formData.socialHandle || null,
      priority: formData.priority,
      mix_notes: submissionType === 'recording' ? `Recording Session: ${formData.recordingDuration} at ${formData.recordingStudio === 'home' ? 'Home Studio' : 'Black Diamond Studios'}` : (formData.mixNotes || null),
      mix_option: submissionType === 'recording' ? formData.recordingDuration : (formData.mixOption || null),
      file_link: formData.fileLink || null,
      submission_type: submissionType,
      file_name: uploadedFile ? uploadedFile.name : (submissionType === 'recording' || submissionType === 'consultation' ? 'No file required' : 'Link provided'),
      file_data: uploadedFile ? uploadedFile.data : null,
      file_type: uploadedFile ? uploadedFile.type : null,
      submitted_at: new Date().toISOString(),
      status: 'pending',
      paid: requiresPayment,
      affiliate_code: appliedDiscount ? appliedDiscount.code : null,
      original_price: pricing.original,
      discount_amount: pricing.discount,
      final_price: pricing.final
    };

    try {
      // Insert submission into Supabase
      const { error } = await supabase
        .from('submissions')
        .insert([submissionData]);

      if (error) throw error;

      await loadSubmissions();

      // Get Calendly link for consultation and recording sessions
      const calendlyLink = getCalendlyLink(submissionData);

      // Auto-open Calendly link for booking
      if (calendlyLink) {
        setTimeout(() => {
          window.open(calendlyLink, '_blank');
        }, 1000); // Small delay to ensure Cash App opens first
      }

      setFormData({ email: '', artistName: '', trackTitle: '', socialHandle: '', priority: 'free', mixNotes: '', mixOption: 'standard', fileLink: '', subscriptionTier: null, recordingDuration: '1hour', recordingStudio: 'home' });
      setUploadedFile(null);
      setAffiliateCode('');
      setAppliedDiscount(null);

      if (requiresPayment) {
        if (calendlyLink) {
          alert(`Submission successful!\n\n1. Cash App has opened - please complete your payment of $${pricing.final.toFixed(2)}\n2. Your Calendly booking link has opened - book your session!\n\nCalendly Link: ${calendlyLink}`);
        } else {
          alert('Submission successful! Cash App has opened - please complete your payment.');
        }
      } else {
        alert('Free submission successful!');
      }
      setView('home');
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Error submitting track. Please try again.');
    } finally {
      setIsSubmitting(false);
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
      const { error } = await supabase
        .from('submissions')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      await loadSubmissions();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteSubmission = async (id) => {
    if (window.confirm('Are you sure you want to delete this submission?')) {
      try {
        const { error } = await supabase
          .from('submissions')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await loadSubmissions();
      } catch (error) {
        console.error('Error deleting submission:', error);
      }
    }
  };

  const loadAffiliateCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliate_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAffiliateCodes(data || []);
    } catch (error) {
      console.error('Error loading affiliate codes:', error);
    }
  };

  const createAffiliateCode = async () => {
    if (!newCodeForm.code || !newCodeForm.affiliate_name) {
      alert('Please fill in code and affiliate name');
      return;
    }

    try {
      const { error } = await supabase
        .from('affiliate_codes')
        .insert([{
          code: newCodeForm.code.toUpperCase(),
          affiliate_name: newCodeForm.affiliate_name,
          affiliate_email: newCodeForm.affiliate_email || null,
          discount_percentage: newCodeForm.discount_percentage,
          is_active: true
        }]);

      if (error) throw error;

      alert('Affiliate code created successfully!');
      setNewCodeForm({ code: '', affiliate_name: '', affiliate_email: '', discount_percentage: 15 });
      await loadAffiliateCodes();
    } catch (error) {
      console.error('Error creating code:', error);
      alert('Error creating code: ' + error.message);
    }
  };

  const updateAffiliateCode = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('affiliate_codes')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await loadAffiliateCodes();
    } catch (error) {
      console.error('Error updating code:', error);
    }
  };

  const deleteAffiliateCode = async (id) => {
    if (window.confirm('Are you sure you want to delete this affiliate code?')) {
      try {
        const { error } = await supabase
          .from('affiliate_codes')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await loadAffiliateCodes();
      } catch (error) {
        console.error('Error deleting code:', error);
      }
    }
  };

  const getAffiliateStats = (code) => {
    const codeSubmissions = submissions.filter(s => s.affiliateCode === code);
    return {
      count: codeSubmissions.length,
      revenue: codeSubmissions.reduce((sum, s) => sum + (s.finalPrice || 0), 0)
    };
  };

  const loadNowPlaying = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('now_playing_id')
        .eq('id', 1)
        .single();

      if (error) throw error;
      setNowPlayingId(data?.now_playing_id || null);
    } catch (error) {
      console.error('Error loading now playing:', error);
    }
  };

  const setNowPlaying = async (submissionId) => {
    try {
      const { error } = await supabase
        .from('settings')
        .update({ now_playing_id: submissionId, updated_at: new Date().toISOString() })
        .eq('id', 1);

      if (error) throw error;
      setNowPlayingId(submissionId);
    } catch (error) {
      console.error('Error setting now playing:', error);
    }
  };

  const clearNowPlaying = async () => {
    await setNowPlaying(null);
  };

  const getNowPlayingSubmission = () => {
    return submissions.find(s => s.id === nowPlayingId);
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
      const { error } = await supabase
        .from('queue_order')
        .update({ submission_ids: newOrder })
        .eq('id', 1); // Assuming we have one queue_order row with id 1

      if (error) throw error;
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

  const getCalendlyLink = (submission) => {
    // Return appropriate Calendly link based on submission type
    if (submission.submissionType === 'consultation') {
      return 'https://calendly.com/moddonthemix/30min';
    } else if (submission.submissionType === 'recording') {
      const durationLinks = {
        '1hour': 'https://calendly.com/moddonthemix/1hr-session',
        '2hour': 'https://calendly.com/moddonthemix/2-hour-studio-session-110',
        '3hour': 'https://calendly.com/moddonthemix/3-hour-studio-session',
        '4hour': 'https://calendly.com/moddonthemix/4hr-block-deal',
        '5hour': 'https://calendly.com/moddonthemix/5hr-session',
        '8hour': 'https://calendly.com/moddonthemix/8hr-session'
      };
      return durationLinks[submission.mixOption] || null;
    }
    return null;
  };

  const copyCalendlyLink = (submission) => {
    const link = getCalendlyLink(submission);
    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        alert('Calendly link copied to clipboard!');
      }).catch(() => {
        alert('Failed to copy link. Link: ' + link);
      });
    }
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
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAffiliateManager(!showAffiliateManager);
                  if (!showAffiliateManager) loadAffiliateCodes();
                }}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
              >
                {showAffiliateManager ? 'Hide' : 'Manage'} Affiliate Codes
              </button>
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
                  <option value="consultation">Consultation</option>
                  <option value="recording">Recording Session</option>
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

          {/* Affiliate Code Manager */}
          {showAffiliateManager && (
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 mb-6 border border-gray-700">
              <h3 className="text-2xl font-bold mb-6">Affiliate Code Manager</h3>

              {/* Create New Code Form */}
              <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
                <h4 className="text-lg font-bold mb-4">Create New Affiliate Code</h4>
                <div className="grid md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Code *</label>
                    <input
                      type="text"
                      value={newCodeForm.code}
                      onChange={(e) => setNewCodeForm({...newCodeForm, code: e.target.value.toUpperCase()})}
                      placeholder="PRODUCER15"
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Affiliate Name *</label>
                    <input
                      type="text"
                      value={newCodeForm.affiliate_name}
                      onChange={(e) => setNewCodeForm({...newCodeForm, affiliate_name: e.target.value})}
                      placeholder="DJ Smith"
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Email (optional)</label>
                    <input
                      type="email"
                      value={newCodeForm.affiliate_email}
                      onChange={(e) => setNewCodeForm({...newCodeForm, affiliate_email: e.target.value})}
                      placeholder="affiliate@email.com"
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 block mb-2">Discount %</label>
                    <input
                      type="number"
                      value={newCodeForm.discount_percentage}
                      onChange={(e) => setNewCodeForm({...newCodeForm, discount_percentage: parseInt(e.target.value) || 0})}
                      min="1"
                      max="100"
                      className="w-full px-4 py-2 bg-gray-700 rounded-lg border border-gray-600"
                    />
                  </div>
                </div>
                <button
                  onClick={createAffiliateCode}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-semibold"
                >
                  Create Code
                </button>
              </div>

              {/* Existing Codes Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Code</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Affiliate</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Discount</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Uses</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Revenue</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliateCodes.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                          No affiliate codes yet. Create one above!
                        </td>
                      </tr>
                    ) : (
                      affiliateCodes.map((code) => {
                        const stats = getAffiliateStats(code.code);
                        return (
                          <tr key={code.id} className="border-t border-gray-700 hover:bg-gray-700/30">
                            <td className="px-4 py-3">
                              <span className="font-mono font-bold text-purple-400">{code.code}</span>
                            </td>
                            <td className="px-4 py-3">{code.affiliate_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-400">{code.affiliate_email || '-'}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 bg-blue-600 rounded text-xs font-bold">
                                {code.discount_percentage}% OFF
                              </span>
                            </td>
                            <td className="px-4 py-3 font-semibold">{stats.count}</td>
                            <td className="px-4 py-3 font-semibold text-green-400">
                              ${stats.revenue.toFixed(2)}
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => updateAffiliateCode(code.id, { is_active: !code.is_active })}
                                className={`px-3 py-1 rounded text-xs font-semibold ${
                                  code.is_active ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'
                                }`}
                              >
                                {code.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => deleteAffiliateCode(code.id)}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs font-semibold"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Now Playing Section */}
          {nowPlayingId && getNowPlayingSubmission() && (
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur rounded-xl p-6 mb-6 border-2 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center animate-pulse">
                    <Music className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Now Playing</h3>
                    <p className="text-sm text-purple-200">Currently being reviewed</p>
                  </div>
                </div>
                <button
                  onClick={clearNowPlaying}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm"
                >
                  Clear
                </button>
              </div>
              <div className="bg-black/30 rounded-lg p-4">
                <p className="text-2xl font-bold mb-1">{getNowPlayingSubmission().trackTitle}</p>
                <p className="text-lg text-gray-300 mb-2">by {getNowPlayingSubmission().artistName}</p>
                <div className="flex gap-2 items-center">
                  <span className={`px-3 py-1 ${getPriorityInfo(getNowPlayingSubmission().priority).color} rounded-full text-xs font-bold`}>
                    {getPriorityInfo(getNowPlayingSubmission().priority).label}
                  </span>
                  {getNowPlayingSubmission().socialHandle && (
                    <span className="text-sm text-gray-400">TikTok: {getNowPlayingSubmission().socialHandle}</span>
                  )}
                </div>
              </div>
            </div>
          )}

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
                    {nowPlayingId !== sub.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setNowPlaying(sub.id);
                        }}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-semibold"
                      >
                        Set Now Playing
                      </button>
                    )}
                    {nowPlayingId === sub.id && (
                      <span className="px-3 py-1 bg-green-600 rounded text-xs font-semibold flex items-center gap-1">
                        <Music className="w-3 h-3" /> Playing
                      </span>
                    )}
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
                              sub.submissionType === 'review' ? 'bg-purple-600' :
                              sub.submissionType === 'consultation' ? 'bg-orange-600' :
                              sub.submissionType === 'recording' ? 'bg-yellow-600' : 'bg-blue-600'
                            }`}>
                              {sub.submissionType === 'review' ? 'Review' :
                               sub.submissionType === 'consultation' ? 'Consultation' :
                               sub.submissionType === 'recording' ? `Recording (${sub.mixOption})` :
                               `Mix ${sub.mixOption === 'live' ? '(Live)' : ''}`}
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
                            <div className="flex gap-2 flex-wrap">
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
                              {sub.submissionType === 'review' && sub.status === 'pending' && nowPlayingId !== sub.id && (
                                <button
                                  onClick={() => setNowPlaying(sub.id)}
                                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-xs font-semibold"
                                >
                                  Now Playing
                                </button>
                              )}
                              {getCalendlyLink(sub) && (
                                <>
                                  <a
                                    href={getCalendlyLink(sub)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs font-semibold"
                                  >
                                    Open Calendly
                                  </a>
                                  <button
                                    onClick={() => copyCalendlyLink(sub)}
                                    className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-semibold"
                                  >
                                    Copy Link
                                  </button>
                                </>
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
            <h1 className="text-3xl font-bold mb-2">Submit to @Moddonthemix</h1>
            <p className="text-gray-300">Choose your submission type below</p>
          </div>

          {/* Tab Selection */}
          <div className="flex gap-4 mb-6 justify-center flex-wrap">
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
            <button
              onClick={() => setSubmissionType('consultation')}
              className={`px-6 py-2 rounded-full font-semibold ${
                submissionType === 'consultation' ? 'bg-orange-600' : 'bg-gray-700'
              }`}
            >
              Consultation
            </button>
            <button
              onClick={() => setSubmissionType('recording')}
              className={`px-6 py-2 rounded-full font-semibold ${
                submissionType === 'recording' ? 'bg-yellow-600' : 'bg-gray-700'
              }`}
            >
              Recording Session
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload Section */}
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              {submissionType !== 'consultation' && submissionType !== 'recording' ? (
                <>
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
                accept={submissionType === 'mix' ? '.zip,application/zip,application/x-zip-compressed' : 'audio/mpeg,audio/mp3,audio/wav,audio/*,.mp3,.wav,.m4a'}
                className="hidden"
                id="file-upload-input"
              />

              <label
                htmlFor="file-upload-input"
                className="block border-2 border-dashed border-gray-600 rounded-lg p-12 text-center cursor-pointer hover:border-purple-500 transition-colors mb-4"
              >
                <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400 pointer-events-none" />
                <p className="text-gray-300 pointer-events-none">
                  {submissionType === 'mix' ? 'Click to upload ZIP file' : 'Click to upload track'}
                </p>
                {uploadedFile && (
                  <p className="mt-2 text-sm text-green-400 pointer-events-none">✓ {uploadedFile.name}</p>
                )}
              </label>

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
                </>
              ) : submissionType === 'consultation' ? (
                <>
                  {/* Consultation Info Section */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 text-orange-400">Personal Consultation</h2>
                    <div className="bg-orange-900/20 border border-orange-700/50 rounded-lg p-6 text-left">
                      <h3 className="text-lg font-bold mb-3">Looking to get a consultation on your own personal mixes, set up?</h3>
                      <p className="text-gray-300 mb-4">
                        Book today to get an in-depth analysis on your personal set up, equipment, your recording and mixing process, your plugins and mix bus, just in general how to better your own sound personally.
                      </p>
                      <div className="bg-black/30 rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl font-bold">One Hour Session</span>
                          <span className="text-3xl font-bold text-orange-400">$50</span>
                        </div>
                        <p className="text-sm text-gray-400">Live video call one-on-one or personal phone call</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300">One hour live video call or personal phone call</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300">Personalized feedback on your setup</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300">Equipment and plugin recommendations</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300">Mix bus and recording process analysis</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300">Actionable tips to improve your sound</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : submissionType === 'recording' ? (
                <>
                  {/* Recording Session Info Section */}
                  <div className="text-center">
                    <h2 className="text-2xl font-bold mb-4 text-yellow-400">Recording Session</h2>

                    {/* Location Notice */}
                    <div className="bg-red-900/30 border-2 border-red-600/70 rounded-lg p-4 mb-4">
                      <p className="text-red-200 font-bold text-lg">📍 PORTLAND, OREGON ONLY</p>
                      <p className="text-red-300 text-sm mt-1">In-person studio sessions at our Portland location</p>
                    </div>

                    <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-6 text-left">
                      <h3 className="text-lg font-bold mb-3">Book a Professional Recording Session</h3>

                      {/* Studio Selection */}
                      <div className="mb-6">
                        <h4 className="font-bold mb-3 text-yellow-300">Select Studio Location:</h4>
                        <div className="space-y-3">
                          <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.recordingStudio === 'home' ? 'border-yellow-500 bg-yellow-900/30' : 'border-gray-600 bg-black/20'}`} onClick={() => setFormData({...formData, recordingStudio: 'home', recordingDuration: '1hour'})}>
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="recordingStudio"
                                value="home"
                                checked={formData.recordingStudio === 'home'}
                                onChange={(e) => setFormData({...formData, recordingStudio: e.target.value, recordingDuration: '1hour'})}
                                className="w-5 h-5 mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="font-bold text-lg text-yellow-300">Home Studio Session</div>
                                <p className="text-sm text-gray-300 mt-1">Professional home studio equipped with chart-topping gear. Perfect for vocals, demos, and quality recordings.</p>
                              </div>
                            </div>
                          </div>

                          <div className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${formData.recordingStudio === 'blackdiamond' ? 'border-yellow-500 bg-yellow-900/30' : 'border-gray-600 bg-black/20'}`} onClick={() => setFormData({...formData, recordingStudio: 'blackdiamond', recordingDuration: '1hour'})}>
                            <div className="flex items-start gap-3">
                              <input
                                type="radio"
                                name="recordingStudio"
                                value="blackdiamond"
                                checked={formData.recordingStudio === 'blackdiamond'}
                                onChange={(e) => setFormData({...formData, recordingStudio: e.target.value, recordingDuration: '1hour'})}
                                className="w-5 h-5 mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="font-bold text-lg text-yellow-300">Black Diamond Studios - Large Format</div>
                                <p className="text-sm text-gray-300 mt-1 mb-2">Professional large format recording studio. Full band tracking, live rooms, premium gear.</p>
                                <p className="text-xs text-gray-400">📍 1424 SE 162nd Ave, Portland, OR</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Duration Selection */}
                      <h4 className="font-bold mb-3 text-yellow-300">Select Session Duration:</h4>
                      <div className="space-y-3 mb-4">
                        <div className="bg-black/30 rounded-lg p-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="recordingDuration"
                              value="1hour"
                              checked={formData.recordingDuration === '1hour'}
                              onChange={(e) => setFormData({...formData, recordingDuration: e.target.value})}
                              className="w-4 h-4"
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <span className="font-semibold">1 Hour Session</span>
                              <span className="text-2xl font-bold text-yellow-400">${formData.recordingStudio === 'home' ? '55' : '100'}</span>
                            </div>
                          </label>
                        </div>
                        <div className="bg-black/30 rounded-lg p-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="recordingDuration"
                              value="2hour"
                              checked={formData.recordingDuration === '2hour'}
                              onChange={(e) => setFormData({...formData, recordingDuration: e.target.value})}
                              className="w-4 h-4"
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <span className="font-semibold">2 Hour Session</span>
                              <span className="text-2xl font-bold text-yellow-400">${formData.recordingStudio === 'home' ? '100' : '195'} <span className="text-sm text-gray-400">(${formData.recordingStudio === 'home' ? '50' : '97.50'}/hr)</span></span>
                            </div>
                          </label>
                        </div>
                        <div className="bg-black/30 rounded-lg p-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="recordingDuration"
                              value="3hour"
                              checked={formData.recordingDuration === '3hour'}
                              onChange={(e) => setFormData({...formData, recordingDuration: e.target.value})}
                              className="w-4 h-4"
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <span className="font-semibold">3 Hour Session</span>
                              <span className="text-2xl font-bold text-yellow-400">${formData.recordingStudio === 'home' ? '150' : '280'} <span className="text-sm text-gray-400">(${formData.recordingStudio === 'home' ? '50' : '93.33'}/hr)</span></span>
                            </div>
                          </label>
                        </div>
                        <div className="bg-black/30 rounded-lg p-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="recordingDuration"
                              value="4hour"
                              checked={formData.recordingDuration === '4hour'}
                              onChange={(e) => setFormData({...formData, recordingDuration: e.target.value})}
                              className="w-4 h-4"
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <span className="font-semibold">4 Hour Session</span>
                              <span className="text-2xl font-bold text-yellow-400">${formData.recordingStudio === 'home' ? '180' : '360'} <span className="text-sm text-gray-400">(${formData.recordingStudio === 'home' ? '45' : '90'}/hr)</span></span>
                            </div>
                          </label>
                        </div>
                        <div className="bg-black/30 rounded-lg p-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="radio"
                              name="recordingDuration"
                              value="5hour"
                              checked={formData.recordingDuration === '5hour'}
                              onChange={(e) => setFormData({...formData, recordingDuration: e.target.value})}
                              className="w-4 h-4"
                            />
                            <div className="flex-1 flex items-center justify-between">
                              <span className="font-semibold">5 Hour Session</span>
                              <span className="text-2xl font-bold text-yellow-400">${formData.recordingStudio === 'home' ? '225' : '435'} <span className="text-sm text-gray-400">(${formData.recordingStudio === 'home' ? '45' : '87'}/hr)</span></span>
                            </div>
                          </label>
                        </div>
                        {formData.recordingStudio === 'home' && (
                          <div className="bg-black/30 rounded-lg p-3">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <input
                                type="radio"
                                name="recordingDuration"
                                value="8hour"
                                checked={formData.recordingDuration === '8hour'}
                                onChange={(e) => setFormData({...formData, recordingDuration: e.target.value})}
                                className="w-4 h-4"
                              />
                              <div className="flex-1 flex items-center justify-between">
                                <span className="font-semibold">8 Hour Session</span>
                                <span className="text-2xl font-bold text-yellow-400">$320 <span className="text-sm text-gray-400">($40/hr)</span></span>
                              </div>
                            </label>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300">Professional studio equipment</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300">Expert recording engineer guidance</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300">High-quality audio files delivered</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-300">Flexible scheduling available</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Form Section */}
            <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
              {submissionType === 'consultation' ? (
                <>
                  {/* Consultation - No service selection needed, just contact form */}
                  <h2 className="text-xl font-bold mb-4">Book Your Consultation</h2>
                  <p className="text-sm text-gray-400 mb-6">Fill out the form below and we'll get back to you to schedule your session.</p>
                </>
              ) : submissionType === 'recording' ? (
                <>
                  {/* Recording Session - No service selection needed, just contact form */}
                  <h2 className="text-xl font-bold mb-4">Book Your Recording Session</h2>
                  <p className="text-sm text-gray-400 mb-6">Fill out the form below and we'll get back to you to schedule your session.</p>
                </>
              ) : submissionType === 'mix' ? (
                <>
                  {/* Mix & Master Options */}
                  <h2 className="text-xl font-bold mb-4">Selected Service</h2>

                  {/* ONE-TIME SERVICES SECTION */}
                  <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">One-Time Services</h3>
                      <p className="text-sm text-gray-400">Pay per project - perfect for single tracks</p>
                    </div>

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
                      <label className="flex items-center gap-3 cursor-pointer mb-2">
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
                          <span className="text-2xl font-bold text-blue-300">$75</span>
                        </div>
                      </label>
                      <div className="flex items-start gap-2 ml-7">
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-300">Best for artists who just want it done without live streaming</span>
                      </div>
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
                      <div className="flex items-start gap-2 ml-7">
                        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-300">Best for artists who want to learn, interact, and standout</span>
                      </div>
                    </div>

                  </div>

                  {/* MONTHLY MEMBERSHIPS SECTION */}
                  <div className="bg-gray-900/50 rounded-lg p-6 mb-6">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold mb-2">Monthly Memberships</h3>
                      <p className="text-sm text-gray-400">Save money with recurring plans - ideal for ongoing releases</p>
                    </div>

                    {/* Tier 1: Artist Growth Plan */}
                    <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-lg p-4 mb-4">
                        <label className="flex items-start gap-3 cursor-pointer mb-3">
                          <input
                            type="radio"
                            name="mixOption"
                            value="subscription-tier1"
                            checked={formData.mixOption === 'subscription-tier1'}
                            onChange={(e) => setFormData({...formData, mixOption: e.target.value, subscriptionTier: 'tier1'})}
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-green-300">Artist Growth Plan</span>
                              <span className="text-2xl font-bold text-green-400">$175<span className="text-xs text-gray-400">/mo</span></span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-xs text-gray-300">Up to 3 songs per month</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-xs text-gray-300">Turnaround: 1-3 days per song</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-xs text-gray-300">Professional mix and master</span>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Tier 2: Pro Artist Access */}
                      <div className="bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-amber-700/50 rounded-lg p-4">
                        <label className="flex items-start gap-3 cursor-pointer mb-3">
                          <input
                            type="radio"
                            name="mixOption"
                            value="subscription-tier2"
                            checked={formData.mixOption === 'subscription-tier2'}
                            onChange={(e) => setFormData({...formData, mixOption: e.target.value, subscriptionTier: 'tier2'})}
                            className="w-4 h-4 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-amber-300">Pro Artist Access</span>
                              <span className="text-2xl font-bold text-amber-400">$325<span className="text-xs text-gray-400">/mo</span></span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-xs text-gray-300">Up to 5-7 songs per month</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-xs text-gray-300">Turnaround: 1-3 days per song</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-xs text-gray-300">Professional mix and master</span>
                              </div>
                              <div className="flex items-start gap-2">
                                <div className="w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-xs text-gray-300">Priority support</span>
                              </div>
                            </div>
                          </div>
                        </label>
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

              {/* Discount Code Section - Only show for paid submissions */}
              {(submissionType === 'mix' || submissionType === 'consultation' || submissionType === 'recording' || formData.priority !== 'free') && (
                <div className="mb-4">
                  <label className="text-sm font-semibold block mb-2">Discount Code (optional)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={affiliateCode}
                      onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
                      placeholder="Enter discount code"
                      className="flex-1 px-4 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-purple-500 outline-none uppercase"
                    />
                    <button
                      onClick={() => validateAffiliateCode(affiliateCode)}
                      disabled={isValidatingCode || !affiliateCode.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-sm"
                    >
                      {isValidatingCode ? 'Checking...' : 'Apply'}
                    </button>
                  </div>
                  {appliedDiscount && (
                    <div className="mt-2 p-2 bg-green-900/30 border border-green-700/50 rounded-lg">
                      <p className="text-xs text-green-200">
                        ✓ <strong>{appliedDiscount.discount_percentage}% discount applied!</strong>
                        {calculatePrice().original > 0 && (
                          <>
                            {' '}Original: ${calculatePrice().original} → New price: ${calculatePrice().final.toFixed(2)}
                          </>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-200">
                  Free submissions are welcome! Please follow me on TikTok to support the stream: <span className="font-bold">@Moddonthemix</span>
                </p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg font-bold flex items-center justify-center gap-2 ${
                  isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Music className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  formData.priority === 'free' && submissionType === 'review'
                    ? 'Submit Free'
                    : `Submit & Pay $${calculatePrice().final.toFixed(2)}`
                )}
              </button>

              {(submissionType === 'mix' || submissionType === 'consultation' || submissionType === 'recording' || formData.priority !== 'free') && !isSubmitting && (
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
          Upgrade Your Sound
        </h1>
        <p className="text-xl text-gray-300 mb-4 max-w-2xl mx-auto">
          Portland based recording studio and mixing studio by @moddonthemix. Professional mixing engineer offering mastering, recording sessions, and live music reviews with chart-topping gear. Get your tracks deeply reviewed by experienced engineers and get your song mixed on live stream!
        </p>
        <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto">
          📍 <strong className="text-white">Portland, Oregon Recording Studio</strong> | Serving PDX artists and musicians nationwide
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => setView('submit')}
            className="px-8 py-4 bg-gray-800 hover:bg-gray-700 rounded-full font-bold text-lg transition-all"
          >
            Get Music Reviews
          </button>
          <button
            onClick={() => {
              setSubmissionType('mix');
              setView('submit');
            }}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-full font-bold text-lg transition-all"
          >
            Mix & Master
          </button>
          <button
            onClick={() => {
              setSubmissionType('consultation');
              setView('submit');
            }}
            className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-full font-bold text-lg transition-all"
          >
            Consultation
          </button>
          <button
            onClick={() => {
              setSubmissionType('recording');
              setView('submit');
            }}
            className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-full font-bold text-lg transition-all"
          >
            Recording Session
          </button>
          <button
            onClick={() => window.open('https://linktr.ee/moddonthemix', '_blank')}
            className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 rounded-full font-bold text-lg transition-all"
          >
            Pro Tools Templates
          </button>
          <button
            onClick={() => window.open('https://credits.muso.ai/profile/fd6afb53-fc84-4ba3-9ba8-495305dfde75', '_blank')}
            className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 rounded-full font-bold text-lg transition-all"
          >
            Portfolio
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
              {/* Now Playing Section in Public Queue */}
              {nowPlayingId && getNowPlayingSubmission() && (
                <div className="mb-6 bg-gradient-to-r from-purple-900/50 to-pink-900/50 backdrop-blur rounded-xl p-4 border-2 border-purple-500">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center animate-pulse">
                      <Music className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Now Playing</h3>
                      <p className="text-xs text-purple-200">Currently being reviewed</p>
                    </div>
                  </div>
                  <div className="bg-black/30 rounded-lg p-3">
                    <p className="text-xl font-bold mb-1">{getNowPlayingSubmission().trackTitle}</p>
                    <p className="text-gray-300 mb-2">by {getNowPlayingSubmission().artistName}</p>
                    <span className={`px-3 py-1 ${getPriorityInfo(getNowPlayingSubmission().priority).color} rounded-full text-xs font-bold`}>
                      {getPriorityInfo(getNowPlayingSubmission().priority).label}
                    </span>
                  </div>
                </div>
              )}

              {/* Queue List */}
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
            Portland Music Production Services
          </h2>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Live Mix Reviews */}
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-8 border border-gray-700">
              <h3 className="text-2xl font-bold mb-6 text-purple-400">Live Music Reviews & Feedback</h3>
              
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
              <h3 className="text-2xl font-bold mb-6 text-blue-400">Professional Mixing & Mastering Services</h3>
              
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