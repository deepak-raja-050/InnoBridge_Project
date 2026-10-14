import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowRight, ArrowUpRight, Bell, Bookmark, Check, ChevronDown, CircleHelp, Compass, FilePlus2, Filter, FlaskConical, GraduationCap, Lightbulb, LockKeyhole, LogOut, Menu, MessageCircle, Plus, Search, ShieldCheck, Sparkles, Users, X } from 'lucide-react';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const categories = ['All ideas', 'Technology', 'Healthcare', 'Sustainability', 'Education', 'Community'];
const initials = (name = 'Student') => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

async function request(path, options = {}, token = '') {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Something went wrong. Please try again.');
  return payload;
}

function App() {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem('innobridge-session') || 'null'); } catch { return null; }
  });
  const [view, setView] = useState(session ? 'home' : 'welcome');
  const [authMode, setAuthMode] = useState('login');
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All ideas');
  const [modal, setModal] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  const loadIdeas = async () => {
    setLoading(true); setError('');
    try { const data = await request('/api/ideas'); setIdeas(Array.isArray(data) ? data : []); }
    catch (err) { setError(err.message.includes('Failed to fetch') ? 'Can’t reach the InnoBridge server. Start the backend or check your API URL.' : err.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (session) loadIdeas(); }, [session]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timer); }, [toast]);

  const filteredIdeas = useMemo(() => ideas.filter((idea) => {
    const text = `${idea.title || ''} ${idea.description || ''} ${idea.category || ''} ${(idea.requiredSkills || []).join(' ')}`.toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesCategory = category === 'All ideas' || (idea.category || '').toLowerCase() === category.toLowerCase();
    return matchesQuery && matchesCategory;
  }), [ideas, query, category]);

  const logout = () => { localStorage.removeItem('innobridge-session'); setSession(null); setView('welcome'); setIdeas([]); };
  const notify = (message) => { setToast(message); };
  const showAuth = (mode = 'login') => { setAuthMode(mode); setView('auth'); };
  const go = (next) => { setView(next); setMobileNav(false); };

  if (view === 'welcome') return <Welcome onStart={() => showAuth('register')} onLogin={() => showAuth('login')} />;
  if (view === 'auth') return <Auth mode={authMode} setMode={setAuthMode} onBack={() => setView('welcome')} onSuccess={(data, name) => {
    const next = { token: data.token, studentId: data.student_id, name: name || 'Student' };
    localStorage.setItem('innobridge-session', JSON.stringify(next)); setSession(next); setView('home');
  }} />;
  return <div className="app-shell">
    <Sidebar current={view} go={go} logout={logout} mobileNav={mobileNav} setMobileNav={setMobileNav} />
    <main className="main-area">
      <header className="topbar"><button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)} aria-label="Open menu"><Menu size={19} /></button><div className="crumb">Workspace <span>/</span> <strong>{view === 'home' ? 'Discover' : view === 'my-ideas' ? 'My ideas' : view === 'mentors' ? 'Mentorship' : 'Notifications'}</strong></div><div className="top-actions"><button className="icon-btn notification-button" onClick={() => go('notifications')} aria-label="Notifications"><Bell size={18} /><i /></button><div className="user-chip"><span className="avatar">{initials(session?.name)}</span><span>{session?.name || 'Student'}</span><ChevronDown size={14} /></div></div></header>
      {view === 'home' && <Discover ideas={filteredIdeas} total={ideas.length} loading={loading} error={error} query={query} setQuery={setQuery} category={category} setCategory={setCategory} onCreate={() => setModal(true)} onRefresh={loadIdeas} />}
      {view === 'my-ideas' && <MyIdeas ideas={ideas.filter((idea) => String(idea.student_id) === String(session?.studentId))} loading={loading} onCreate={() => setModal(true)} />}
      {view === 'mentors' && <Mentors onAction={() => notify('Mentor discovery is ready to connect when mentor profiles are available.')} />}
      {view === 'notifications' && <Notifications onBack={() => go('home')} />}
    </main>
    {modal && <IdeaModal token={session?.token} onClose={() => setModal(false)} onCreated={() => { setModal(false); loadIdeas(); notify('Your idea is now on InnoBridge.'); }} />}
    {toast && <div className="toast"><Check size={16} />{toast}</div>}
  </div>;
}

