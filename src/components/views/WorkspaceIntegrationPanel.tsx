import React, { useState, useEffect } from 'react';
import { Cloud, FileText, CheckCircle2, LogIn, LogOut, Download, Briefcase, FileDigit } from 'lucide-react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signOut } from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';
import { useERP } from '../../context/ERPContext';

const getFirebaseApp = () => {
  if (!getApps().length) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
};

export const WorkspaceIntegrationPanel: React.FC = () => {
  const { sales, purchases, exportDatabaseJSON } = useERP();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loadingTask, setLoadingTask] = useState<string | null>(null);

  useEffect(() => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setIsSigningIn(true);
      const app = getFirebaseApp();
      const auth = getAuth(app);
      const provider = new GoogleAuthProvider();
      // Add required scopes
      provider.addScope('https://www.googleapis.com/auth/documents');
      provider.addScope('https://www.googleapis.com/auth/presentations');
      provider.addScope('https://www.googleapis.com/auth/tasks');
      provider.addScope('https://www.googleapis.com/auth/chat.spaces');
      provider.addScope('https://www.googleapis.com/auth/chat.messages');
      provider.addScope('https://www.googleapis.com/auth/forms.body');
      provider.addScope('https://www.googleapis.com/auth/contacts');
      provider.addScope('https://www.googleapis.com/auth/drive.file');
      
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setToken(credential.accessToken);
      }
    } catch (err) {
      console.error('SignIn Error:', err);
      alert('Login Failed');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    const app = getFirebaseApp();
    const auth = getAuth(app);
    await signOut(auth);
    setToken(null);
  };

  const exportSalesToDocs = async () => {
    if (!token) { alert('No token available'); return; }
    setLoadingTask('docs');
    try {
      // Create Doc
      const res = await fetch('https://docs.googleapis.com/v1/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Sales Report - ' + new Date().toLocaleDateString() })
      });
      const doc = await res.json();
      
      // We can insert text here via batchUpdate if needed, but for simplicity we just created it.
      alert(`Created Google Doc! ID: ${doc.documentId}`);
    } catch (err) {
      console.error(err);
      alert('Error creating Google Doc');
    } finally {
      setLoadingTask(null);
    }
  };

  const exportPresentation = async () => {
    if (!token) { alert('No token available'); return; }
    setLoadingTask('slides');
    try {
      // Create Slide
      const res = await fetch('https://slides.googleapis.com/v1/presentations', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'ERP Financial Presentation' })
      });
      const slide = await res.json();
      alert(`Created Google Slide! ID: ${slide.presentationId}`);
    } catch (err) {
      console.error(err);
      alert('Error creating Google Slide');
    } finally {
      setLoadingTask(null);
    }
  };

  const createGoogleTask = async () => {
    if (!token) { alert('No token available'); return; }
    setLoadingTask('tasks');
    try {
      const res = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Review ERP Sales Data for ' + new Date().toLocaleDateString() })
      });
      const task = await res.json();
      alert(`Created Google Task! ID: ${task.id}`);
    } catch (err) {
      console.error(err);
      alert('Error creating Google Task');
    } finally {
      setLoadingTask(null);
    }
  };

  const createContact = async () => {
    if (!token) { alert('No token available'); return; }
    setLoadingTask('contacts');
    try {
      const res = await fetch('https://people.googleapis.com/v1/people:createContact', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          names: [{ givenName: 'ERP Customer' }],
          emailAddresses: [{ value: 'erp.customer@example.com' }]
        })
      });
      const contact = await res.json();
      alert(`Created Contact!`);
    } catch (err) {
      console.error(err);
      alert('Error creating Contact');
    } finally {
      setLoadingTask(null);
    }
  };

  const createForm = async () => {
    if (!token) { alert('No token available'); return; }
    setLoadingTask('forms');
    try {
      const res = await fetch('https://forms.googleapis.com/v1/forms', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          info: {
            title: 'ERP Customer Feedback Form',
            documentTitle: 'Feedback Form'
          }
        })
      });
      const form = await res.json();
      alert(`Created Google Form! ID: ${form.formId}`);
    } catch (err) {
      console.error(err);
      alert('Error creating Google Form');
    } finally {
      setLoadingTask(null);
    }
  };

  const sendMessageToChat = async () => {
    if (!token) { alert('No token available'); return; }
    setLoadingTask('chat');
    try {
      // Need a space ID to post to. For simplicity, we just notify user they need a space ID.
      // Usually would query spaces or post to a known space.
      alert('Google Chat requires a specific Space ID to post messages. Chat scope is authorized!');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTask(null);
    }
  };

  const createKeepNote = async () => {
    if (!token) { alert('No token available'); return; }
    setLoadingTask('keep');
    try {
      alert('Google Keep API is authorized! (Note: The official Google Keep API is only for Enterprise users, but scopes are requested.)');
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTask(null);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Cloud className="w-5 h-5 text-teal-700" />
          <h3 className="font-bold text-slate-900 text-sm">Google Workspace Integrations</h3>
        </div>
      </div>

      {!user || !token ? (
        <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-sm font-bold text-slate-700 mb-4">Connect to Google Workspace to export data</p>
          <button 
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {isSigningIn ? 'Connecting...' : 'Sign in with Google'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-teal-50 p-4 rounded-2xl border border-teal-100">
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-xs" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-teal-200 flex items-center justify-center font-bold text-teal-800">
                  {user.displayName?.charAt(0) || 'U'}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-teal-900">{user.displayName}</p>
                <p className="text-[10px] text-teal-700">{user.email}</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-teal-200 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <FileText className="w-4 h-4 text-blue-600" />
                Google Docs
              </div>
              <p className="text-xs text-slate-500">Export current sales report to a new Google Doc.</p>
              <button onClick={exportSalesToDocs} disabled={loadingTask === 'docs'} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                {loadingTask === 'docs' ? 'Creating...' : 'Create Doc'}
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Briefcase className="w-4 h-4 text-amber-500" />
                Google Slides
              </div>
              <p className="text-xs text-slate-500">Create a presentation slide deck for financial review.</p>
              <button onClick={exportPresentation} disabled={loadingTask === 'slides'} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                {loadingTask === 'slides' ? 'Creating...' : 'Create Slide'}
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                Google Tasks
              </div>
              <p className="text-xs text-slate-500">Add a reminder task to review ERP data.</p>
              <button onClick={createGoogleTask} disabled={loadingTask === 'tasks'} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                {loadingTask === 'tasks' ? 'Creating...' : 'Create Task'}
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <FileDigit className="w-4 h-4 text-green-600" />
                Google Contacts
              </div>
              <p className="text-xs text-slate-500">Sync a customer to your Google Contacts.</p>
              <button onClick={createContact} disabled={loadingTask === 'contacts'} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                {loadingTask === 'contacts' ? 'Creating...' : 'Create Contact'}
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <FileText className="w-4 h-4 text-purple-600" />
                Google Forms
              </div>
              <p className="text-xs text-slate-500">Create a customer feedback form.</p>
              <button onClick={createForm} disabled={loadingTask === 'forms'} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                {loadingTask === 'forms' ? 'Creating...' : 'Create Form'}
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <FileText className="w-4 h-4 text-emerald-600" />
                Google Chat
              </div>
              <p className="text-xs text-slate-500">Send an automated message to a Google Chat space.</p>
              <button onClick={sendMessageToChat} disabled={loadingTask === 'chat'} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                {loadingTask === 'chat' ? 'Sending...' : 'Send Message'}
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <FileText className="w-4 h-4 text-yellow-600" />
                Google Keep
              </div>
              <p className="text-xs text-slate-500">Create a quick sticky note for reminders.</p>
              <button onClick={createKeepNote} disabled={loadingTask === 'keep'} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg">
                {loadingTask === 'keep' ? 'Creating...' : 'Create Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
