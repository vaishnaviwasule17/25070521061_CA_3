import { useEffect, useState } from "react";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("taskbloomUser") || "null"); } catch { return null; }
  });
  const [authMode, setAuthMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [error, setError] = useState("");

  async function handleAuth(event) {
    event.preventDefault(); setAuthError(""); setAuthLoading(true);
    try {
      const response = await fetch(`${API}/api/auth/${authMode === "signup" ? "signup" : "login"}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not sign in.");
      localStorage.setItem("taskbloomUser", JSON.stringify(data.user));
      setUser(data.user); setPassword(""); setAuthError("");
    } catch (err) {
      setAuthError(err.message === "Failed to fetch" ? "Cannot reach backend. Start the server and make sure MongoDB is running." : err.message);
    } finally { setAuthLoading(false); }
  }

  async function loadTasks() {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API}/api/tasks`, { headers: { "x-user-id": user.id } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load tasks");
      setTasks(data); setError("");
    } catch (err) { setError(err.message || "Backend is not connected yet."); }
  }
  useEffect(() => { if (user?.id) loadTasks(); }, [user?.id]);

  async function addTask(event) {
    event.preventDefault(); if (!title.trim()) return;
    try {
      const response = await fetch(`${API}/api/tasks`, { method: "POST", headers: { "Content-Type": "application/json", "x-user-id": user.id }, body: JSON.stringify({ title, subject, dueDate, priority }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.message || "Could not save task");
      setTasks((previous) => [data, ...previous]); setTitle(""); setSubject(""); setDueDate(""); setPriority("Medium"); setError("");
    } catch (err) { setError(err.message || "Task could not be saved. Check the backend connection."); }
  }
  async function toggleTask(task) {
    try {
      const response = await fetch(`${API}/api/tasks/${task._id}`, { method: "PUT", headers: { "Content-Type": "application/json", "x-user-id": user.id }, body: JSON.stringify({ completed: !task.completed }) });
      const updated = await response.json(); if (!response.ok) throw new Error(updated.message || "Update failed");
      setTasks((previous) => previous.map((item) => item._id === updated._id ? updated : item));
    } catch (err) { setError(err.message || "Could not update the task."); }
  }
  async function deleteTask(id) {
    try {
      const response = await fetch(`${API}/api/tasks/${id}`, { method: "DELETE", headers: { "x-user-id": user.id } });
      if (!response.ok) throw new Error("Delete failed"); setTasks((previous) => previous.filter((task) => task._id !== id));
    } catch (err) { setError(err.message || "Could not delete the task."); }
  }
  function logout() { localStorage.removeItem("taskbloomUser"); setUser(null); setTasks([]); setAuthMode("login"); }

  if (!user) return (
    <main className="auth-page">
      <section className="auth-art">
        <a className="logo" href="#">🌱 TaskBloom</a>
        <div className="art-copy"><span className="art-spark">✦</span><p className="eyebrow">YOUR PERSONAL STUDY SPACE</p><h1>Small steps.<br />Big achievements.</h1><p>Plan your day, nurture your goals, and watch your progress bloom.</p><div className="flower-art">🌷 🌼 🌱</div></div>
        <small>Made for students who want to bloom.</small>
      </section>
      <section className="auth-side"><div className="auth-card">
        <div className="mobile-logo">🌱 TaskBloom</div>
        <p className="eyebrow">WELCOME TO TASKBLOOM</p>
        <h2>{authMode === "signup" ? "Create your account" : "Welcome back!"}</h2>
        <p className="auth-subtitle">{authMode === "signup" ? "Start building better study habits today." : "Sign in to continue to your study space."}</p>
        <div className="auth-tabs"><button className={authMode === "login" ? "active" : ""} onClick={() => { setAuthMode("login"); setAuthError(""); }}>Sign in</button><button className={authMode === "signup" ? "active" : ""} onClick={() => { setAuthMode("signup"); setAuthError(""); }}>Create account</button></div>
        <form className="auth-form" onSubmit={handleAuth}>
          {authMode === "signup" && <><label>Full name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your name" autoComplete="name" required /></>}
          <label>Email address</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required />
          <label>Password</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={authMode === "signup" ? "At least 6 characters" : "Enter your password"} minLength={authMode === "signup" ? 6 : undefined} autoComplete={authMode === "signup" ? "new-password" : "current-password"} required />
          {authError && <p className="auth-error">{authError}</p>}
          <button className="primary auth-submit" type="submit" disabled={authLoading}>{authLoading ? "Please wait..." : authMode === "signup" ? "Create account →" : "Sign in →"}</button>
        </form>
        <p className="auth-switch">{authMode === "signup" ? "Already have an account?" : "New to TaskBloom?"} <button onClick={() => { setAuthMode(authMode === "signup" ? "login" : "signup"); setAuthError(""); }}>{authMode === "signup" ? "Sign in" : "Create an account"}</button></p>
        <p className="auth-note">Your account is saved in your TaskBloom database.</p>
      </div></section>
    </main>
  );

  const completed = tasks.filter((task) => task.completed).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;
  return (
    <main className="page">
      <header className="topbar"><a className="logo" href="/">🌱 TaskBloom</a><span className="tagline">Small steps. Big achievements.</span><div className="user-menu"><span>Hi, {user.name.split(" ")[0]} 👋</span><button onClick={logout}>Sign out</button></div></header>
      <section className="welcome"><div><p className="eyebrow">YOUR PERSONAL STUDY SPACE</p><h1>Make today count ✨</h1><p>Organize your assignments, track your progress, and bloom.</p></div><div className="progress-card"><span>Overall progress</span><strong>{progress}%</strong><div className="progress-track"><div style={{ width: `${progress}%` }} /></div><small>{completed} of {tasks.length} tasks completed</small></div></section>
      {error && <p className="error">{error}</p>}
      <section className="layout"><form className="panel task-form" onSubmit={addTask}><h2>＋ Add a new task</h2><label>Task name</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Complete DSA assignment" required /><label>Subject</label><input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Computer Science" /><label>Due date</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /><label>Priority</label><select value={priority} onChange={(e) => setPriority(e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select><button className="primary" type="submit">Add task +</button></form>
        <section className="panel task-list"><div className="list-heading"><div><h2>My tasks</h2><p>Your goals, all in one place.</p></div><span className="count">{tasks.length} tasks</span></div>
          {tasks.length === 0 ? <div className="empty"><span>🌼</span><h3>Your journey starts here!</h3><p>Add your first task to get started.</p></div> : tasks.map((task) => <article className={`task ${task.completed ? "done" : ""}`} key={task._id}><input type="checkbox" checked={task.completed} onChange={() => toggleTask(task)} aria-label={`Mark ${task.title} completed`} /><div className="task-info"><strong>{task.title}</strong><p>{task.subject || "Personal"}{task.dueDate ? ` · Due ${task.dueDate}` : ""}</p><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority} priority</span></div><button className="delete" onClick={() => deleteTask(task._id)} aria-label={`Delete ${task.title}`}>🗑</button></article>)}
        </section></section><footer>Made with 💜 for students who want to bloom.</footer>
    </main>
  );
}
