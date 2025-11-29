
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'teacher' | 'student' | 'parent' | 'alumni';
  avatar_url: string | null;
  year_of_completion: number | null;
  current_profession: string | null; // e.g. "Engineering" (Industry)
  job_title: string | null; // e.g. "Senior Backend Developer" (Specific Role)
  bio: string | null;
  location: string | null;
  linked_in_url: string | null;
  is_public_profile: boolean;
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string; // ISO timestamp
  location: string | null;
  audience: 'all' | 'students' | 'alumni' | 'staff';
  created_by: string | null;
}

export interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_me?: boolean; // Computed on frontend
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'event' | 'message' | 'system';
}

export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  image_url?: string;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: Profile; // Joined data
  liked_by_me?: boolean; // Computed
}

export interface FeedComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: Profile;
}

export type ViewState = 'AUTH' | 'HOME' | 'EVENTS' | 'CHAT' | 'PROFILE';