function Brand({ inverse = false }) { return <div className={`brand ${inverse ? 'brand-inverse' : ''}`}><span className="brand-mark"><span /><span /><span /></span><span>innobridge</span></div>; }
function Welcome({ onStart, onLogin }) {
  return <div className="welcome-page"><nav className="welcome-nav"><Brand /><div className="nav-right"><a href="#how">How it works</a><a href="#principles">Our promise</a><button className="text-button" onClick={onLogin}>Log in <ArrowUpRight size={15} /></button></div></nav>
    <section className="hero"><div className="hero-copy"><div className="eyebrow"><span className="live-dot" /> A home for student innovation</div><h1>Big ideas deserve <em>good company.</em></h1><p>Find your people, get thoughtful guidance, and build something that makes a difference.</p><div className="hero-actions"><button className="button button-dark" onClick={onStart}>Find your bridge <ArrowRight size={17} /></button><a className="quiet-link" href="#how">Explore the platform <ArrowDown size={15} /></a></div><div className="hero-foot"><div className="avatar-stack"><span>AK</span><span>RM</span><span>PS</span><span>+</span></div><span>Made for curious minds<br /><b>ready to build together</b></span></div></div>
      <div className="hero-art" aria-label="Illustration of ideas connecting people"><div className="art-grid" /><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="art-core"><span className="core-spark">✳</span><span>one idea<br />can go further</span></div><div className="float-note note-one"><span className="note-icon note-lime"><Lightbulb size={18} /></span><span><b>Start with an idea</b><small>Share what you’re imagining</small></span></div><div className="float-note note-two"><span className="note-icon note-peach"><Users size={18} /></span><span><b>Find your people</b><small>Build a team that fits</small></span></div><div className="float-tag">Ideas · People · Possibility</div></div>
    </section><div className="trust-strip"><span>THE BRIDGE BETWEEN</span><b>Curiosity <i>×</i> Collaboration <i>×</i> Impact</b><span className="strip-right">BUILT FOR STUDENTS, BY STUDENTS</span></div>
    <section id="how" className="how-section"><div className="section-intro"><div className="eyebrow">A better place to begin</div><h2>From “what if?”<br /><em>to “we did it.”</em></h2><p>One thoughtful space to turn a spark into a real project, with the right support at every step.</p></div><div className="steps"><article><span className="step-no">01</span><div className="step-icon"><Lightbulb size={21} /></div><h3>Put your idea out there</h3><p>Describe the problem you care about and what you hope to change.</p></article><article><span className="step-no">02</span><div className="step-icon"><Users size={21} /></div><h3>Meet the right people</h3><p>Find collaborators whose skills and interests bring your idea to life.</p></article><article><span className="step-no">03</span><div className="step-icon"><GraduationCap size={21} /></div><h3>Grow with a mentor</h3><p>Get practical guidance from people who have been there before.</p></article></div></section>
    <section id="principles" className="promise"><div className="promise-icon"><ShieldCheck size={24} /></div><div><span className="eyebrow">Built on trust</span><h2>Your idea stays <em>yours.</em></h2><p>Choose what you share. InnoBridge is designed to help you find support without giving up ownership of your work.</p></div><button className="round-arrow" onClick={onStart} aria-label="Get started"><ArrowRight size={20} /></button></section>
    <footer className="welcome-footer"><Brand /><span>Make room for what could be.</span><button className="text-button" onClick={onStart}>Create your account <ArrowRight size={15} /></button></footer>
  </div>;
}

