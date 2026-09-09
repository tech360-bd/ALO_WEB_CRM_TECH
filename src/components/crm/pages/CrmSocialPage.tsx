'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Share2, Search, Plus, Calendar, Heart, MessageCircle,
  Send, Clock, BarChart3, Users, Eye, TrendingUp,
  Facebook, Instagram, Linkedin, Music, ChevronLeft,
  ChevronRight, MoreHorizontal, Edit, Trash2, Copy,
  Globe, ImageIcon, FileText, Video, Link2, CheckCircle,
  AlertCircle, CalendarClock, ExternalLink, ThumbsUp,
} from 'lucide-react';

type Platform = 'facebook' | 'instagram' | 'linkedin' | 'tiktok';
type PostStatus = 'Published' | 'Scheduled' | 'Draft';

interface SocialPost {
  id: string;
  platform: Platform;
  content: string;
  postedDate: string;
  scheduledDate?: string;
  likes: number;
  comments: number;
  shares: number;
  status: PostStatus;
  mediaType: 'text' | 'image' | 'video' | 'link';
  reach: number;
}

interface AnalyticsData {
  platform: Platform;
  followers: number;
  engagementRate: number;
  totalReach: number;
  postsThisWeek: number;
  followerChange: number;
}

const platformIcons: Record<Platform, React.ElementType> = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
  tiktok: Music,
};

const platformColors: Record<Platform, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-r from-purple-600 to-pink-500',
  linkedin: 'bg-blue-700',
  tiktok: 'bg-black',
};

const platformBadgeColors: Record<Platform, string> = {
  facebook: 'bg-blue-100 text-blue-700',
  instagram: 'bg-pink-100 text-pink-700',
  linkedin: 'bg-blue-100 text-blue-800',
  tiktok: 'bg-gray-100 text-gray-800',
};

const analyticsData: AnalyticsData[] = [
  { platform: 'facebook', followers: 24850, engagementRate: 4.2, totalReach: 156300, postsThisWeek: 5, followerChange: 3.5 },
  { platform: 'instagram', followers: 18920, engagementRate: 5.8, totalReach: 98700, postsThisWeek: 7, followerChange: 5.2 },
  { platform: 'linkedin', followers: 12340, engagementRate: 3.1, totalReach: 45600, postsThisWeek: 3, followerChange: 2.1 },
  { platform: 'tiktok', followers: 32100, engagementRate: 7.4, totalReach: 234500, postsThisWeek: 4, followerChange: 8.3 },
];

const defaultPosts: SocialPost[] = [
  { id: 'POST-001', platform: 'facebook', content: '🎓 ALO Education is now accepting applications for January 2026 intake! Apply early and get exclusive scholarship opportunities. Visit our Dhaka office or apply online.', postedDate: '2025-06-27', likes: 342, comments: 56, shares: 23, status: 'Published', mediaType: 'image', reach: 12400 },
  { id: 'POST-002', platform: 'instagram', content: 'Campus tour of University of Edinburgh! Beautiful architecture meets world-class education. Swipe to see more photos. #StudyInUK #ALOEducation #Edinburgh', postedDate: '2025-06-27', likes: 891, comments: 134, shares: 67, status: 'Published', mediaType: 'image', reach: 23100 },
  { id: 'POST-003', platform: 'linkedin', content: 'We are proud to announce that 95% of our students received offers from their first-choice UK universities this year. This is a testament to our dedicated counselling team and personalized approach.', postedDate: '2025-06-26', likes: 156, comments: 23, shares: 45, status: 'Published', mediaType: 'text', reach: 8900 },
  { id: 'POST-004', platform: 'tiktok', content: 'Day in the life of a UK student 🇬🇧 From morning lectures to evening study sessions at the library. Follow for more study abroad tips! #UKStudentLife #StudyAbroad', postedDate: '2025-06-26', likes: 2340, comments: 189, shares: 345, status: 'Published', mediaType: 'video', reach: 67800 },
  { id: 'POST-005', platform: 'facebook', content: '🇬🇧 UK Visa Update: New streamlined processing for student visas from South Asian countries. Processing time reduced to 3 weeks for standard applications.', postedDate: '2025-06-25', likes: 567, comments: 89, shares: 123, status: 'Published', mediaType: 'text', reach: 18900 },
  { id: 'POST-006', platform: 'instagram', content: 'Scholarship alert! University of Manchester is offering merit-based scholarships for international students. Deadline: July 15, 2025. DM us for details.', postedDate: '2025-06-28', likes: 0, comments: 0, shares: 0, status: 'Scheduled', mediaType: 'image', reach: 0, scheduledDate: '2025-06-28T14:00:00' },
  { id: 'POST-007', platform: 'linkedin', content: 'ALO Education expands to Chittagong! Our new branch will serve students in the southern region with the same quality counselling services. Grand opening on July 10.', postedDate: '2025-06-29', likes: 0, comments: 0, shares: 0, status: 'Scheduled', mediaType: 'image', reach: 0, scheduledDate: '2025-06-29T10:00:00' },
  { id: 'POST-008', platform: 'tiktok', content: '3 tips for writing a winning personal statement for UK universities! Tip 1: Start with a story, Tip 2: Be specific about your goals, Tip 3: Show, don\'t tell.', postedDate: '', likes: 0, comments: 0, shares: 0, status: 'Draft', mediaType: 'video', reach: 0 },
  { id: 'POST-009', platform: 'instagram', content: 'Success story: Meet Arif, who went from ALO Education to studying Computer Science at Imperial College London with a full scholarship!', postedDate: '', likes: 0, comments: 0, shares: 0, status: 'Draft', mediaType: 'image', reach: 0 },
  { id: 'POST-010', platform: 'facebook', content: 'Free IELTS webinar this Saturday! Join our expert instructor for tips on achieving band 7+. Register at aloeducation.com/webinar', postedDate: '2025-06-24', likes: 234, comments: 45, shares: 78, status: 'Published', mediaType: 'link', reach: 15600 },
];

