import React from 'react';
import { SchoolEvent } from '../types';
import { MapPin, CalendarClock, ChevronRight } from 'lucide-react';

interface EventCardProps {
  event: SchoolEvent;
  onClick?: () => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const date = new Date(event.event_date);
  const month = date.toLocaleString('default', { month: 'short' }).toUpperCase();
  const day = date.getDate();
  const time = date.toLocaleTimeString('default', { hour: '2-digit', minute: '2-digit' });

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-3 flex items-start active:scale-[0.98] transition-transform duration-100 cursor-pointer"
    >
      {/* Date Box */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 bg-school-50 rounded-lg border border-school-100 mr-4">
        <span className="text-xs font-bold text-school-600">{month}</span>
        <span className="text-xl font-bold text-gray-800">{day}</span>
      </div>

      {/* Content */}
      <div className="flex-grow">
        <h3 className="text-base font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">
          {event.title}
        </h3>
        
        <div className="flex items-center text-gray-500 text-xs mb-1">
          <CalendarClock size={12} className="mr-1" />
          <span>{time}</span>
        </div>
        
        {event.location && (
          <div className="flex items-center text-gray-500 text-xs">
            <MapPin size={12} className="mr-1" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
        )}
      </div>

      {/* Action Arrow */}
      <div className="flex-shrink-0 self-center text-gray-300">
        <ChevronRight size={20} />
      </div>
    </div>
  );
};