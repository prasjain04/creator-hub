import React, { useState, useEffect, useRef } from 'react';

export default function CreatorPartnershipHub() {
  const [activeTab, setActiveTab] = useState('tracker');
  const [script, setScript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState({ step: 0, message: '' });
  const [generatedContent, setGeneratedContent] = useState(null);
  const [partnerships, setPartnerships] = useState([]);
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isLoadingPartnerships, setIsLoadingPartnerships] = useState(false);
  const [selectedPartnership, setSelectedPartnership] = useState(null);
  const [toast, setToast] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);
  const [addedCompanies, setAddedCompanies] = useState(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [trash, setTrash] = useState([]);
  const [showTrash, setShowTrash] = useState(false);
  const [newCompany, setNewCompany] = useState({
    company: '',
    why: '',
    linkedin: '',
    twitter: '',
    instagram: '',
    email: '',
    message: '',
    notes: ''
  });

  useEffect(() => {
    loadPartnerships();
    loadTrash();
  }, []);

  // Auto-hide toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const loadPartnerships = () => {
    setIsLoadingPartnerships(true);
    try {
      const stored = localStorage.getItem('creator-hub-partnerships');
      if (stored) {
        setPartnerships(JSON.parse(stored));
      }
    } catch (err) {
      console.log('No existing partnerships');
    }
    setIsLoadingPartnerships(false);
  };

  const loadTrash = () => {
    try {
      const stored = localStorage.getItem('creator-hub-trash');
      if (stored) {
        setTrash(JSON.parse(stored));
      }
    } catch (err) {
      console.log('No trash');
    }
  };

  const savePartnerships = (newPartnerships) => {
    try {
      localStorage.setItem('creator-hub-partnerships', JSON.stringify(newPartnerships));
      setPartnerships(newPartnerships);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const saveTrash = (newTrash) => {
    try {
      localStorage.setItem('creator-hub-trash', JSON.stringify(newTrash));
    } catch (err) {
      console.error('Save trash failed:', err);
    }
  };

  const processScript = async () => {
    if (!script.trim()) {
      setError('Add your script first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setGeneratedContent(null);
    setProcessingStep({ step: 1, message: 'Analyzing your script...' });

    try {
      // Simulate initial delay for UX
      await new Promise(r => setTimeout(r, 300));
      setProcessingStep({ step: 2, message: 'Finding brand matches...' });
      
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: `Analyze this TikTok script and suggest 3 brand partners I could pitch for sponsorship.

SCRIPT:
${script}

CAPTION STYLE (match this exactly):
- Start with "here's what we can learn from..." or similar hook
- Use → and ≠ and = symbols
- Short punchy lines with dashes (–)
- Tag relevant brands/people with @
- Focus on lessons/takeaways from the story
- No hashtags in caption, keep those separate

Example caption style:
"here's what we can learn from how @sarablakely built @spanx:
– constraints → creativity: no fashion background forced her to simplify
– control = compounding: keeping 100% ownership gave her leverage
– lived experience > market research: she built products by wearing them"

OUTREACH MESSAGES:
These are cold pitches to brands for SPONSORSHIP. I want them to pay me to feature their product in my content.

For each brand:
1. Open with what my content is about (founder stories, business breakdowns)
2. Explain why MY AUDIENCE (aspiring entrepreneurs, startup fans) would love their brand
3. Propose 2 specific SPONSORED VIDEO ideas featuring their product
4. Keep it under 70 words, casual but professional

Return ONLY valid JSON:
{
  "caption": "caption in the style above with – and → symbols",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "companies": [
    {
      "name": "Company Name",
      "why": "Why they'd sponsor this type of content",
      "linkedin": "https://linkedin.com/company/x or null",
      "twitter": "@handle or null",
      "instagram": "@handle or null",
      "email": "email or null",
      "message": "Sponsorship pitch: what my content is about → why my audience fits their brand → 2 sponsored video ideas"
    }
  ]
}`
          }]
        })
      });

      setProcessingStep({ step: 3, message: 'Writing personalized outreach...' });

      const data = await response.json();
      
      // Check for error response
      if (data.error) {
        console.error('API error:', data.error);
        throw new Error(data.error.message || 'API error');
      }
      
      if (!data.content || data.content.length === 0) {
        throw new Error('Empty response');
      }
      
      let text = data.content.filter(item => item.type === 'text').map(item => item.text).join('\n');
      
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*"companies"[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error('Response:', text);
        throw new Error('Could not parse response');
      }
      
      const result = JSON.parse(jsonMatch[0].replace(/```json|```/g, '').trim());
      setProcessingStep({ step: 4, message: 'Done!' });
      await new Promise(r => setTimeout(r, 200));
      setGeneratedContent(result);
      setAddedCompanies(new Set());
      setIsProcessing(false);
      setProcessingStep({ step: 0, message: '' });

    } catch (err) {
      console.error('API Error:', err);
      
      // Fallback with mock data for testing
      const mockData = {
        caption: "here's what we can learn from how @emilyweiss built @glossier:\n– side project → empire: 4am blog posts before work turned into 10M monthly readers\n– community > celebrity: built entirely on customer feedback, not endorsements\n– rejection = redirection: 11 VCs said no before Forerunner said yes\n– skin first, makeup second: a philosophy that flipped the entire industry",
        hashtags: ["#glossier", "#founderstory", "#startuptok", "#businesstiktok", "#emilyweiss"],
        companies: [
          {
            name: "Notion",
            why: "Your audience of aspiring founders uses Notion to build their businesses",
            linkedin: "https://linkedin.com/company/notion",
            twitter: "@notionhq",
            instagram: "@notionhq",
            email: "partnerships@notion.so",
            message: `Hey Notion — I make founder breakdown content for aspiring entrepreneurs (the Glossier video is doing well).

My audience obsesses over how successful founders organize their ideas. Two sponsored concepts:

1. "Recreating Emily Weiss's product research system in Notion"
2. "The Notion setup every founder needs before their first pitch"

Happy to share my metrics.`
          },
          {
            name: "Shopify",
            why: "Founder stories naturally lead viewers to ask 'how do I start my own thing'",
            linkedin: "https://linkedin.com/company/shopify",
            twitter: "@shopify",
            instagram: "@shopify",
            email: "creators@shopify.com",
            message: `Hi Shopify — I cover founder journeys and my audience is always asking how to start their own brand.

Glossier's DTC story is a perfect tie-in. Ideas:

1. "What Glossier's first Shopify store looked like vs now"
2. "Building a Glossier-style brand in 24 hours with Shopify"

My demos skew 18-28, entrepreneurial. Let me know if interested.`
          },
          {
            name: "Masterclass",
            why: "Viewers who love founder stories want to learn directly from them",
            linkedin: "https://linkedin.com/company/masterclass",
            twitter: "@masterclass",
            instagram: "@masterclass",
            email: "partnerships@masterclass.com",
            message: `Hey Masterclass — my founder breakdown content gets strong engagement from people who want to learn from the best.

Two ideas:

1. "What I learned watching Sara Blakely's Masterclass as a creator"
2. "Ranking founder Masterclasses by actual usefulness"

Authentic integration, not ad-read vibes. Let me know.`
          }
        ]
      };
      
      // Simulate progress for demo
      setProcessingStep({ step: 2, message: 'Finding brand matches...' });
      await new Promise(r => setTimeout(r, 600));
      setProcessingStep({ step: 3, message: 'Writing personalized outreach...' });
      await new Promise(r => setTimeout(r, 800));
      setProcessingStep({ step: 4, message: 'Done!' });
      await new Promise(r => setTimeout(r, 200));
      
      setGeneratedContent(mockData);
      setAddedCompanies(new Set());
      setToast("Using demo data (API unavailable)");
      setIsProcessing(false);
      setProcessingStep({ step: 0, message: '' });
    }
  };

  const addToTracker = async (company) => {
    // Update UI immediately
    setAddedCompanies(prev => new Set([...prev, company.name]));
    setToast(`${company.name} added to tracker`);
    
    // Then save in background
    const newPartnership = {
      id: Date.now().toString(),
      company: company.name,
      why: company.why,
      linkedin: company.linkedin,
      twitter: company.twitter,
      instagram: company.instagram,
      email: company.email,
      message: company.message,
      caption: generatedContent?.caption || '',
      hashtags: generatedContent?.hashtags || [],
      status: 'ideas',
      notes: '',
      dealAmount: null,
      deliverables: '',
      dealTypes: [],
      outreachMethods: [],
      paymentStatus: null,
      createdAt: new Date().toISOString()
    };
    
    const updated = [...partnerships, newPartnership];
    setPartnerships(updated);
    savePartnerships(updated);
  };

  const addManualCompany = async () => {
    if (!newCompany.company.trim()) {
      setToast('Add a company name');
      return;
    }
    
    const newPartnership = {
      id: Date.now().toString(),
      company: newCompany.company,
      why: newCompany.why,
      linkedin: newCompany.linkedin,
      twitter: newCompany.twitter,
      instagram: newCompany.instagram,
      email: newCompany.email,
      message: newCompany.message,
      caption: '',
      hashtags: [],
      status: 'ideas',
      notes: newCompany.notes,
      dealAmount: null,
      deliverables: '',
      dealTypes: [],
      outreachMethods: [],
      paymentStatus: null,
      createdAt: new Date().toISOString()
    };
    
    const updated = [...partnerships, newPartnership];
    await savePartnerships(updated);
    setToast(`${newCompany.company} added`);
    setShowAddModal(false);
    setNewCompany({
      company: '',
      why: '',
      linkedin: '',
      twitter: '',
      instagram: '',
      email: '',
      message: '',
      notes: ''
    });
  };

  // Calculate total earnings this year
  const calculateYearEarnings = () => {
    const currentYear = new Date().getFullYear();
    return partnerships
      .filter(p => p.status === 'won' && p.dealAmount && new Date(p.createdAt).getFullYear() === currentYear)
      .reduce((sum, p) => sum + (parseFloat(p.dealAmount) || 0), 0);
  };

  const pendingPaymentCount = partnerships.filter(p => p.paymentStatus === 'pending').length;

  const updatePartnership = async (id, updates) => {
    const updated = partnerships.map(p => p.id === id ? { ...p, ...updates } : p);
    await savePartnerships(updated);
    if (selectedPartnership?.id === id) {
      setSelectedPartnership({ ...selectedPartnership, ...updates });
    }
  };

  const deletePartnership = (id) => {
    const toDelete = partnerships.find(p => p.id === id);
    if (toDelete) {
      // Add to trash with deletion timestamp
      const newTrash = [...trash, { ...toDelete, deletedAt: new Date().toISOString() }];
      setTrash(newTrash);
      saveTrash(newTrash);
    }
    
    // Update UI immediately
    const updated = partnerships.filter(p => p.id !== id);
    setPartnerships(updated);
    setSelectedPartnership(null);
    setToast('Moved to trash');
    
    // Save in background
    savePartnerships(updated);
  };

  const restoreFromTrash = (id) => {
    const toRestore = trash.find(p => p.id === id);
    if (toRestore) {
      const { deletedAt, ...partnership } = toRestore;
      const updated = [...partnerships, partnership];
      setPartnerships(updated);
      const newTrash = trash.filter(p => p.id !== id);
      setTrash(newTrash);
      saveTrash(newTrash);
      setToast(`${partnership.company} restored`);
      savePartnerships(updated);
    }
  };

  const permanentlyDelete = (id) => {
    const toDelete = trash.find(p => p.id === id);
    const newTrash = trash.filter(p => p.id !== id);
    setTrash(newTrash);
    saveTrash(newTrash);
    if (toDelete) {
      setToast(`${toDelete.company} permanently deleted`);
    }
  };

  const emptyTrash = () => {
    setTrash([]);
    saveTrash([]);
    setToast('Trash emptied');
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Drag and Drop handlers - optimized for speed
  const handleDragStart = (e, partnership) => {
    setDraggedItem(partnership);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', partnership.id);
    // Add dragging class immediately
    requestAnimationFrame(() => {
      e.target.classList.add('dragging');
    });
  };

  const handleDragEnd = (e) => {
    e.target.classList.remove('dragging');
    setDraggedItem(null);
    setDragOverStatus(null);
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStatus !== status) {
      setDragOverStatus(status);
    }
  };

  const handleDragLeave = (e) => {
    // Only clear if we're leaving the column entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverStatus(null);
    }
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    setDragOverStatus(null);
    
    if (draggedItem && draggedItem.status !== newStatus) {
      // Update immediately for snappy feel
      const updated = partnerships.map(p => 
        p.id === draggedItem.id ? { ...p, status: newStatus } : p
      );
      setPartnerships(updated);
      
      // Then persist
      await savePartnerships(updated);
      setToast(`Moved to ${STATUS_LABELS[newStatus]}`);
    }
    setDraggedItem(null);
  };

  const STATUSES = ['ideas', 'outreach', 'talking', 'won', 'lost'];
  const STATUS_LABELS = {
    ideas: 'Ideas',
    outreach: 'Outreach', 
    talking: 'Talking',
    won: 'Won',
    lost: 'Lost'
  };

  // Doodle SVGs
  const StarDoodle = ({ size = 16, style = {} }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M12 2L14 9H21L15.5 13.5L17.5 21L12 16.5L6.5 21L8.5 13.5L3 9H10L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const HeartDoodle = ({ size = 16, style = {} }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M12 21C12 21 3 13.5 3 8.5C3 5.5 5.5 3 8.5 3C10.5 3 12 4.5 12 4.5C12 4.5 13.5 3 15.5 3C18.5 3 21 5.5 21 8.5C21 13.5 12 21 12 21Z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const ArrowDoodle = ({ size = 16, style = {} }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <path d="M5 12H19M19 12L13 6M19 12L13 18" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const FlowerDoodle = ({ size = 20, style = {} }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={style}>
      <circle cx="12" cy="12" r="3"/>
      <ellipse cx="12" cy="5" rx="2" ry="3"/>
      <ellipse cx="12" cy="19" rx="2" ry="3"/>
      <ellipse cx="5" cy="12" rx="3" ry="2"/>
      <ellipse cx="19" cy="12" rx="3" ry="2"/>
    </svg>
  );

  const CheckDoodle = ({ size = 16, style = {} }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={style}>
      <path d="M5 12L10 17L19 7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  const SquiggleLine = ({ width = 100 }) => (
    <svg width={width} height="8" viewBox={`0 0 ${width} 8`} fill="none" style={{ display: 'block' }}>
      <path d={`M0 4 Q ${width/8} 0, ${width/4} 4 T ${width/2} 4 T ${width*3/4} 4 T ${width} 4`} stroke="#c9a8a8" strokeWidth="1.5" fill="none"/>
    </svg>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf6f1',
      fontFamily: '"Courier Prime", "Courier New", monospace',
      color: '#3d3532',
      position: 'relative'
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&family=Special+Elite&display=swap" rel="stylesheet" />
      
      <style>{`
        * { box-sizing: border-box; }
        ::selection { background: #e8d5c4; }
        
        .paper-texture {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
        
        .btn {
          transition: all 0.15s ease;
          cursor: pointer;
        }
        .btn:hover {
          transform: translateY(-1px);
        }
        .btn:active {
          transform: translateY(0);
        }
        
        .card {
          transition: box-shadow 0.15s ease;
        }
        .card:hover {
          box-shadow: 4px 4px 0 #d4c4b5;
        }
        
        .card.dragging {
          opacity: 0.7;
          transform: rotate(2deg) scale(1.02);
          box-shadow: 8px 8px 16px rgba(0,0,0,0.15);
          transition: none;
        }
        
        .column-drop-zone {
          transition: background 0.1s ease, border 0.1s ease;
        }
        
        .column-drop-active {
          background: #f0ebe5 !important;
          border: 2px dashed #a89080 !important;
        }
        
        textarea:focus, input:focus {
          outline: none;
          border-color: #a89080;
        }
        
        .toast-enter {
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-backdrop {
          animation: fadeIn 0.2s ease;
        }
        
        .modal-content {
          animation: slideUp 0.3s ease;
        }
        
        .drag-handle {
          cursor: grab;
        }
        .drag-handle:active {
          cursor: grabbing;
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div 
          className="toast-enter"
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#4a4340',
            color: '#faf6f1',
            padding: '12px 20px',
            borderRadius: '2px',
            fontSize: '13px',
            fontFamily: '"Courier Prime", monospace',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <CheckDoodle size={16} />
          {toast}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPartnership && (
        <div 
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(61, 53, 50, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 999
          }}
          onClick={() => setSelectedPartnership(null)}
        >
          <div 
            className="modal-content paper-texture"
            style={{
              background: '#faf6f1',
              border: '1px solid #c9b8a8',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              padding: '28px',
              boxShadow: '8px 8px 0 #d4c4b5'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h2 style={{ 
                  fontFamily: '"Special Elite", monospace', 
                  fontSize: '22px', 
                  margin: '0 0 4px 0',
                  fontWeight: 'normal'
                }}>
                  {selectedPartnership.company}
                </h2>
                <p style={{ fontSize: '13px', color: '#6b5f58', margin: 0 }}>
                  {selectedPartnership.why}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPartnership(null);
                }}
                className="btn"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#a89080',
                  padding: '4px 8px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            {/* Status */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '10px', 
                letterSpacing: '1px', 
                color: '#8b7f78',
                marginBottom: '8px'
              }}>
                STATUS
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {STATUSES.map(status => (
                  <button
                    key={status}
                    onClick={() => updatePartnership(selectedPartnership.id, { status })}
                    className="btn"
                    style={{
                      padding: '8px 14px',
                      border: '1px solid #c9b8a8',
                      background: selectedPartnership.status === status ? '#4a4340' : '#fff',
                      color: selectedPartnership.status === status ? '#faf6f1' : '#4a4340',
                      fontSize: '11px',
                      fontFamily: '"Courier Prime", monospace',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {STATUS_LABELS[status]}
                  </button>
                ))}
              </div>
            </div>

            {/* Outreach Method - for ideas/outreach stages */}
            {(selectedPartnership.status === 'ideas' || selectedPartnership.status === 'outreach') && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '10px', 
                  letterSpacing: '1px', 
                  color: '#8b7f78',
                  marginBottom: '8px'
                }}>
                  OUTREACH METHOD
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { value: 'dm', label: 'DM' },
                    { value: 'email', label: 'Email' },
                    { value: 'linkedin', label: 'LinkedIn' },
                    { value: 'inbound', label: 'They reached out' }
                  ].map(method => {
                    const isSelected = (selectedPartnership.outreachMethods || []).includes(method.value);
                    return (
                      <button
                        key={method.value}
                        onClick={() => {
                          const current = selectedPartnership.outreachMethods || [];
                          const updated = isSelected 
                            ? current.filter(m => m !== method.value)
                            : [...current, method.value];
                          setSelectedPartnership({ ...selectedPartnership, outreachMethods: updated });
                          updatePartnership(selectedPartnership.id, { outreachMethods: updated });
                        }}
                        className="btn"
                        style={{
                          padding: '10px 16px',
                          border: `2px solid ${isSelected ? '#4a4340' : '#c9b8a8'}`,
                          background: isSelected ? '#4a4340' : '#fff',
                          color: isSelected ? '#faf6f1' : '#4a4340',
                          fontSize: '12px',
                          fontFamily: '"Courier Prime", monospace',
                          cursor: 'pointer',
                          minHeight: '40px'
                        }}
                      >
                        {method.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deal Types - for talking/won stages */}
            {(selectedPartnership.status === 'talking' || selectedPartnership.status === 'won') && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '10px', 
                  letterSpacing: '1px', 
                  color: '#8b7f78',
                  marginBottom: '8px'
                }}>
                  DELIVERABLE TYPE
                </label>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {[
                    { value: 'tiktok', label: 'TikTok' },
                    { value: 'reel', label: 'IG Reel' },
                    { value: 'story', label: 'Story Set' },
                    { value: 'post', label: 'IG Post' },
                    { value: 'linkinbio', label: 'Link in Bio' },
                    { value: 'youtube', label: 'YouTube' },
                    { value: 'ugc', label: 'UGC Only' }
                  ].map(type => {
                    const isSelected = (selectedPartnership.dealTypes || []).includes(type.value);
                    return (
                      <button
                        key={type.value}
                        onClick={() => {
                          const current = selectedPartnership.dealTypes || [];
                          const updated = isSelected 
                            ? current.filter(t => t !== type.value)
                            : [...current, type.value];
                          setSelectedPartnership({ ...selectedPartnership, dealTypes: updated });
                          updatePartnership(selectedPartnership.id, { dealTypes: updated });
                        }}
                        className="btn"
                        style={{
                          padding: '10px 16px',
                          border: `2px solid ${isSelected ? '#4a4340' : '#c9b8a8'}`,
                          background: isSelected ? '#4a4340' : '#fff',
                          color: isSelected ? '#faf6f1' : '#4a4340',
                          fontSize: '12px',
                          fontFamily: '"Courier Prime", monospace',
                          cursor: 'pointer',
                          minHeight: '40px'
                        }}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deal Details - only show for talking/won */}
            {(selectedPartnership.status === 'talking' || selectedPartnership.status === 'won') && (
              <div style={{ 
                marginBottom: '20px',
                padding: '16px',
                background: '#f5f0eb',
                border: '1px solid #e0d5ca'
              }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '10px', 
                  letterSpacing: '1px', 
                  color: '#8b7f78',
                  marginBottom: '12px'
                }}>
                  DEAL DETAILS
                </label>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#6b5f58', display: 'block', marginBottom: '4px' }}>
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    value={selectedPartnership.dealAmount || ''}
                    onChange={(e) => setSelectedPartnership({ ...selectedPartnership, dealAmount: e.target.value })}
                    onBlur={(e) => updatePartnership(selectedPartnership.id, { dealAmount: e.target.value })}
                    placeholder="0"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #d4c4b5',
                      background: '#fff',
                      fontFamily: '"Courier Prime", monospace',
                      fontSize: '14px',
                      color: '#3d3532'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#6b5f58', display: 'block', marginBottom: '4px' }}>
                    Deliverables
                  </label>
                  <textarea
                    value={selectedPartnership.deliverables || ''}
                    onChange={(e) => setSelectedPartnership({ ...selectedPartnership, deliverables: e.target.value })}
                    onBlur={(e) => updatePartnership(selectedPartnership.id, { deliverables: e.target.value })}
                    placeholder="e.g., 2 TikToks, 1 Instagram story..."
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '10px',
                      border: '1px solid #d4c4b5',
                      background: '#fff',
                      fontFamily: '"Courier Prime", monospace',
                      fontSize: '13px',
                      resize: 'vertical',
                      color: '#3d3532'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b5f58', display: 'block', marginBottom: '4px' }}>
                    Payment Status
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[
                      { value: null, label: 'Not set' },
                      { value: 'pending', label: 'Pending' },
                      { value: 'paid', label: 'Paid' }
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => {
                          setSelectedPartnership({ ...selectedPartnership, paymentStatus: opt.value });
                          updatePartnership(selectedPartnership.id, { paymentStatus: opt.value });
                        }}
                        className="btn"
                        style={{
                          padding: '6px 12px',
                          border: '1px solid #c9b8a8',
                          background: selectedPartnership.paymentStatus === opt.value ? '#4a4340' : '#fff',
                          color: selectedPartnership.paymentStatus === opt.value ? '#faf6f1' : '#4a4340',
                          fontSize: '11px',
                          fontFamily: '"Courier Prime", monospace'
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '10px', 
                letterSpacing: '1px', 
                color: '#8b7f78',
                marginBottom: '8px'
              }}>
                CONTACT
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedPartnership.linkedin && (
                  <a href={selectedPartnership.linkedin} target="_blank" rel="noopener noreferrer" style={{
                    padding: '6px 12px',
                    background: '#fff',
                    border: '1px solid #d4c4b5',
                    fontSize: '12px',
                    color: '#4a4340',
                    textDecoration: 'none'
                  }}>
                    LinkedIn
                  </a>
                )}
                {selectedPartnership.twitter && (
                  <a 
                    href={`https://twitter.com/${selectedPartnership.twitter.replace('@', '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 12px',
                      background: '#fff',
                      border: '1px solid #d4c4b5',
                      fontSize: '12px',
                      color: '#4a4340',
                      textDecoration: 'none'
                    }}
                  >
                    {selectedPartnership.twitter}
                  </a>
                )}
                {selectedPartnership.instagram && (
                  <a 
                    href={`https://instagram.com/${selectedPartnership.instagram.replace('@', '')}`}
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{
                      padding: '6px 12px',
                      background: '#fff',
                      border: '1px solid #d4c4b5',
                      fontSize: '12px',
                      color: '#4a4340',
                      textDecoration: 'none'
                    }}
                  >
                    {selectedPartnership.instagram}
                  </a>
                )}
                {selectedPartnership.email && (
                  <a href={`mailto:${selectedPartnership.email}`} style={{
                    padding: '6px 12px',
                    background: '#fff',
                    border: '1px solid #d4c4b5',
                    fontSize: '12px',
                    color: '#4a4340',
                    textDecoration: 'none'
                  }}>
                    {selectedPartnership.email}
                  </a>
                )}
                {!selectedPartnership.linkedin && !selectedPartnership.twitter && !selectedPartnership.instagram && !selectedPartnership.email && (
                  <span style={{ fontSize: '12px', color: '#a89080' }}>No contact info</span>
                )}
              </div>
            </div>

            {/* Draft Message */}
            {selectedPartnership.message && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ fontSize: '10px', letterSpacing: '1px', color: '#8b7f78' }}>
                    DRAFT MESSAGE
                  </label>
                  <button
                    onClick={() => copyToClipboard(selectedPartnership.message, 'modal-msg')}
                    className="btn"
                    style={{
                      padding: '4px 10px',
                      border: '1px solid #d4c4b5',
                      background: copiedId === 'modal-msg' ? '#4a4340' : '#fff',
                      color: copiedId === 'modal-msg' ? '#fff' : '#6b5f58',
                      fontSize: '10px',
                      fontFamily: '"Courier Prime", monospace'
                    }}
                  >
                    {copiedId === 'modal-msg' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div style={{
                  background: '#fff',
                  border: '1px solid #e0d5ca',
                  padding: '14px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#4a4340',
                  whiteSpace: 'pre-line'
                }}>
                  {selectedPartnership.message}
                </div>
              </div>
            )}

            {/* Original Caption */}
            {selectedPartnership.caption && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '10px', 
                  letterSpacing: '1px', 
                  color: '#8b7f78',
                  marginBottom: '8px'
                }}>
                  ORIGINAL CAPTION
                </label>
                <div style={{
                  background: '#fff',
                  border: '1px solid #e0d5ca',
                  padding: '14px',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#4a4340'
                }}>
                  {selectedPartnership.caption}
                  {selectedPartnership.hashtags && selectedPartnership.hashtags.length > 0 && (
                    <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedPartnership.hashtags.map((tag, i) => (
                        <span key={i} style={{
                          padding: '3px 8px',
                          background: '#f5f0eb',
                          border: '1px solid #e0d5ca',
                          fontSize: '11px',
                          color: '#6b5f58'
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '10px', 
                letterSpacing: '1px', 
                color: '#8b7f78',
                marginBottom: '8px'
              }}>
                NOTES
              </label>
              <textarea
                value={selectedPartnership.notes || ''}
                onChange={(e) => setSelectedPartnership({ ...selectedPartnership, notes: e.target.value })}
                onBlur={(e) => updatePartnership(selectedPartnership.id, { notes: e.target.value })}
                placeholder="Add notes here..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '14px',
                  border: '1px solid #e0d5ca',
                  background: '#fff',
                  fontFamily: '"Courier Prime", monospace',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  resize: 'vertical',
                  color: '#3d3532'
                }}
              />
            </div>

            {/* Date Added */}
            <div style={{ 
              fontSize: '11px', 
              color: '#a89080',
              marginBottom: '20px'
            }}>
              Added {new Date(selectedPartnership.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </div>

            {/* Delete */}
            <button
              onClick={() => deletePartnership(selectedPartnership.id)}
              className="btn"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d4b5b5',
                background: '#fff',
                color: '#8b5a5a',
                fontSize: '12px',
                fontFamily: '"Courier Prime", monospace',
                letterSpacing: '0.5px'
              }}
            >
              Delete Partnership
            </button>
          </div>
        </div>
      )}

      {/* Add Company Modal */}
      {showAddModal && (
        <div 
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(61, 53, 50, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 999
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="modal-content paper-texture"
            style={{
              background: '#faf6f1',
              border: '1px solid #c9b8a8',
              maxWidth: '480px',
              width: '100%',
              maxHeight: '85vh',
              overflow: 'auto',
              padding: '28px',
              boxShadow: '8px 8px 0 #d4c4b5'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ 
                fontFamily: '"Special Elite", monospace', 
                fontSize: '20px', 
                margin: 0,
                fontWeight: 'normal'
              }}>
                Add Company
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAddModal(false);
                }}
                className="btn"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '20px',
                  color: '#a89080',
                  padding: '4px 8px',
                  lineHeight: 1
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#6b5f58', display: 'block', marginBottom: '4px' }}>
                Company Name *
              </label>
              <input
                type="text"
                value={newCompany.company}
                onChange={(e) => setNewCompany({ ...newCompany, company: e.target.value })}
                placeholder="e.g., Glossier"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d4c4b5',
                  background: '#fff',
                  fontFamily: '"Courier Prime", monospace',
                  fontSize: '14px',
                  color: '#3d3532'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#6b5f58', display: 'block', marginBottom: '4px' }}>
                Why they fit
              </label>
              <input
                type="text"
                value={newCompany.why}
                onChange={(e) => setNewCompany({ ...newCompany, why: e.target.value })}
                placeholder="e.g., Their audience matches my content"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d4c4b5',
                  background: '#fff',
                  fontFamily: '"Courier Prime", monospace',
                  fontSize: '14px',
                  color: '#3d3532'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#6b5f58', display: 'block', marginBottom: '4px' }}>
                  Instagram
                </label>
                <input
                  type="text"
                  value={newCompany.instagram}
                  onChange={(e) => setNewCompany({ ...newCompany, instagram: e.target.value })}
                  placeholder="@handle"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d4c4b5',
                    background: '#fff',
                    fontFamily: '"Courier Prime", monospace',
                    fontSize: '13px',
                    color: '#3d3532'
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#6b5f58', display: 'block', marginBottom: '4px' }}>
                  Twitter
                </label>
                <input
                  type="text"
                  value={newCompany.twitter}
                  onChange={(e) => setNewCompany({ ...newCompany, twitter: e.target.value })}
                  placeholder="@handle"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #d4c4b5',
                    background: '#fff',
                    fontFamily: '"Courier Prime", monospace',
                    fontSize: '13px',
                    color: '#3d3532'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#6b5f58', display: 'block', marginBottom: '4px' }}>
                Email
              </label>
              <input
                type="email"
                value={newCompany.email}
                onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                placeholder="partnerships@company.com"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d4c4b5',
                  background: '#fff',
                  fontFamily: '"Courier Prime", monospace',
                  fontSize: '13px',
                  color: '#3d3532'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '11px', color: '#6b5f58', display: 'block', marginBottom: '4px' }}>
                LinkedIn URL
              </label>
              <input
                type="url"
                value={newCompany.linkedin}
                onChange={(e) => setNewCompany({ ...newCompany, linkedin: e.target.value })}
                placeholder="https://linkedin.com/company/..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #d4c4b5',
                  background: '#fff',
                  fontFamily: '"Courier Prime", monospace',
                  fontSize: '13px',
                  color: '#3d3532'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '11px', color: '#6b5f58', display: 'block', marginBottom: '4px' }}>
                Notes
              </label>
              <textarea
                value={newCompany.notes}
                onChange={(e) => setNewCompany({ ...newCompany, notes: e.target.value })}
                placeholder="How did they reach out? Any context..."
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '10px',
                  border: '1px solid #d4c4b5',
                  background: '#fff',
                  fontFamily: '"Courier Prime", monospace',
                  fontSize: '13px',
                  resize: 'vertical',
                  color: '#3d3532'
                }}
              />
            </div>

            <button
              onClick={addManualCompany}
              className="btn"
              style={{
                width: '100%',
                padding: '14px',
                border: 'none',
                background: '#4a4340',
                color: '#faf6f1',
                fontSize: '13px',
                fontFamily: '"Courier Prime", monospace',
                letterSpacing: '0.5px'
              }}
            >
              Add to Tracker
            </button>
          </div>
        </div>
      )}

      {/* Corner Doodles */}
      <div style={{ position: 'absolute', top: 20, left: 20, opacity: 0.3 }}>
        <FlowerDoodle size={32} />
      </div>
      <div style={{ position: 'absolute', top: 20, right: 20, opacity: 0.3 }}>
        <StarDoodle size={28} />
      </div>
      <div style={{ position: 'absolute', bottom: 20, left: 20, opacity: 0.3 }}>
        <HeartDoodle size={24} />
      </div>
      <div style={{ position: 'absolute', bottom: 20, right: 20, opacity: 0.3 }}>
        <FlowerDoodle size={28} />
      </div>

      {/* Header */}
      <header style={{
        padding: '32px 24px 20px',
        textAlign: 'center',
        borderBottom: '1px solid #e0d5ca'
      }}>
        <h1 style={{
          fontFamily: '"Special Elite", "Courier New", monospace',
          fontSize: '28px',
          fontWeight: 'normal',
          letterSpacing: '2px',
          marginBottom: '4px',
          color: '#4a4340'
        }}>
          partnership tracker
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: 0.5 }}>
          <StarDoodle size={12} />
          <span style={{ fontSize: '11px', letterSpacing: '1px' }}>for creators</span>
          <StarDoodle size={12} />
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '8px',
        padding: '20px 24px',
        borderBottom: '1px solid #e0d5ca'
      }}>
        {[
          { id: 'tracker', label: 'Tracker' },
          { id: 'script', label: 'New Script' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="btn"
            style={{
              padding: '10px 24px',
              border: '1px solid #c9b8a8',
              borderRadius: '2px',
              background: activeTab === tab.id ? '#4a4340' : '#fff',
              color: activeTab === tab.id ? '#faf6f1' : '#4a4340',
              fontFamily: '"Courier Prime", monospace',
              fontSize: '13px',
              letterSpacing: '1px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Script Tab */}
      {activeTab === 'script' && (
        <main style={{ maxWidth: '700px', margin: '0 auto', padding: '32px 24px' }}>
          
          <section className="paper-texture" style={{
            background: '#fff',
            border: '1px solid #d4c4b5',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              letterSpacing: '1px',
              marginBottom: '12px',
              color: '#6b5f58'
            }}>
              PASTE YOUR SCRIPT
            </label>
            
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Your TikTok script goes here..."
              style={{
                width: '100%',
                minHeight: '180px',
                padding: '16px',
                border: '1px solid #e0d5ca',
                borderRadius: '2px',
                background: '#fdfcfa',
                fontFamily: '"Courier Prime", monospace',
                fontSize: '14px',
                lineHeight: '1.7',
                resize: 'vertical',
                color: '#3d3532'
              }}
            />

            <button
              onClick={processScript}
              disabled={isProcessing || !script.trim()}
              className="btn"
              style={{
                marginTop: '16px',
                width: '100%',
                padding: '14px',
                border: 'none',
                background: isProcessing ? '#c9b8a8' : '#4a4340',
                color: '#faf6f1',
                fontFamily: '"Courier Prime", monospace',
                fontSize: '13px',
                letterSpacing: '1px',
                opacity: (!script.trim() && !isProcessing) ? 0.5 : 1
              }}
            >
              {isProcessing ? 'Working...' : 'Generate'}
            </button>
            
            {/* Progress indicator */}
            {isProcessing && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '8px',
                  fontSize: '12px',
                  color: '#6b5f58'
                }}>
                  <span>{processingStep.message}</span>
                  <span>{processingStep.step}/4</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: '#e8ddd0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(processingStep.step / 4) * 100}%`,
                    height: '100%',
                    background: '#4a4340',
                    borderRadius: '3px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                <div style={{ 
                  marginTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '10px',
                  color: '#a89080'
                }}>
                  <span style={{ color: processingStep.step >= 1 ? '#4a4340' : '#a89080' }}>Analyze</span>
                  <span style={{ color: processingStep.step >= 2 ? '#4a4340' : '#a89080' }}>Match</span>
                  <span style={{ color: processingStep.step >= 3 ? '#4a4340' : '#a89080' }}>Write</span>
                  <span style={{ color: processingStep.step >= 4 ? '#4a4340' : '#a89080' }}>Done</span>
                </div>
              </div>
            )}
          </section>

          {error && (
            <div style={{
              background: '#fff5f5',
              border: '1px solid #e8c4c4',
              padding: '12px 16px',
              marginBottom: '24px',
              fontSize: '13px',
              color: '#8b5a5a'
            }}>
              {error}
            </div>
          )}

          {/* Results */}
          {generatedContent && (
            <div>
              {/* Caption */}
              <section className="paper-texture" style={{
                background: '#fff',
                border: '1px solid #d4c4b5',
                padding: '20px',
                marginBottom: '16px',
                boxShadow: '2px 2px 0 #e8ddd0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', letterSpacing: '1px', color: '#8b7f78' }}>CAPTION</span>
                  <button
                    onClick={() => copyToClipboard(`${generatedContent.caption}\n\n${generatedContent.hashtags.join(' ')}`, 'caption')}
                    className="btn"
                    style={{
                      padding: '4px 10px',
                      border: '1px solid #d4c4b5',
                      background: copiedId === 'caption' ? '#4a4340' : '#fff',
                      color: copiedId === 'caption' ? '#fff' : '#6b5f58',
                      fontSize: '11px',
                      fontFamily: '"Courier Prime", monospace'
                    }}
                  >
                    {copiedId === 'caption' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.6', marginBottom: '12px' }}>
                  {generatedContent.caption}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {generatedContent.hashtags.map((tag, i) => (
                    <span key={i} style={{
                      padding: '4px 10px',
                      background: '#f5f0eb',
                      border: '1px solid #e0d5ca',
                      fontSize: '12px',
                      color: '#6b5f58'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </section>

              {/* Partners */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', letterSpacing: '1px', color: '#8b7f78' }}>POTENTIAL PARTNERS</span>
                <SquiggleLine width={60} />
              </div>

              {generatedContent.companies.map((company, i) => {
                const isAdded = addedCompanies.has(company.name);
                return (
                <section key={i} className="paper-texture" style={{
                  background: '#fff',
                  border: '1px solid #d4c4b5',
                  padding: '20px',
                  marginBottom: '12px',
                  boxShadow: '2px 2px 0 #e8ddd0'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{company.name}</h3>
                    <button
                      onClick={() => !isAdded && addToTracker(company)}
                      disabled={isAdded}
                      className="btn"
                      style={{
                        padding: '6px 12px',
                        border: isAdded ? '1px solid #b8c9b8' : '1px solid #a89080',
                        background: isAdded ? '#e8f0e8' : '#4a4340',
                        color: isAdded ? '#5a7a5a' : '#faf6f1',
                        fontSize: '11px',
                        fontFamily: '"Courier Prime", monospace',
                        letterSpacing: '0.5px',
                        cursor: isAdded ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isAdded ? (
                        <>
                          <CheckDoodle size={12} />
                          Added
                        </>
                      ) : (
                        '+ Add'
                      )}
                    </button>
                  </div>
                  
                  <p style={{ fontSize: '13px', color: '#6b5f58', marginBottom: '12px' }}>{company.why}</p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                    {company.linkedin && (
                      <a href={company.linkedin} target="_blank" rel="noopener noreferrer" style={{
                        padding: '4px 10px',
                        background: '#f5f0eb',
                        border: '1px solid #d4c4b5',
                        fontSize: '11px',
                        color: '#4a4340',
                        textDecoration: 'none'
                      }}>
                        LinkedIn
                      </a>
                    )}
                    {company.twitter && (
                      <a 
                        href={`https://twitter.com/${company.twitter.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{
                          padding: '4px 10px',
                          background: '#f5f0eb',
                          border: '1px solid #d4c4b5',
                          fontSize: '11px',
                          color: '#4a4340',
                          textDecoration: 'none'
                        }}
                      >
                        {company.twitter}
                      </a>
                    )}
                    {company.instagram && (
                      <a 
                        href={`https://instagram.com/${company.instagram.replace('@', '')}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{
                          padding: '4px 10px',
                          background: '#f5f0eb',
                          border: '1px solid #d4c4b5',
                          fontSize: '11px',
                          color: '#4a4340',
                          textDecoration: 'none'
                        }}
                      >
                        {company.instagram}
                      </a>
                    )}
                    {company.email && (
                      <a href={`mailto:${company.email}`} style={{
                        padding: '4px 10px',
                        background: '#f5f0eb',
                        border: '1px solid #d4c4b5',
                        fontSize: '11px',
                        color: '#4a4340',
                        textDecoration: 'none'
                      }}>
                        {company.email}
                      </a>
                    )}
                  </div>

                  <div style={{
                    background: '#fdfcfa',
                    border: '1px solid #e8ddd0',
                    padding: '14px',
                    position: 'relative'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', letterSpacing: '1px', color: '#a89080' }}>DRAFT MESSAGE</span>
                      <button
                        onClick={() => copyToClipboard(company.message, `msg-${i}`)}
                        className="btn"
                        style={{
                          padding: '3px 8px',
                          border: '1px solid #d4c4b5',
                          background: copiedId === `msg-${i}` ? '#4a4340' : '#fff',
                          color: copiedId === `msg-${i}` ? '#fff' : '#6b5f58',
                          fontSize: '10px',
                          fontFamily: '"Courier Prime", monospace'
                        }}
                      >
                        {copiedId === `msg-${i}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0, color: '#4a4340', whiteSpace: 'pre-line' }}>
                      {company.message}
                    </p>
                  </div>
                </section>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* Tracker Tab */}
      {activeTab === 'tracker' && (
        <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '11px', letterSpacing: '1px', color: '#8b7f78' }}>
                  {partnerships.length} PARTNERSHIP{partnerships.length !== 1 ? 'S' : ''}
                </span>
                <SquiggleLine width={40} />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="btn"
                style={{
                  padding: '8px 14px',
                  border: '1px solid #a89080',
                  background: '#4a4340',
                  color: '#faf6f1',
                  fontSize: '11px',
                  fontFamily: '"Courier Prime", monospace',
                  letterSpacing: '0.5px'
                }}
              >
                + Add Company
              </button>
            </div>
            
            {/* Earnings Summary */}
            {partnerships.length > 0 && (
              <div style={{ 
                display: 'flex', 
                gap: '16px', 
                flexWrap: 'wrap',
                padding: '16px',
                background: '#fff',
                border: '1px solid #d4c4b5',
                marginBottom: '20px'
              }}>
                <div>
                  <div style={{ fontSize: '10px', letterSpacing: '1px', color: '#8b7f78', marginBottom: '4px' }}>
                    EARNED THIS YEAR
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#4a4340' }}>
                    ${calculateYearEarnings().toLocaleString()}
                  </div>
                </div>
                {pendingPaymentCount > 0 && (
                  <div style={{ 
                    padding: '8px 14px',
                    background: '#fff8e8',
                    border: '1px solid #e8d5a8',
                    alignSelf: 'center'
                  }}>
                    <span style={{ fontSize: '12px', color: '#8b7a50' }}>
                      {pendingPaymentCount} pending payment{pendingPaymentCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {isLoadingPartnerships ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#a89080' }}>
              Loading...
            </div>
          ) : partnerships.length === 0 ? (
            <div className="paper-texture" style={{
              background: '#fff',
              border: '1px solid #d4c4b5',
              padding: '60px 40px',
              textAlign: 'center'
            }}>
              <FlowerDoodle size={40} style={{ opacity: 0.3, marginBottom: '16px' }} />
              <p style={{ fontSize: '14px', color: '#8b7f78', marginBottom: '16px' }}>
                No partnerships yet.
              </p>
              <button
                onClick={() => setActiveTab('script')}
                className="btn"
                style={{
                  padding: '10px 20px',
                  border: '1px solid #c9b8a8',
                  background: '#4a4340',
                  color: '#faf6f1',
                  fontSize: '12px',
                  fontFamily: '"Courier Prime", monospace'
                }}
              >
                Add your first script
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${STATUSES.length}, 1fr)`,
              gap: '12px',
              overflowX: 'auto'
            }}>
              {STATUSES.map(status => {
                const statusItems = partnerships.filter(p => p.status === status);
                const isDropTarget = dragOverStatus === status;
                
                return (
                  <div 
                    key={status} 
                    style={{ minWidth: '180px' }}
                    onDragOver={(e) => handleDragOver(e, status)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, status)}
                  >
                    <div style={{
                      padding: '10px 12px',
                      background: '#f5f0eb',
                      borderBottom: '2px solid #d4c4b5',
                      marginBottom: '8px'
                    }}>
                      <span style={{ fontSize: '11px', letterSpacing: '1px', color: '#6b5f58' }}>
                        {STATUS_LABELS[status]} ({statusItems.length})
                      </span>
                    </div>
                    
                    <div 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px',
                        minHeight: '100px',
                        padding: '4px',
                        border: isDropTarget ? '2px dashed #a89080' : '2px dashed transparent',
                        background: isDropTarget ? '#f5f0eb' : 'transparent',
                        borderRadius: '4px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {statusItems.map(p => (
                        <div 
                          key={p.id}
                          className="card paper-texture"
                          draggable
                          onDragStart={(e) => handleDragStart(e, p)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setSelectedPartnership(p)}
                          style={{
                            background: '#fff',
                            border: '1px solid #d4c4b5',
                            padding: '14px',
                            boxShadow: '1px 1px 0 #e8ddd0',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ 
                            fontSize: '13px', 
                            fontWeight: 'bold', 
                            marginBottom: '6px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                          }}>
                            <span>{p.company}</span>
                            <span style={{ 
                              fontSize: '10px', 
                              color: '#a89080',
                              cursor: 'grab'
                            }}>
                              ⋮⋮
                            </span>
                          </div>
                          
                          {/* Show outreach methods for ideas/outreach */}
                          {(p.status === 'ideas' || p.status === 'outreach') && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {(p.outreachMethods || []).length > 0 ? (
                                p.outreachMethods.map(method => (
                                  <span key={method} style={{
                                    fontSize: '9px',
                                    padding: '2px 6px',
                                    background: '#f0ebe5',
                                    border: '1px solid #d4c4b5',
                                    color: '#6b5f58',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {method === 'inbound' ? 'Inbound' : method}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: '10px', color: '#a89080', fontStyle: 'italic' }}>
                                  No outreach method set
                                </span>
                              )}
                            </div>
                          )}
                          
                          {/* Show deal types for talking/won/lost */}
                          {(p.status === 'talking' || p.status === 'won' || p.status === 'lost') && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                              {(p.dealTypes || []).length > 0 ? (
                                p.dealTypes.map(type => (
                                  <span key={type} style={{
                                    fontSize: '9px',
                                    padding: '2px 6px',
                                    background: p.status === 'won' ? '#e8f0e8' : '#f0ebe5',
                                    border: `1px solid ${p.status === 'won' ? '#b8c9b8' : '#d4c4b5'}`,
                                    color: p.status === 'won' ? '#5a7a5a' : '#6b5f58',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {type === 'linkinbio' ? 'Link in Bio' : 
                                     type === 'tiktok' ? 'TikTok' :
                                     type === 'reel' ? 'Reel' :
                                     type === 'story' ? 'Story' :
                                     type === 'post' ? 'Post' :
                                     type === 'youtube' ? 'YouTube' :
                                     type === 'ugc' ? 'UGC' : type}
                                  </span>
                                ))
                              ) : (
                                <span style={{ fontSize: '10px', color: '#a89080', fontStyle: 'italic' }}>
                                  No deal type set
                                </span>
                              )}
                            </div>
                          )}
                          
                          {p.notes && (
                            <div style={{ 
                              marginTop: '8px',
                              paddingTop: '8px',
                              borderTop: '1px solid #e8ddd0',
                              fontSize: '10px',
                              color: '#a89080'
                            }}>
                              Has notes
                            </div>
                          )}
                          {p.paymentStatus === 'pending' && (
                            <div style={{ 
                              marginTop: p.notes ? '4px' : '8px',
                              paddingTop: p.notes ? '0' : '8px',
                              borderTop: p.notes ? 'none' : '1px solid #e8ddd0',
                              fontSize: '10px',
                              color: '#8b7a50',
                              background: '#fff8e8',
                              padding: '4px 8px',
                              marginLeft: '-14px',
                              marginRight: '-14px',
                              marginBottom: '-14px'
                            }}>
                              Payment pending
                            </div>
                          )}
                          {p.dealAmount && (
                            <div style={{ 
                              marginTop: '6px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: '#4a4340'
                            }}>
                              ${parseFloat(p.dealAmount).toLocaleString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* Trash Section - shown at bottom of tracker */}
      {activeTab === 'tracker' && (
        <div style={{ 
          marginTop: '40px',
          padding: '0 24px'
        }}>
          <button
            onClick={() => setShowTrash(!showTrash)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: 'none',
              fontSize: '12px',
              color: '#a89080',
              cursor: 'pointer',
              fontFamily: '"Courier Prime", monospace',
              padding: '8px 0'
            }}
          >
            <span style={{ fontSize: '14px' }}>🗑</span>
            Trash {trash.length > 0 && `(${trash.length})`}
            <span style={{ fontSize: '10px' }}>{showTrash ? '▲' : '▼'}</span>
          </button>
          
          {showTrash && (
            <div style={{
              marginTop: '12px',
              padding: '16px',
              background: '#f9f7f5',
              border: '1px dashed #d4c4b5'
            }}>
              {trash.length === 0 ? (
                <p style={{ fontSize: '12px', color: '#a89080', margin: 0 }}>
                  Trash is empty
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {trash.map(p => (
                      <div 
                        key={p.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '10px 12px',
                          background: '#fff',
                          border: '1px solid #e0d5ca'
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '13px', color: '#4a4340' }}>{p.company}</span>
                          <span style={{ fontSize: '10px', color: '#a89080', marginLeft: '8px' }}>
                            deleted {new Date(p.deletedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => restoreFromTrash(p.id)}
                            style={{
                              padding: '4px 10px',
                              background: '#fff',
                              border: '1px solid #d4c4b5',
                              fontSize: '11px',
                              color: '#4a4340',
                              fontFamily: '"Courier Prime", monospace',
                              cursor: 'pointer'
                            }}
                          >
                            Restore
                          </button>
                          <button
                            onClick={() => permanentlyDelete(p.id)}
                            style={{
                              padding: '4px 10px',
                              background: '#fff',
                              border: '1px solid #d4b5b5',
                              fontSize: '11px',
                              color: '#8b5a5a',
                              fontFamily: '"Courier Prime", monospace',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      emptyTrash();
                      setShowTrash(false);
                    }}
                    style={{
                      marginTop: '12px',
                      padding: '8px 12px',
                      background: 'none',
                      border: '1px solid #d4b5b5',
                      fontSize: '11px',
                      color: '#8b5a5a',
                      fontFamily: '"Courier Prime", monospace',
                      cursor: 'pointer'
                    }}
                  >
                    Empty Trash
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '24px',
        borderTop: '1px solid #e0d5ca',
        marginTop: '40px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <HeartDoodle size={12} style={{ opacity: 0.4 }} />
          <span style={{ fontSize: '11px', color: '#a89080', letterSpacing: '0.5px' }}>
            made for creators
          </span>
          <HeartDoodle size={12} style={{ opacity: 0.4 }} />
        </div>
      </footer>
    </div>
  );
}
