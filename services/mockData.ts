
import { SchoolEvent, Profile, FeedComment } from '../types';

export const MOCK_EVENTS: SchoolEvent[] = [
  {
    id: '1',
    title: 'Annual Alumni Dinner 2024',
    description: 'Join us for a night of networking and reminiscence at the Sheraton Hotel. Keynote speaker: Dr. Paul Ssemogerere.',
    event_date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
    location: 'Sheraton Kampala Hotel',
    audience: 'alumni',
    created_by: 'admin'
  },
  {
    id: '2',
    title: 'Inter-House Sports Gala',
    description: 'Come support your former house! Kizito vs Lwanga finals.',
    event_date: new Date(Date.now() + 86400000 * 12).toISOString(),
    location: 'School Main Pitch',
    audience: 'all',
    created_by: 'admin'
  },
  {
    id: '3',
    title: 'Career Guidance Day',
    description: 'We need alumni volunteers to speak to S.6 candidates about career choices.',
    event_date: new Date(Date.now() + 86400000 * 20).toISOString(),
    location: 'Main Hall',
    audience: 'alumni',
    created_by: 'admin'
  }
];

export const MOCK_PROFILES: Profile[] = [
  {
    id: '101',
    email: 'john.doe@example.com',
    full_name: 'John Doe',
    role: 'alumni',
    avatar_url: 'https://picsum.photos/200',
    year_of_completion: 2015,
    current_profession: 'Tech',
    job_title: 'Software Engineer',
    bio: 'Passionate about building scalable systems and hiking on weekends.',
    location: 'Kampala, Uganda',
    linked_in_url: null,
    is_public_profile: true
  },
  {
    id: '102',
    email: 'jane.smith@example.com',
    full_name: 'Jane Smith',
    role: 'alumni',
    avatar_url: 'https://picsum.photos/201',
    year_of_completion: 2018,
    current_profession: 'Health',
    job_title: 'Medical Doctor',
    bio: 'Dedicated to public health initiatives.',
    location: 'Nairobi, Kenya',
    linked_in_url: null,
    is_public_profile: true
  }
];

export const MOCK_COMMENTS: FeedComment[] = [
    {
        id: 'c1',
        post_id: 'p1',
        user_id: '102',
        content: 'This is amazing! Congratulations.',
        created_at: new Date().toISOString(),
        profile: MOCK_PROFILES[1]
    }
];
