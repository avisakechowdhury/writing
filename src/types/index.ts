export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatar?: string;
  streak: number;
  points: number;
  level: number;
  totalPosts: number;
  joinedDate: Date;
  preferences: {
    isAnonymous: boolean;
    reminderTime?: string;
    notifications: boolean;
  };
}

export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  isAnonymous: boolean;
  createdAt: Date;
  updatedAt: Date;
  likes: number;
  likedBy: string[];
  comments: Comment[];
  tags: string[];
  mood?: string;
  wordCount: number;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  likes: number;
  likedBy: string[];
  reactions: Reaction[];
}

export interface Reaction {
  id: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirements: {
    type: 'streak' | 'posts' | 'likes' | 'comments';
    value: number;
  };
  reward: {
    points: number;
    badge?: string;
  };
}

export interface UserStats {
  totalPosts: number;
  currentStreak: number;
  longestStreak: number;
  totalLikes: number;
  totalComments: number;
  averageWordCount: number;
  postsThisWeek: number;
  postsThisMonth: number;
}