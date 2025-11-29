
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { SchoolEvent, Profile, FeedPost } from '../types';
import { EventCard } from '../components/EventCard';
import { MOCK_EVENTS } from '../services/mockData';
import { Bell, Trophy, Zap, MessageCircle } from 'lucide-react';
import { getClassIdentity } from '../services/classIdentity';

interface HomeProps {
  userProfile: Profile | null;
}

export const Home: React.FC<HomeProps> = ({ userProfile }) => {
  const [nextEvent, setNextEvent] = useState<SchoolEvent | null>(null);
  const [latestPost, setLatestPost] = useState<FeedPost | null>(null);

  useEffect(() => {
    // 1. Fetch Next Event
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('school_events')
        .select('*')
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(1);

      if (!error && data && data.length > 0) {
        setNextEvent(data[0] as SchoolEvent);
      } else {
        setNextEvent(MOCK_EVENTS[0]);
      }
    };
    fetchEvents();

    // 2. Fetch Latest Post (Initial)
    const fetchLatestPost = async () => {
      const { data } = await supabase
        .from('feed_posts')
        .select(`
          *,
          profiles:user_id (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setLatestPost({ ...data, profile: data.profiles });
      }
    };
    fetchLatestPost();

    // 3. Subscribe to Real-time Feed Updates
    const channel = supabase
      .channel('home_feed_pulse')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_posts' },
        async (payload) => {
          // Fetch the full profile details for the new post
          const { data } = await supabase
            .from('feed_posts')
            .select(`*, profiles:user_id (full_name, avatar_url)`)
            .eq('id', payload.new.id)
            .single();
            
          if (data) {
            setLatestPost({ ...data, profile: data.profiles });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const classIdentity = userProfile?.year_of_completion ? getClassIdentity(userProfile.year_of_completion) : null;

  return (
    <div className="pb-24 pt-14 px-4 h-full overflow-y-auto no-scrollbar bg-slate-50">
      {/* Header */}
      <div className="fixed top-0 left-0 w-full bg-white/90 backdrop-blur-md z-10 border-b border-gray-100 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
           <div className="w-8 h-8 rounded-lg bg-school-700 flex items-center justify-center text-white font-bold text-sm">SJ</div>
           <h1 className="text-lg font-bold text-school-900">SJNOSA Connect</h1>
        </div>
        <button className="relative p-2 rounded-full hover:bg-gray-100">
          <Bell size={20} className="text-gray-600" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="mt-4 bg-gradient-to-r from-school-800 to-school-600 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
        <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1">Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Alumnus'}!</h2>
            {classIdentity ? (
                <div className="flex items-center gap-2 mb-4 text-school-100">
                    <img src={classIdentity.badgeUrl} className="w-5 h-5 rounded-md opacity-90" />
                    <span className="text-sm font-medium">{classIdentity.name} Class of {userProfile?.year_of_completion}</span>
                </div>
            ) : (
                <p className="text-school-100 text-sm mb-4">Complete your profile to join your class.</p>
            )}
            
            <div className="flex space-x-2">
                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                    Alumni Member
                </span>
            </div>
        </div>
        {/* Decorative background element */}
        <div className="absolute right-0 bottom-0 opacity-10">
             <Trophy size={120} />
        </div>
      </div>

      {/* Live Community Pulse - Replaces Static Stats */}
      <div className="mb-6">
         <div className="flex items-center gap-2 mb-3">
            <Zap size={18} className="text-amber-500 fill-amber-500" />
            <h3 className="text-lg font-bold text-gray-900">Community Pulse</h3>
            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
         </div>
         
         {latestPost ? (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex gap-3 items-start relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-school-50 to-transparent rounded-bl-3xl opacity-50"></div>
               
               <img 
                  src={latestPost.profile?.avatar_url || `https://ui-avatars.com/api/?name=${latestPost.profile?.full_name}`} 
                  className="w-10 h-10 rounded-full object-cover border border-gray-100 flex-shrink-0"
               />
               <div className="flex-1 z-10">
                  <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-gray-900">{latestPost.profile?.full_name}</span>
                      <span className="text-[10px] text-gray-400">Just now</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                     "{latestPost.content}"
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-gray-400 text-xs">
                      <span className="flex items-center gap-1"><MessageCircle size={12} /> Join the conversation</span>
                  </div>
               </div>
            </div>
         ) : (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 text-center text-gray-400 text-sm">
               Waiting for new updates...
            </div>
         )}
      </div>

      {/* Next Event Highlight */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-3">
          <h3 className="text-lg font-bold text-gray-900">Up Next</h3>
          <span className="text-xs text-school-600 font-medium">View Calendar</span>
        </div>
        {nextEvent && <EventCard event={nextEvent} />}
      </div>
    </div>
  );
};