function Auth({ mode, setMode, onBack, onSuccess }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', department: '', year: '', skills: '' });
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      if (mode === 'register') {
        await request('/api/students', { method: 'POST', body: JSON.stringify({ ...form, skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean), year: form.year ? Number(form.year) : undefined }) });
        const data = await request('/api/login', { method: 'POST', body: JSON.stringify({ email: form.email, password: form.password }) });
        onSuccess(data, `${form.first_name} ${form.last_name}`.trim());
      } else {
        const data = await request('/api/login', { method: 'POST', body: JSON.stringify({ email: form.email, password: form.password }) });
        onSuccess(data, form.email.split('@')[0]);
      }
    } catch (err) { setError(err.message.includes('Failed to fetch') ? 'The server is offline. Please start the backend and try again.' : err.message); }
    finally { setBusy(false); }
  };
  return <div className="auth-page"><button className="back-link" onClick={onBack}>← <span>Back to InnoBridge</span></button><div className="auth-shell"><div className="auth-aside"><Brand inverse /><div><span className="eyebrow">Your next chapter starts here</span><h1>Make room for what <em>could be.</em></h1><p>Good ideas grow when the right people find each other.</p></div><div className="auth-aside-bottom"><ShieldCheck size={16} /> Your work. Your choices. Your future.</div></div><div className="auth-form-side"><div className="auth-heading"><div className="eyebrow">STUDENT COMMUNITY</div><h2>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2><p>{mode === 'login' ? 'Pick up where your ideas left off.' : 'Start building something that matters.'}</p></div>
    <form onSubmit={submit} className="auth-form">{mode === 'register' && <div className="field-row"><Field label="First name" name="first_name" value={form.first_name} onChange={update} required placeholder="Aarav" /><Field label="Last name" name="last_name" value={form.last_name} onChange={update} required placeholder="Sharma" /></div>}<Field label="Email address" type="email" name="email" value={form.email} onChange={update} required placeholder="you@university.edu" /><Field label="Password" type="password" name="password" value={form.password} onChange={update} required minLength="6" placeholder="At least 6 characters" />{mode === 'register' && <><div className="field-row"><Field label="Department" name="department" value={form.department} onChange={update} placeholder="e.g. Computer Science" /><Field label="Year of study" name="year" value={form.year} onChange={update} type="number" min="1" max="8" placeholder="e.g. 2" /></div><Field label="Skills you bring" name="skills" value={form.skills} onChange={update} placeholder="Design, Python, research…" hint="Separate skills with commas" /></>}{error && <div className="form-error" role="alert">{error}</div>}<button className="button button-dark full-button" disabled={busy}>{busy ? 'One moment…' : mode === 'login' ? 'Log in to your workspace' : 'Create my account'} <ArrowRight size={16} /></button></form><div className="auth-switch">{mode === 'login' ? 'New to InnoBridge?' : 'Already part of the community?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Create an account' : 'Log in'}</button></div><div className="privacy-note"><LockKeyhole size={14} /> Your account details are kept private and secure.</div></div></div></div>;
}
function Field({ label, hint, ...props }) { return <label className="field"><span>{label}</span><input {...props} />{hint && <small>{hint}</small>}</label>; }