const calendarDays = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(2025, 5, i + 1);
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('en-US', { month: 'short' }),
    fullDate: date.toISOString().split('T')[0],
    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'short' }),
  };
});

const scheduledDates = ['2025-06-28', '2025-06-29', '2025-06-15', '2025-06-22', '2025-06-10'];

const statusColors: Record<PostStatus, string> = {
  Published: 'bg-green-100 text-green-700',
  Scheduled: 'bg-blue-100 text-blue-700',
  Draft: 'bg-gray-100 text-gray-600',
};

const statusIcons: Record<PostStatus, React.ElementType> = {
  Published: CheckCircle,
  Scheduled: CalendarClock,
  Draft: Edit,
};

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function CrmSocialPage() {
  const [activePlatform, setActivePlatform] = useState<Platform | 'all'>('all');
  const [posts, setPosts] = useState<SocialPost[]>(defaultPosts);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostPlatform, setNewPostPlatform] = useState<Platform>('facebook');
  const [newPostStatus, setNewPostStatus] = useState<PostStatus>('Draft');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  const totalFollowers = analyticsData.reduce((acc, a) => acc + a.followers, 0);
  const avgEngagement = (analyticsData.reduce((acc, a) => acc + a.engagementRate, 0) / analyticsData.length).toFixed(1);
  const totalReach = analyticsData.reduce((acc, a) => acc + a.totalReach, 0);
  const totalPostsWeek = analyticsData.reduce((acc, a) => acc + a.postsThisWeek, 0);

  const filteredPosts = posts.filter(p => {
    const platformMatch = activePlatform === 'all' ? true : p.platform === activePlatform;
    if (!platformMatch) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.content.toLowerCase().includes(q);
    }
    return true;
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    const newPost: SocialPost = {
      id: `POST-${String(Date.now()).slice(-6)}`,
      platform: newPostPlatform,
      content: newPostContent,
      postedDate: newPostStatus === 'Published' ? new Date().toISOString().split('T')[0] : '',
      likes: 0, comments: 0, shares: 0,
      status: newPostStatus,
      mediaType: 'text',
      reach: 0,
    };
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
    setNewPostContent('');
  };

  const handleDeletePost = (postId: string) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  const handleStatusChange = (postId: string, newStatus: PostStatus) => {
    setPosts(posts.map(p => p.id === postId ? { ...p, status: newStatus } : p));
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-600 rounded-lg">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Social Media</h1>
            <p className="text-sm text-gray-500">Manage your social media presence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              Calendar
            </button>
          </div>
          <Button size="sm" onClick={() => setShowCreatePost(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-1" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg"><Users className="h-4 w-4 text-blue-600" /></div>
              <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">+4.7%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{formatNumber(totalFollowers)}</p>
            <p className="text-xs text-gray-500">Total Followers</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-orange-100 rounded-lg"><TrendingUp className="h-4 w-4 text-orange-600" /></div>
              <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">+0.8%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{avgEngagement}%</p>
            <p className="text-xs text-gray-500">Engagement Rate</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-purple-100 rounded-lg"><Eye className="h-4 w-4 text-purple-600" /></div>
              <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">+12.3%</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{formatNumber(totalReach)}</p>
            <p className="text-xs text-gray-500">Total Reach</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-emerald-100 rounded-lg"><Calendar className="h-4 w-4 text-emerald-600" /></div>
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded">+2 posts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-3">{totalPostsWeek}</p>
            <p className="text-xs text-gray-500">Posts This Week</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform-specific analytics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {analyticsData.map(a => {
          const Icon = platformIcons[a.platform];
          return (
            <Card key={a.platform} className="shadow-sm">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-7 h-7 rounded ${platformColors[a.platform]} flex items-center justify-center`}>
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{a.platform}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Followers</p>
                    <p className="text-sm font-bold text-gray-900">{formatNumber(a.followers)}</p>
                    <p className="text-[10px] text-green-600">+{a.followerChange}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Engagement</p>
                    <p className="text-sm font-bold text-gray-900">{a.engagementRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Platform Tabs */}
      <Tabs value={activePlatform} onValueChange={v => setActivePlatform(v as Platform)}>
        <div className="flex items-center gap-3">
          <TabsList>
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="facebook" className="text-xs">Facebook</TabsTrigger>
            <TabsTrigger value="instagram" className="text-xs">Instagram</TabsTrigger>
            <TabsTrigger value="linkedin" className="text-xs">LinkedIn</TabsTrigger>
            <TabsTrigger value="tiktok" className="text-xs">TikTok</TabsTrigger>
          </TabsList>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="pl-9 h-8 text-xs"
            />
          </div>
        </div>

        {/* Table View */}
        {viewMode === 'table' && (
          <Card className="shadow-sm mt-3">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Platform</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Content</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">
                        <div className="flex items-center justify-center gap-1"><Heart className="h-3 w-3" />Likes</div>
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">
                        <div className="flex items-center justify-center gap-1"><MessageCircle className="h-3 w-3" />Comments</div>
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">
                        <div className="flex items-center justify-center gap-1"><Share2 className="h-3 w-3" />Shares</div>
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPosts.map(post => {
                      const PIcon = platformIcons[post.platform];
                      return (
                        <tr key={post.id} className="border-b hover:bg-gray-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded ${platformColors[post.platform]} flex items-center justify-center`}>
                                <PIcon className="h-3 w-3 text-white" />
                              </div>
                              <span className="text-xs capitalize text-gray-700">{post.platform}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm text-gray-800 max-w-xs truncate">{post.content}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {post.mediaType === 'image' && <ImageIcon className="h-2.5 w-2.5 mr-0.5" />}
                                {post.mediaType === 'video' && <Video className="h-2.5 w-2.5 mr-0.5" />}
                                {post.mediaType === 'link' && <Link2 className="h-2.5 w-2.5 mr-0.5" />}
                                {post.mediaType === 'text' && <FileText className="h-2.5 w-2.5 mr-0.5" />}
                                {post.mediaType}
                              </Badge>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500">
                            {post.postedDate || post.scheduledDate ? new Date(post.postedDate || post.scheduledDate || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{formatNumber(post.likes)}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{post.comments}</td>
                          <td className="px-4 py-3 text-center text-sm text-gray-700">{post.shares}</td>
                          <td className="px-4 py-3">
                            {(() => { const SIcon = statusIcons[post.status]; return (
                            <Badge className={`text-[10px] ${statusColors[post.status]}`}>
                              <SIcon className="h-3 w-3 mr-0.5" />
                              {post.status}
                            </Badge>
                            ); })()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStatusChange(post.id, post.status === 'Draft' ? 'Scheduled' : post.status === 'Scheduled' ? 'Published' : 'Published')}>
                                <Send className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeletePost(post.id)}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <Card className="shadow-sm mt-3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">June 2025 Schedule</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <div className="grid grid-cols-7 gap-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                ))}
                {calendarDays.map(day => {
                  const isScheduled = scheduledDates.includes(day.fullDate);
                  return (
                    <div
                      key={day.fullDate}
                      className={`p-1 min-h-[48px] rounded text-center text-xs ${isScheduled ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'} ${day.dayOfWeek === 'Sun' ? 'text-red-400' : 'text-gray-700'}`}
                    >
                      <span className="font-medium">{day.day}</span>
                      {isScheduled && (
                        <div className="mt-0.5">
                          <span className="bg-blue-600 text-white text-[8px] rounded px-1 py-0.5">Scheduled</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </Tabs>

      {/* Create Post Modal */}
      {showCreatePost && (
        <Card className="shadow-lg border-blue-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Create New Post</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCreatePost(false)}>Cancel</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['facebook', 'instagram', 'linkedin', 'tiktok'] as Platform[]).map(p => {
                const Icon = platformIcons[p];
                return (
                  <button
                    key={p}
                    onClick={() => setNewPostPlatform(p)}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${newPostPlatform === p ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className={`w-8 h-8 rounded ${platformColors[p]} flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-xs capitalize font-medium">{p}</span>
                  </button>
                );
              })}
            </div>
            <Textarea
              value={newPostContent}
              onChange={e => setNewPostContent(e.target.value)}
              placeholder="Write your post content..."
              rows={4}
              className="resize-y"
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">Status:</span>
                <select
                  value={newPostStatus}
                  onChange={e => setNewPostStatus(e.target.value as PostStatus)}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Published">Publish Now</option>
                </select>
              </div>
              <div className="flex gap-1 ml-auto">
                <Button variant="ghost" size="sm" className="text-gray-500"><ImageIcon className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-gray-500"><Video className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" className="text-gray-500"><Link2 className="h-4 w-4" /></Button>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreatePost(false)}>Cancel</Button>
              <Button onClick={handleCreatePost} className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4 mr-1" />
                {newPostStatus === 'Published' ? 'Publish' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
