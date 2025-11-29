import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Session } from '@supabase/supabase-js';
import { ViewState, Profile, NotificationItem } from './types';
import { BottomNav } from './components/BottomNav';
import { Home } from './views/Home';
import { Events } from './views/Events';
import { Chat } from './views/Chat';
import { Profile as ProfileView } from './views/Profile';
import { Auth } from './components/Auth';
import { X, Bell } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationItem | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setUserProfile(null);
    });

    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }

    return () => subscription.unsubscribe();
  }, []);

  // Real-time Notification Listener
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('public:school_events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'school_events' },
        (payload) => {
          const newEvent = payload.new as any;
          const notif: NotificationItem = {
            id: Date.now().toString(),
            title: 'New Event!',
            message: `${newEvent.title} has been added to the calendar.`,
            type: 'event'
          };
          
          // Show In-App Toast
          setNotification(notif);
          setTimeout(() => setNotification(null), 5000);

          // Show Browser Notification
          if (Notification.permission === 'granted') {
            new Notification('SJNOSA Connect', {
              body: notif.message,
              icon: '/icon.png' // Placeholder
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUserProfile(data as Profile);
    } else {
        // Fallback for demo if trigger failed or mock user
        setUserProfile({
            id: userId,
            email: session?.user.email || '',
            full_name: session?.user.email?.split('@')[0] || 'User',
            role: 'alumni', // Default fallback
            avatar_url: null,
            year_of_completion: 2018,
            current_profession: null,
            job_title: null,
            bio: null,
            location: null,
            linked_in_url: null,
            is_public_profile: true
        });
    }
  };

  if (isLoading) {
      return (
          <div className="w-full h-screen flex items-center justify-center bg-slate-50">
              <div className="w-10 h-10 border-4 border-school-200 border-t-school-600 rounded-full animate-spin"></div>
          </div>
      )
  }

  if (!session) {
    return <Auth />;
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-50 font-sans max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-gray-200">
      
      {/* Global In-App Notification Toast */}
      {notification && (
        <div className="absolute top-4 left-4 right-4 z-[60] animate-in slide-in-from-top-2">
          <div className="bg-school-800 text-white p-4 rounded-xl shadow-lg flex items-start gap-3 border border-school-600">
            <div className="bg-school-600 p-2 rounded-full">
              <Bell size={18} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm">{notification.title}</h4>
              <p className="text-xs text-school-100 mt-1">{notification.message}</p>
            </div>
            <button onClick={() => setNotification(null)} className="text-school-300 hover:text-white">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 h-full overflow-hidden relative">
        {currentView === 'HOME' && <Home userProfile={userProfile} />}
        {currentView === 'EVENTS' && <Events userProfile={userProfile} />}
        {currentView === 'CHAT' && <Chat currentUser={userProfile} />}
        {currentView === 'PROFILE' && <ProfileView userProfile={userProfile} />}
      </div>

      {/* Bottom Navigation */}
      <BottomNav currentView={currentView} setView={setCurrentView} />
    </div>
  );
};

export default App;