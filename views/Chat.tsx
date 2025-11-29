
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Profile, ChatMessage, FeedPost, FeedComment } from '../types';
import { Send, ArrowLeft, Search, MessageSquare, Heart, Image as ImageIcon, X, Loader2, MoreVertical, Phone, Video, Info } from 'lucide-react';
import { getClassIdentity } from '../services/classIdentity';
import { MOCK_COMMENTS } from '../services/mockData';

interface ChatProps {
  currentUser: Profile | null;
}

export const Chat: React.FC<ChatProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'messages'>('feed');
  const [activeChatUser, setActiveChatUser] = useState<Profile | null>(null);

  // --- MESSAGES LOGIC ---
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // --- FEED LOGIC ---
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- COMMENT LOGIC ---
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // Initial Fetch
  useEffect(() => {
    if (activeTab === 'messages') {
      fetchProfiles();
    } else {
      fetchPosts();
    }
  }, [activeTab, currentUser]);

  // --- FEED FUNCTIONS ---
  const fetchPosts = async () => {
    if (!currentUser) return;

    // 1. Fetch Posts
    const { data: postsData, error: postsError } = await supabase
      .from('feed_posts')
      .select(`
        *,
        profiles:user_id (id, full_name, avatar_url, year_of_completion)
      `)
      .order('created_at', { ascending: false });

    // 2. Fetch User's Likes to compute 'liked_by_me'
    const { data: likesData } = await supabase
      .from('feed_likes')
      .select('post_id')
      .eq('user_id', currentUser.id);

    const likedPostIds = new Set(likesData?.map((l: any) => l.post_id) || []);

    if (!postsError && postsData) {
        const formattedPosts: FeedPost[] = postsData.map((p: any) => ({
            ...p,
            profile: p.profiles,
            liked_by_me: likedPostIds.has(p.id)
        }));
        setPosts(formattedPosts);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = async () => {
    if ((!newPostContent.trim() && !newPostImage) || !currentUser) return;
    setPosting(true);

    const { error } = await supabase.from('feed_posts').insert({
      user_id: currentUser.id,
      content: newPostContent,
      image_url: newPostImage, 
      likes_count: 0,
      comments_count: 0
    });

    if (!error) {
      setNewPostContent('');
      setNewPostImage(null);
      fetchPosts(); 
    }
    setPosting(false);
  };

  const handleLike = async (post: FeedPost) => {
    if (!currentUser) return;
    
    // Optimistic Update
    const isLiked = post.liked_by_me;
    setPosts(prev => prev.map(p => {
        if (p.id === post.id) {
            return { 
                ...p, 
                likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1, 
                liked_by_me: !isLiked 
            };
        }
        return p;
    }));

    if (isLiked) {
        // Unlike
        await supabase.from('feed_likes').delete().eq('post_id', post.id).eq('user_id', currentUser.id);
    } else {
        // Like
        await supabase.from('feed_likes').insert({ post_id: post.id, user_id: currentUser.id });
    }
  };

  const toggleComments = async (postId: string) => {
      if (expandedPostId === postId) {
          setExpandedPostId(null);
          setComments([]);
      } else {
          setExpandedPostId(postId);
          fetchComments(postId);
      }
  };

  const fetchComments = async (postId: string) => {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('feed_comments')
        .select(`
            *,
            profiles:user_id (id, full_name, avatar_url, year_of_completion)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      
      if (!error && data) {
          setComments(data.map((c: any) => ({ ...c, profile: c.profiles })));
      } else if (!data) {
           setComments(MOCK_COMMENTS.filter(c => c.post_id === postId));
      }
      setLoadingComments(false);
  };

  const handlePostComment = async (postId: string) => {
      if (!newCommentText.trim() || !currentUser) return;
      
      const text = newCommentText;
      setNewCommentText(''); // Clear input immediately

      // Optimistic append
      const tempComment: FeedComment = {
          id: 'temp-' + Date.now(),
          post_id: postId,
          user_id: currentUser.id,
          content: text,
          created_at: new Date().toISOString(),
          profile: currentUser
      };
      setComments(prev => [...prev, tempComment]);

      // DB Insert
      const { error } = await supabase.from('feed_comments').insert({
          post_id: postId,
          user_id: currentUser.id,
          content: text
      });

      if (error) {
          alert('Failed to post comment: ' + error.message);
      } else {
          fetchComments(postId);
          // Update local post comment count
          setPosts(prev => prev.map(p => p.id === postId ? {...p, comments_count: p.comments_count + 1} : p));
      }
  };

  // --- MESSAGES FUNCTIONS ---
  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUser?.id || '')
      .order('full_name');
    if (!error && data) setProfiles(data as Profile[]);
  };

  useEffect(() => {
    if (!activeChatUser || !currentUser) return;
    const fetchMessages = async () => {
      setLoadingMessages(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChatUser.id}),and(sender_id.eq.${activeChatUser.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data.map((msg: any) => ({ ...msg, is_me: msg.sender_id === currentUser.id })));
      }
      setLoadingMessages(false);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat:${currentUser.id}:${activeChatUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${currentUser.id}` }, 
      (payload) => {
          if ((payload.new as any).sender_id === activeChatUser.id) {
             setMessages(prev => [...prev, { ...(payload.new as any), is_me: false }]);
          }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeChatUser, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChatUser]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !activeChatUser || !currentUser) return;
    const content = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), sender_id: currentUser.id, receiver_id: activeChatUser.id, content, created_at: new Date().toISOString(), is_me: true }]);
    await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: activeChatUser.id, content });
  };

  // --- RENDER HELPERS ---
  const renderIdentity = (year: number) => {
    const identity = getClassIdentity(year);
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${identity.bg} ${identity.color} border border-current/10`}>
        <img src={identity.badgeUrl} alt={identity.name} className="w-3 h-3 rounded-sm" />
        {identity.name} '{year.toString().slice(-2)}
      </span>
    );
  };

  // Helper to group messages by sender and date
  const groupMessages = (msgs: ChatMessage[]) => {
    const groups: { date: string, msgs: ChatMessage[] }[] = [];
    let lastDate = '';

    msgs.forEach(msg => {
      const msgDate = new Date(msg.created_at).toDateString();
      if (msgDate !== lastDate) {
        groups.push({ date: msgDate, msgs: [] });
        lastDate = msgDate;
      }
      groups[groups.length - 1].msgs.push(msg);
    });
    return groups;
  };

  const getDayLabel = (dateStr: string) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';
    return dateStr;
  };


  // --- SUB-COMPONENTS RENDER ---

  if (activeChatUser) {
    // 1-on-1 Chat View - MODERN REDESIGN
    const groupedMessages = groupMessages(messages);
    
    return (
      <div className="flex flex-col h-full bg-slate-50 relative">
        {/* Modern Minimal Header */}
        <div className="bg-white/80 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between z-20 sticky top-0">
          <div className="flex items-center gap-3">
             <button onClick={() => setActiveChatUser(null)} className="hover:bg-gray-100 p-2 rounded-full transition-colors -ml-2">
                <ArrowLeft size={20} className="text-gray-700" />
             </button>
             <div className="relative">
                 <img 
                    src={activeChatUser.avatar_url || `https://ui-avatars.com/api/?name=${activeChatUser.full_name}&background=random`} 
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                 />
                 <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
             </div>
             <div>
                <h3 className="font-bold text-gray-900 text-sm leading-tight">{activeChatUser.full_name}</h3>
                <div className="flex items-center gap-1 mt-0.5">
                    {activeChatUser.year_of_completion && (
                         <span className="text-[10px] text-school-600 font-medium">{getClassIdentity(activeChatUser.year_of_completion).name}</span>
                    )}
                    <span className="text-[10px] text-gray-400">• Online</span>
                </div>
             </div>
          </div>
          <button className="text-gray-400 hover:text-gray-600">
             <MoreVertical size={20} />
          </button>
        </div>

        {/* Chat Body - Smart Grouping */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 bg-slate-50">
          {groupedMessages.map((group, groupIdx) => (
             <div key={groupIdx}>
                {/* Date Separator */}
                <div className="flex justify-center mb-4">
                   <span className="bg-gray-200/50 text-gray-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      {getDayLabel(group.date)}
                   </span>
                </div>

                <div className="space-y-1">
                   {group.msgs.map((msg, idx) => {
                      const isLastInGroup = idx === group.msgs.length - 1;
                      const isFirstInGroup = idx === 0;
                      
                      return (
                        <div key={msg.id} className={`flex ${msg.is_me ? 'justify-end' : 'justify-start'} group mb-1`}>
                           <div className={`max-w-[80%] relative ${msg.is_me ? 'items-end' : 'items-start'} flex flex-col`}>
                              
                              <div 
                                className={`px-4 py-2.5 text-sm shadow-sm transition-all
                                   ${msg.is_me 
                                      ? 'bg-gradient-to-br from-school-600 to-school-700 text-white rounded-2xl rounded-tr-sm' 
                                      : 'bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm'
                                   }
                                   ${!isLastInGroup && msg.is_me ? 'rounded-br-md mb-0.5' : ''}
                                   ${!isLastInGroup && !msg.is_me ? 'rounded-bl-md mb-0.5' : ''}
                                `}
                              >
                                  {msg.content}
                              </div>
                              
                              {/* Time Stamp - Only show for last message in sequence */}
                              {isLastInGroup && (
                                  <span className={`text-[9px] mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${msg.is_me ? 'text-gray-400 mr-1' : 'text-gray-400 ml-1'}`}>
                                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </span>
                              )}
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>
          ))}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Floating Modern Input Bar */}
        <div className="px-4 pb-2 pt-2 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-20">
            <div className="bg-white p-1.5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 flex items-center gap-2">
                <button className="w-9 h-9 rounded-full bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100 transition-colors">
                    <ImageIcon size={18} />
                </button>
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} 
                  placeholder="Type a message..." 
                  className="flex-1 bg-transparent px-2 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none" 
                />
                <button 
                  onClick={handleSendMessage} 
                  disabled={!chatInput.trim()} 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-sm transition-all transform active:scale-90 ${chatInput.trim() ? 'bg-school-600 rotate-0' : 'bg-gray-200 -rotate-45'}`}
                >
                    <Send size={16} className={chatInput.trim() ? "ml-0.5" : ""} />
                </button>
            </div>
        </div>
        
        {/* Spacer for Bottom Nav */}
        <div className="h-[70px] bg-slate-50 flex-shrink-0"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header with Tabs */}
      <div className="bg-white px-4 pt-12 pb-0 border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="flex justify-between items-center mb-4">
             <h1 className="text-2xl font-bold text-gray-900">Community</h1>
             <Search className="text-gray-400" size={20} />
        </div>
        <div className="flex space-x-6">
            <button 
                onClick={() => setActiveTab('feed')}
                className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'feed' ? 'text-school-700' : 'text-gray-400'}`}
            >
                School Feed
                {activeTab === 'feed' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-school-600 rounded-t-full"></span>}
            </button>
            <button 
                onClick={() => setActiveTab('messages')}
                className={`pb-3 text-sm font-bold transition-colors relative ${activeTab === 'messages' ? 'text-school-700' : 'text-gray-400'}`}
            >
                Connect
                {activeTab === 'messages' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-school-600 rounded-t-full"></span>}
            </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        
        {/* FEED TAB */}
        {activeTab === 'feed' && (
            <div className="p-4 space-y-4">
                {/* Create Post Widget */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex gap-3">
                         <img src={currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${currentUser?.full_name}&background=random`} className="w-10 h-10 rounded-full bg-gray-100 object-cover" />
                         <div className="flex-1">
                             <textarea 
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder="What's happening in your world?" 
                                className="w-full text-sm resize-none outline-none text-gray-700 placeholder:text-gray-400 h-16 bg-transparent"
                             />
                             {newPostImage && (
                               <div className="relative inline-block mt-2">
                                  <img src={newPostImage} className="h-20 w-auto rounded-lg border border-gray-200" />
                                  <button onClick={() => setNewPostImage(null)} className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full p-0.5">
                                     <X size={12} />
                                  </button>
                               </div>
                             )}
                             <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                                 <div>
                                    <input 
                                      type="file" 
                                      ref={fileInputRef} 
                                      className="hidden" 
                                      accept="image/*"
                                      onChange={handleFileSelect}
                                    />
                                    <button 
                                      onClick={() => fileInputRef.current?.click()}
                                      className="text-school-600 p-2 hover:bg-school-50 rounded-full transition-colors"
                                    >
                                        <ImageIcon size={20} />
                                    </button>
                                 </div>
                                 <button 
                                    onClick={handlePostSubmit}
                                    disabled={(!newPostContent.trim() && !newPostImage) || posting}
                                    className="bg-school-600 text-white text-xs font-bold px-4 py-2 rounded-full disabled:opacity-50 flex items-center gap-2"
                                 >
                                    {posting ? <Loader2 size={12} className="animate-spin" /> : 'Post Update'}
                                 </button>
                             </div>
                         </div>
                    </div>
                </div>

                {/* Posts Feed */}
                {posts.map(post => (
                    <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Post Header */}
                        <div className="p-4 flex items-start gap-3">
                            <img src={post.profile?.avatar_url || `https://ui-avatars.com/api/?name=${post.profile?.full_name || 'User'}`} className="w-10 h-10 rounded-full object-cover border border-gray-100" />
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-sm text-gray-900">{post.profile?.full_name}</h3>
                                        <div className="mt-1">
                                            {post.profile?.year_of_completion && renderIdentity(post.profile.year_of_completion)}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Post Content */}
                        <div className="px-4 pb-2 text-sm text-gray-800 whitespace-pre-wrap">
                            {post.content}
                        </div>
                        
                        {post.image_url && (
                             <img src={post.image_url} className="w-full h-auto max-h-96 object-cover mt-2 bg-gray-100" />
                        )}

                        {/* Post Actions */}
                        <div className="px-4 py-3 border-t border-gray-50 flex items-center justify-between text-gray-500">
                            <button 
                              onClick={() => handleLike(post)} 
                              className={`flex items-center space-x-1.5 text-xs font-medium transition-colors ${post.liked_by_me ? 'text-red-500' : 'hover:text-gray-700'}`}
                            >
                                <Heart size={18} className={post.liked_by_me ? "fill-current" : ""} />
                                <span>{post.likes_count || 0}</span>
                            </button>
                            <button 
                              onClick={() => toggleComments(post.id)}
                              className={`flex items-center space-x-1.5 text-xs font-medium transition-colors ${expandedPostId === post.id ? 'text-school-600' : 'hover:text-gray-700'}`}
                            >
                                <MessageSquare size={18} />
                                <span>{post.comments_count || 0}</span>
                            </button>
                        </div>

                        {/* Comments Section */}
                        {expandedPostId === post.id && (
                          <div className="bg-gray-50 px-4 py-3 border-t border-gray-100">
                             {loadingComments ? (
                               <div className="flex justify-center py-2"><Loader2 size={16} className="animate-spin text-gray-400"/></div>
                             ) : (
                               <div className="space-y-3 mb-4">
                                  {comments.map(comment => (
                                      <div key={comment.id} className="flex gap-2">
                                          <img src={comment.profile?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profile?.full_name || 'U'}`} className="w-6 h-6 rounded-full" />
                                          <div className="flex-1 bg-white p-2 rounded-lg rounded-tl-none text-xs shadow-sm">
                                              <span className="font-bold block text-gray-900 mb-0.5">{comment.profile?.full_name}</span>
                                              <span className="text-gray-700">{comment.content}</span>
                                          </div>
                                      </div>
                                  ))}
                                  {comments.length === 0 && <p className="text-xs text-gray-400 text-center italic">No comments yet.</p>}
                               </div>
                             )}
                             
                             <div className="flex gap-2 items-center">
                                <img src={currentUser?.avatar_url || `https://ui-avatars.com/api/?name=${currentUser?.full_name}`} className="w-8 h-8 rounded-full" />
                                <div className="flex-1 relative">
                                    <input 
                                      type="text" 
                                      value={newCommentText}
                                      onChange={(e) => setNewCommentText(e.target.value)}
                                      onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post.id)}
                                      placeholder="Write a comment..." 
                                      className="w-full text-xs py-2 px-3 rounded-full border border-gray-300 focus:outline-none focus:border-school-500 pr-8"
                                    />
                                    <button 
                                      onClick={() => handlePostComment(post.id)}
                                      disabled={!newCommentText.trim()}
                                      className="absolute right-1 top-1 p-1 text-school-600 disabled:opacity-30"
                                    >
                                       <Send size={14} />
                                    </button>
                                </div>
                             </div>
                          </div>
                        )}
                    </div>
                ))}

                {posts.length === 0 && (
                     <div className="text-center py-10 text-gray-400 text-sm">
                         Be the first to post something!
                     </div>
                )}
            </div>
        )}

        {/* MESSAGES TAB LIST */}
        {activeTab === 'messages' && (
            <div className="pb-8">
                 {/* Quick Connect / Horizontal Scroll */}
                 <div className="pt-4 px-4">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Connect</h3>
                     <div className="flex space-x-4 overflow-x-auto no-scrollbar pb-2">
                        {profiles.slice(0, 5).map(profile => (
                             <div key={profile.id} onClick={() => setActiveChatUser(profile)} className="flex flex-col items-center flex-shrink-0 cursor-pointer">
                                 <div className="relative">
                                     <img 
                                        src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`} 
                                        className="w-14 h-14 rounded-full border-2 border-school-100 p-0.5" 
                                     />
                                     <div className="absolute bottom-1 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                                 </div>
                                 <span className="text-[10px] mt-1 font-medium text-gray-600 w-16 truncate text-center">{profile.full_name?.split(' ')[0]}</span>
                             </div>
                        ))}
                     </div>
                 </div>

                 <div className="mt-4 px-4 space-y-3">
                     <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">All Alumni</h3>
                     {profiles.map((profile) => (
                      <div 
                        key={profile.id} 
                        onClick={() => setActiveChatUser(profile)}
                        className="flex items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer active:scale-[0.99] transform duration-100"
                      >
                        <div className="relative">
                            <img 
                                src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=random`} 
                                alt={profile.full_name || 'User'} 
                                className="w-12 h-12 rounded-full object-cover bg-gray-50"
                            />
                        </div>
                        
                        <div className="ml-4 flex-1">
                          <div className="flex justify-between items-baseline">
                            <h3 className="text-sm font-bold text-gray-900">{profile.full_name}</h3>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                               {profile.year_of_completion && renderIdentity(profile.year_of_completion)}
                               {profile.job_title && (
                                   <span className="text-xs text-gray-500 truncate max-w-[120px]">• {profile.job_title}</span>
                               )}
                          </div>
                        </div>
                      </div>
                    ))}
                 </div>
            </div>
        )}

      </div>
    </div>
  );
};
