import React, { useState } from 'react';
import { Profile as ProfileType } from '../types';
import { supabase } from '../supabaseClient';
import { LogOut, MapPin, Briefcase, Linkedin, Settings, Edit2, Save, X, Camera, User } from 'lucide-react';
import { getClassIdentity } from '../services/classIdentity';

interface ProfileProps {
  userProfile: ProfileType | null;
}

export const Profile: React.FC<ProfileProps> = ({ userProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileType>>({});

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const startEditing = () => {
    if (userProfile) {
      setFormData({
        full_name: userProfile.full_name,
        current_profession: userProfile.current_profession,
        job_title: userProfile.job_title,
        bio: userProfile.bio,
        location: userProfile.location,
        year_of_completion: userProfile.year_of_completion,
        linked_in_url: userProfile.linked_in_url,
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;
    setLoading(true);
    
    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', userProfile.id);

    setLoading(false);
    if (error) {
      alert('Error updating profile');
    } else {
      setIsEditing(false);
      window.location.reload(); 
    }
  };

  if (!userProfile) return null;

  const classIdentity = getClassIdentity(userProfile.year_of_completion);

  return (
    <div className="h-full bg-slate-50 overflow-y-auto no-scrollbar pb-24">
      {/* Header Background */}
      <div className="h-48 bg-school-800 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
        <button 
          onClick={handleSignOut}
          className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/30 z-20"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* Profile Card */}
      <div className="px-4 -mt-16 relative z-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
          <div className="relative -mt-16 mb-4 group">
            <img 
              src={userProfile.avatar_url || `https://ui-avatars.com/api/?name=${formData.full_name || userProfile.full_name}&background=random`}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-white shadow-md object-cover"
            />
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer">
                <Camera className="text-white" size={24} />
              </div>
            )}
          </div>
          
          {isEditing ? (
            <div className="w-full space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                <input 
                  type="text" 
                  value={formData.full_name || ''} 
                  onChange={e => setFormData({...formData, full_name: e.target.value})}
                  className="w-full border-b border-gray-300 py-1 text-center font-bold text-lg focus:outline-none focus:border-school-500 bg-transparent"
                />
              </div>
              
              <div className="flex gap-2">
                 <div className="flex-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Class Of</label>
                    <input 
                      type="number" 
                      value={formData.year_of_completion || ''} 
                      onChange={e => setFormData({...formData, year_of_completion: parseInt(e.target.value)})}
                      className="w-full border-b border-gray-300 py-1 text-center text-sm focus:outline-none focus:border-school-500 bg-transparent"
                    />
                 </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Current Job Title</label>
                  <input 
                    type="text" 
                    value={formData.job_title || ''} 
                    onChange={e => setFormData({...formData, job_title: e.target.value})}
                    placeholder="e.g. Senior Manager"
                    className="w-full border-b border-gray-300 py-1 text-sm focus:outline-none focus:border-school-500 bg-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Industry</label>
                  <input 
                    type="text" 
                    value={formData.current_profession || ''} 
                    onChange={e => setFormData({...formData, current_profession: e.target.value})}
                    placeholder="e.g. Tech"
                    className="w-full border-b border-gray-300 py-1 text-sm focus:outline-none focus:border-school-500 bg-transparent"
                  />
                </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Bio</label>
                 <textarea
                  value={formData.bio || ''} 
                  onChange={e => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell us a bit about yourself..."
                  className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-school-500 bg-transparent h-24 resize-none mt-1"
                />
              </div>

              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Location</label>
                 <input 
                  type="text" 
                  value={formData.location || ''} 
                  onChange={e => setFormData({...formData, location: e.target.value})}
                  className="w-full border-b border-gray-300 py-1 text-sm focus:outline-none focus:border-school-500 bg-transparent"
                />
              </div>

               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">LinkedIn URL</label>
                 <input 
                  type="text" 
                  value={formData.linked_in_url || ''} 
                  onChange={e => setFormData({...formData, linked_in_url: e.target.value})}
                  className="w-full border-b border-gray-300 py-1 text-sm focus:outline-none focus:border-school-500 bg-transparent text-blue-600"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium text-sm flex items-center justify-center gap-2"
                >
                  <X size={16} /> Cancel
                </button>
                <button 
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 py-2 rounded-lg bg-school-600 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-school-600/20"
                >
                  {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-900 text-center">{userProfile.full_name}</h2>
              
              <div className={`mt-3 px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm border border-gray-100 ${classIdentity.bg} ${classIdentity.color}`}>
                 <img src={classIdentity.badgeUrl} className="w-8 h-8 rounded-md" alt="Class Badge" />
                 <div className="flex flex-col text-left">
                     <span className="text-[10px] uppercase font-bold tracking-wider opacity-70 leading-none">Class of {userProfile.year_of_completion}</span>
                     <span className="text-base font-bold leading-none">{classIdentity.name}</span>
                 </div>
              </div>
              
              {userProfile.bio && (
                 <div className="mt-5 text-center text-sm text-gray-600 leading-relaxed max-w-xs italic relative">
                    <span className="text-4xl text-gray-200 absolute -top-3 -left-2 font-serif">"</span>
                    {userProfile.bio}
                    <span className="text-4xl text-gray-200 absolute -bottom-6 -right-2 font-serif">"</span>
                 </div>
              )}

              <div className="w-full mt-8 space-y-4">
                <div className="flex items-center text-gray-600 text-sm">
                  <Briefcase size={18} className="mr-3 text-gray-400" />
                  <div className="flex flex-col">
                      <span className="font-medium text-gray-900">{userProfile.job_title || 'Alumni'}</span>
                      {userProfile.current_profession && (
                          <span className="text-xs text-gray-500">{userProfile.current_profession}</span>
                      )}
                  </div>
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin size={18} className="mr-3 text-gray-400" />
                  <span>{userProfile.location || 'Location not set'}</span>
                </div>
                {userProfile.linked_in_url && (
                  <div className="flex items-center text-blue-600 text-sm">
                    <Linkedin size={18} className="mr-3" />
                    <a href={userProfile.linked_in_url} target="_blank" rel="noreferrer" className="hover:underline truncate max-w-[200px]">
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {!isEditing && (
        <div className="px-4 mt-4 space-y-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
             <button 
                onClick={startEditing}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
             >
                  <div className="flex items-center text-gray-700 font-medium">
                      <Edit2 size={18} className="mr-3 text-gray-400" /> Edit Profile
                  </div>
              </button>
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-t border-gray-50">
                  <div className="flex items-center text-gray-700 font-medium">
                      <Settings size={18} className="mr-3 text-gray-400" /> Settings
                  </div>
              </button>
          </div>
        </div>
      )}
    </div>
  );
};