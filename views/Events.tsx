import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { SchoolEvent, Profile } from '../types';
import { EventCard } from '../components/EventCard';
import { MOCK_EVENTS } from '../services/mockData';
import { Search, Filter, Plus, Trash2, X, Calendar as CalendarIcon, MapPin, Loader2 } from 'lucide-react';

interface EventsProps {
  userProfile: Profile | null;
}

export const Events: React.FC<EventsProps> = ({ userProfile }) => {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    audience: 'all'
  });
  const [submitting, setSubmitting] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('school_events')
      .select('*')
      .order('event_date', { ascending: true });

    if (!error && data && data.length > 0) {
      setEvents(data as SchoolEvent[]);
    } else {
      // Fallback only if no data at all (first load usually)
      if (events.length === 0) setEvents(MOCK_EVENTS);
    }
    setLoading(false);
  };

  const handleCreateEvent = async () => {
    if (!newEvent.title || !newEvent.event_date || !newEvent.event_time) return;
    setSubmitting(true);

    // Combine date and time
    const fullDate = new Date(`${newEvent.event_date}T${newEvent.event_time}`).toISOString();

    const payload = {
      title: newEvent.title,
      description: newEvent.description,
      event_date: fullDate,
      location: newEvent.location,
      audience: newEvent.audience,
      created_by: userProfile?.id
    };

    const { error } = await supabase.from('school_events').insert(payload);

    setSubmitting(false);
    if (error) {
      alert('Failed to create event: ' + error.message);
    } else {
      setShowModal(false);
      setNewEvent({ title: '', description: '', event_date: '', event_time: '', location: '', audience: 'all' });
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAdmin) return;
    if (confirm('Are you sure you want to delete this event?')) {
        const { error } = await supabase.from('school_events').delete().eq('id', id);
        if (!error) {
            setEvents(events.filter(ev => ev.id !== id));
        }
    }
  };

  const filteredEvents = events.filter(e => {
    const isPast = new Date(e.event_date) < new Date();
    if (filter === 'upcoming') return !isPast;
    if (filter === 'past') return isPast;
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-slate-50 relative">
      {/* Header */}
      <div className="bg-white px-4 pt-12 pb-4 border-b border-gray-200 sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
             <h1 className="text-2xl font-bold text-gray-900">Events</h1>
             {isAdmin && (
               <button 
                 onClick={() => setShowModal(true)}
                 className="bg-school-600 text-white p-2 rounded-lg hover:bg-school-700 shadow-lg shadow-school-600/30 transition-transform active:scale-90"
               >
                 <Plus size={20} />
               </button>
             )}
        </div>
        
        {/* Search & Filter Bar */}
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search events..." 
              className="w-full bg-gray-100 text-sm py-2 pl-9 pr-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-school-500/50 transition-all"
            />
          </div>
          <button className="p-2 bg-gray-100 rounded-lg text-gray-600">
            <Filter size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mt-4 space-x-4 border-b border-gray-100">
          <button 
            onClick={() => setFilter('upcoming')}
            className={`pb-2 text-sm font-medium transition-colors relative ${filter === 'upcoming' ? 'text-school-700' : 'text-gray-500'}`}
          >
            Upcoming
            {filter === 'upcoming' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-school-600 rounded-t-full"></span>}
          </button>
          <button 
            onClick={() => setFilter('past')}
            className={`pb-2 text-sm font-medium transition-colors relative ${filter === 'past' ? 'text-school-700' : 'text-gray-500'}`}
          >
            Past Events
            {filter === 'past' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-school-600 rounded-t-full"></span>}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 pb-24 no-scrollbar">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-48 space-y-3">
             <div className="w-8 h-8 border-4 border-school-200 border-t-school-600 rounded-full animate-spin"></div>
             <p className="text-gray-400 text-sm">Loading events...</p>
           </div>
        ) : (
          <>
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <div key={event.id} className="relative group">
                    <EventCard event={event} />
                    {isAdmin && (
                        <button 
                            onClick={(e) => handleDeleteEvent(event.id, e)}
                            className="absolute top-2 right-2 p-2 bg-red-100 text-red-600 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-gray-400">
                <p>No events found.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Create New Event</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Event Title</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-school-500 outline-none"
                  placeholder="e.g. Annual Charity Run"
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Date</label>
                  <div className="relative">
                    <CalendarIcon size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input 
                      type="date" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 text-sm focus:ring-2 focus:ring-school-500 outline-none"
                      value={newEvent.event_date}
                      onChange={e => setNewEvent({...newEvent, event_date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Time</label>
                  <input 
                    type="time" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-school-500 outline-none"
                    value={newEvent.event_time}
                    onChange={e => setNewEvent({...newEvent, event_time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Location</label>
                <div className="relative">
                   <MapPin size={16} className="absolute left-3 top-3 text-gray-400" />
                   <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pl-10 text-sm focus:ring-2 focus:ring-school-500 outline-none"
                    placeholder="e.g. Main Hall"
                    value={newEvent.location}
                    onChange={e => setNewEvent({...newEvent, location: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Audience</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-school-500 outline-none appearance-none"
                  value={newEvent.audience}
                  onChange={e => setNewEvent({...newEvent, audience: e.target.value})}
                >
                  <option value="all">Everyone</option>
                  <option value="alumni">Alumni Only</option>
                  <option value="students">Students Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                <textarea 
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-school-500 outline-none resize-none"
                  placeholder="Details about the event..."
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                />
              </div>

              <button 
                onClick={handleCreateEvent}
                disabled={submitting}
                className="w-full bg-school-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-school-600/30 flex justify-center items-center"
              >
                {submitting ? <Loader2 className="animate-spin" /> : 'Create Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
