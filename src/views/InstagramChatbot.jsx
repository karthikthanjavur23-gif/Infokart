import React, { useState, useEffect } from 'react';
import { ToggleLeft, ToggleRight, LayoutTemplate, Workflow, Settings } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const InstagramChatbot = () => {
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [storyMentionsEnabled, setStoryMentionsEnabled] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/bot/config/instagram`)
      .then(r => r.json())
      .then(data => {
        setAutoReplyEnabled(!!data.autoReplyEnabled);
        setStoryMentionsEnabled(!!data.storyMentionsEnabled);
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/bot/config`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'instagram', key: 'autoReplyEnabled', value: autoReplyEnabled })
      });
      await fetch(`${API_BASE_URL}/api/bot/config`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: 'instagram', key: 'storyMentionsEnabled', value: storyMentionsEnabled })
      });
      alert('Saved Successfully!');
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1>Instagram Chatbot Automation</h1>
        <button className="btn-primary" onClick={handleSave}>Save Changes</button>
      </div>


      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        
        {/* Settings Panel */}
        <div className="flex-col gap-6">
          <div className="card">
            <h3 className="mb-4 flex items-center gap-2"><Settings size={18} /> Global Triggers</h3>
            
            <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
              <div>
                <div style={{ fontWeight: 500 }}>Auto-Reply to DMs</div>
                <div className="text-muted" style={{ fontSize: '13px' }}>Respond when a user messages you first.</div>
              </div>
              <div style={{ cursor: 'pointer', color: autoReplyEnabled ? 'var(--color-success)' : 'var(--color-text-muted)' }} onClick={() => setAutoReplyEnabled(!autoReplyEnabled)}>
                {autoReplyEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <div style={{ fontWeight: 500 }}>Story Mentions</div>
                <div className="text-muted" style={{ fontSize: '13px' }}>Send a thank you message when tagged.</div>
              </div>
              <div style={{ cursor: 'pointer', color: storyMentionsEnabled ? 'var(--color-success)' : 'var(--color-text-muted)' }} onClick={() => setStoryMentionsEnabled(!storyMentionsEnabled)}>
                {storyMentionsEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
              </div>
            </div>
          </div>

          <div className="card mt-4">
            <h3 className="mb-4">Chatbot Templates</h3>
            <div className="flex-col gap-2">
              <button className="btn-secondary flex justify-between" style={{ width: '100%' }}>Lead Generation <LayoutTemplate size={16} /></button>
              <button className="btn-secondary flex justify-between" style={{ width: '100%' }}>Customer Support <LayoutTemplate size={16} /></button>
              <button className="btn-secondary flex justify-between" style={{ width: '100%' }}>Product FAQ <LayoutTemplate size={16} /></button>
            </div>
          </div>
        </div>

        {/* Builder Canvas Simulation */}
        <div className="card" style={{ backgroundColor: 'var(--color-background)', display: 'flex', flexDirection: 'column' }}>
          <h3 className="mb-4 flex items-center gap-2"><Workflow size={18} /> Flow Builder Preview</h3>
          <div style={{ flex: 1, border: '2px dashed var(--color-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface)', position: 'relative' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ padding: '12px 24px', backgroundColor: 'var(--color-primary-dark)', color: 'white', borderRadius: '8px', fontWeight: 500 }}>
                Trigger: New Direct Message
              </div>
              <div style={{ width: '2px', height: '20px', backgroundColor: 'var(--color-border)' }}></div>
              <div style={{ padding: '12px 24px', backgroundColor: 'white', border: '1px solid var(--color-border)', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                Send: "Hi! 👋 Thanks for reaching out. How can we help today?"
              </div>
              <div style={{ width: '2px', height: '20px', backgroundColor: 'var(--color-border)' }}></div>
              <div className="flex gap-4">
                <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '20px', fontSize: '14px' }}>
                  Option: Book Demo
                </div>
                <div style={{ padding: '8px 16px', backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-primary)', color: 'var(--color-primary)', borderRadius: '20px', fontSize: '14px' }}>
                  Option: View Pricing
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default InstagramChatbot;