function Sidebar({ current, go, logout, mobileNav, setMobileNav }) {
  const nav = [{ id: 'home', label: 'Discover', icon: Compass }, { id: 'my-ideas', label: 'My ideas', icon: Lightbulb }, { id: 'mentors', label: 'Mentorship', icon: GraduationCap }, { id: 'notifications', label: 'Notifications', icon: Bell }];
  return <><aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}><div className="sidebar-top"><Brand /><button className="icon-btn close-nav" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={18} /></button></div><div className="workspace-switch"><span className="workspace-avatar">IB</span><span><b>Student workspace</b><small>InnoBridge community</small></span><ChevronDown size={15} /></div><div className="nav-label">WORKSPACE</div><nav>{nav.map(({ id, label, icon: Icon }) => <button key={id} className={`side-link ${current === id ? 'active' : ''}`} onClick={() => go(id)}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{id === 'notifications' && <i className="nav-dot" />}</button>)}</nav><div className="sidebar-bottom"><div className="help-card"><div className="help-head"><CircleHelp size={17} /><span>Need a hand?</span></div><p>We’re here to help your idea find its footing.</p><button onClick={() => go('mentors')}>Explore mentorship <ArrowRight size={13} /></button></div><div className="sidebar-user"><span className="avatar">ST</span><span><b>Your workspace</b><small>Student account</small></span><button className="icon-btn logout-btn" onClick={logout} title="Log out"><LogOut size={16} /></button></div></div></aside>{mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="Close navigation" />}</>;
}
function Discover({ ideas, total, loading, error, query, setQuery, category, setCategory, onCreate, onRefresh }) {
  return <div className="content-wrap"><div className="welcome-banner"><div><div className="eyebrow"><span className="live-dot" /> YOUR NEXT COLLABORATION STARTS HERE</div><h1>Ideas move further <em>together.</em></h1><p>Find a spark worth building on, or put your own idea out into the world.</p><button className="button button-dark" onClick={onCreate}><Plus size={17} /> Share an idea</button></div><div className="banner-art"><div className="banner-orbit" /><div className="banner-sun">✳</div><span className="banner-leaf leaf-a" /><span className="banner-leaf leaf-b" /><span className="banner-caption">A place for<br /><b>possibility</b></span></div></div>
    <div className="metric-row"><Metric icon={Lightbulb} label="Ideas shared" value={total} /><Metric icon={Users} label="Ways to contribute" value="Open" tone="peach" /><Metric icon={GraduationCap} label="Mentors to meet" value="Growing" tone="lavender" /><div className="metric-note"><span className="metric-note-icon"><Sparkles size={17} /></span><p><b>Small step, big possibility.</b><br />Every great project starts with a conversation.</p></div></div>
    <div className="section-heading ideas-heading"><div><div className="eyebrow">COMMUNITY IDEAS</div><h2>Find something <em>to build on.</em></h2><p>Browse what students are working on and find where you can help.</p></div><button className="button button-outline" onClick={onCreate}>Post an idea <Plus size={15} /></button></div>
    <div className="filter-bar"><div className="search-box"><Search size={17} /><input aria-label="Search ideas" placeholder="Search ideas, skills, or topics" value={query} onChange={(e) => setQuery(e.target.value)} />{query && <button className="clear-search" onClick={() => setQuery('')}><X size={14} /></button>}</div><div className="filter-wrap"><Filter size={16} /><select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">{categories.map((item) => <option key={item}>{item}</option>)}</select><ChevronDown size={14} /></div><span className="result-count">{ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'}</span></div>
    {error && <div className="error-banner"><span>{error}</span><button onClick={onRefresh}>Try again</button></div>}
    {loading ? <div className="loading-state"><span className="spinner" /> Gathering ideas…</div> : ideas.length ? <div className="idea-grid">{ideas.map((idea, index) => <IdeaCard key={idea._id || idea.idea_id || index} idea={idea} index={index} />)}</div> : <div className="empty-state"><div className="empty-art"><FlaskConical size={24} /><span>✳</span></div><div className="eyebrow">A FRESH PAGE</div><h3>{query || category !== 'All ideas' ? 'No ideas found just yet.' : 'Be the first to share an idea.'}</h3><p>{query || category !== 'All ideas' ? 'Try a different search or category to see what’s growing.' : 'The next great project could start with you. Share what you’re thinking and invite the community in.'}</p><button className="button button-dark" onClick={onCreate}>Share the first idea <ArrowRight size={16} /></button></div>}
    <div className="footnote"><ShieldCheck size={15} /><span>Students choose how their ideas are shared. Public posts are visible to the community.</span><button>How privacy works <ArrowUpRight size={13} /></button></div>
  </div>;
}
function Metric({ icon: Icon, label, value, tone = '' }) { return <div className="metric"><span className={`metric-icon ${tone}`}><Icon size={18} /></span><span className="metric-copy"><small>{label}</small><b>{value}</b></span><ArrowUpRight className="metric-arrow" size={15} /></div>; }
const tones = ['mint', 'peach', 'blue', 'lavender'];
function IdeaCard({ idea, index }) {
  const [saved, setSaved] = useState(false); const skills = Array.isArray(idea.requiredSkills) ? idea.requiredSkills : (idea.requiredSkills || '').split(',').map(s => s.trim()).filter(Boolean);
  const stack = Array.isArray(idea.technologyStack) ? idea.technologyStack : (idea.technologyStack || '').split(',').map(s => s.trim()).filter(Boolean);
  return <article className="idea-card"><div className={`card-top ${tones[index % tones.length]}`}><div className="card-topline"><span className="category-pill">{idea.category || 'Open idea'}</span><button className={`save-btn ${saved ? 'saved' : ''}`} onClick={() => setSaved(!saved)} aria-label={saved ? 'Remove bookmark' : 'Save idea'}><Bookmark size={16} fill={saved ? 'currentColor' : 'none'} /></button></div><div className="card-symbol">{index % 3 === 0 ? <Lightbulb /> : index % 3 === 1 ? <Compass /> : <Sparkles />}</div><span className="card-id">IDEA / {String(idea.idea_id || index + 1).padStart(3, '0')}</span></div><div className="card-body"><h3>{idea.title}</h3><p>{idea.description || idea.problemStatement || 'An early stage idea looking for thoughtful collaborators.'}</p>{idea.expectedOutcome && <div className="outcome"><span>HOPING TO</span>{idea.expectedOutcome}</div>}<div className="tag-row">{[...skills, ...stack].slice(0, 4).map((skill) => <span key={skill}>{skill}</span>)}</div><div className="card-footer"><div className="mini-owner"><span className="avatar small-avatar">{initials(idea.ownerName || 'IB')}</span><span><small>Shared by</small><b>{idea.ownerName || 'InnoBridge student'}</b></span></div><button className="card-open" aria-label={`View ${idea.title}`}><ArrowUpRight size={17} /></button></div></div></article>;
}
function MyIdeas({ ideas, loading, onCreate }) { return <div className="content-wrap inner-page"><div className="page-kicker"><div className="eyebrow">YOUR WORKSPACE</div><h1>Your ideas, <em>in motion.</em></h1><p>Keep track of what you’ve shared and the next steps you want to take.</p></div><div className="page-toolbar"><span>{ideas.length} {ideas.length === 1 ? 'idea' : 'ideas'} shared</span><button className="button button-dark" onClick={onCreate}><Plus size={16} /> Share an idea</button></div>{loading ? <div className="loading-state"><span className="spinner" /> Loading your ideas…</div> : ideas.length ? <div className="idea-grid">{ideas.map((idea, i) => <IdeaCard key={idea._id || idea.idea_id} idea={idea} index={i} />)}</div> : <div className="empty-state compact-empty"><div className="empty-art"><Lightbulb size={24} /><span>✳</span></div><div className="eyebrow">YOUR FIRST SPARK</div><h3>You haven’t shared an idea yet.</h3><p>Make your first post and invite others to help shape what comes next.</p><button className="button button-dark" onClick={onCreate}>Share your idea <ArrowRight size={16} /></button></div>}</div>; }
function Mentors({ onAction }) { return <div className="content-wrap inner-page"><div className="page-kicker"><div className="eyebrow">LEARN FROM THE JOURNEY</div><h1>Good guidance changes <em>everything.</em></h1><p>Find experienced people who can help you move from a promising question to a thoughtful next step.</p></div><div className="mentor-feature"><div className="mentor-art"><div className="mentor-halo" /><div className="mentor-figure"><GraduationCap size={48} /></div><span className="mentor-star">✳</span><span className="mentor-orbit-label">EXPERIENCE<br />MEETS CURIOSITY</span></div><div className="mentor-copy"><span className="category-pill">A growing community</span><h2>Every builder deserves <em>a sounding board.</em></h2><p>InnoBridge is making space for thoughtful mentorship across disciplines. Mentor profiles will appear here as they join the community.</p><div className="mentor-points"><span><Check size={15} /> Practical feedback for your next step</span><span><Check size={15} /> Conversations shaped around your goals</span><span><Check size={15} /> Guidance that respects your ownership</span></div><button className="button button-dark" onClick={onAction}>How mentorship works <ArrowRight size={16} /></button></div></div><div className="mentor-note"><span><Sparkles size={18} /></span><p><b>Are you an experienced builder?</b><br />We’d love to welcome mentors who want to help student ideas grow.</p><button onClick={onAction}>Join as a mentor <ArrowUpRight size={14} /></button></div></div>; }
function Notifications({ onBack }) { return <div className="content-wrap inner-page"><div className="page-kicker"><div className="eyebrow">STAY IN THE LOOP</div><h1>Good things <em>are growing.</em></h1><p>Updates about your ideas and collaborations will find their way here.</p></div><div className="notification-empty"><div className="notification-orbit"><Bell size={26} /><span>✳</span></div><div className="eyebrow">ALL CAUGHT UP</div><h2>Nothing new right now.</h2><p>When someone connects with your work, you’ll see it here.</p><button className="button button-outline" onClick={onBack}>Back to discover <ArrowRight size={15} /></button></div></div>; }
function IdeaModal({ token, onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', description: '', category: '', problemStatement: '', requiredSkills: '', technologyStack: '', expectedOutcome: '', status: 'open' });
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setError('');
    const payload = { ...form, requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean), technologyStack: form.technologyStack.split(',').map(s => s.trim()).filter(Boolean) };
    try { await request('/api/ideas', { method: 'POST', body: JSON.stringify(payload) }, token); onCreated(); }
    catch (err) { setError(err.message.includes('Failed to fetch') ? 'The server is offline. Save your draft and try again when connected.' : err.message); }
    finally { setBusy(false); }
  };
  return <div className="modal-scrim" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><div className="idea-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-head"><div><div className="eyebrow">START WITH A SPARK</div><h2 id="modal-title">Share your idea</h2><p>Give the community enough to see where they could help.</p></div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={19} /></button></div><form onSubmit={submit} className="idea-form"><Field label="Idea title" name="title" value={form.title} onChange={update} required placeholder="A clear name for your idea" /><div className="field-row"><label className="field"><span>Category</span><select name="category" value={form.category} onChange={update} required><option value="">Choose a category</option>{categories.slice(1).map(item => <option key={item}>{item}</option>)}</select></label><Field label="Expected outcome" name="expectedOutcome" value={form.expectedOutcome} onChange={update} required placeholder="What could change?" /></div><label className="field"><span>What’s the idea?</span><textarea name="description" value={form.description} onChange={update} required rows="3" placeholder="Describe your idea in a few sentences…" /></label><label className="field"><span>What problem are you trying to solve?</span><textarea name="problemStatement" value={form.problemStatement} onChange={update} required rows="2" placeholder="Help collaborators understand why this matters…" /></label><div className="field-row"><Field label="Skills you’re looking for" name="requiredSkills" value={form.requiredSkills} onChange={update} required placeholder="Research, design, coding" /><Field label="Tools or technologies" name="technologyStack" value={form.technologyStack} onChange={update} required placeholder="React, Figma, Python" /></div><div className="privacy-choice"><ShieldCheck size={17} /><span><b>Shared with the community</b><small>Your idea will be visible publicly. You can adjust privacy settings later.</small></span><span className="toggle-on"><Check size={13} /></span></div>{error && <div className="form-error" role="alert">{error}</div>}<div className="modal-actions"><button type="button" className="button button-quiet" onClick={onClose}>Cancel</button><button className="button button-dark" disabled={busy}>{busy ? 'Sharing…' : 'Share my idea'} <ArrowRight size={16} /></button></div></form></div></div>;
}

createRoot(document.getElementById('root')).render(<App />);
