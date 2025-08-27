import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Star,
  MessageCircle,
  TrendingUp,
  Calendar,
  User,
  MapPin,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  Search,
  Filter,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Award,
  BarChart3,
  FileText
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { BACKEND_URL } from '@/constant/Global';

const InspectorFeedback = () => {
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    rating: 'all',
    dateFrom: '',
    dateTo: '',
    status: 'all'
  });
  const [stats, setStats] = useState({
    averageRating: 0,
    totalFeedbacks: 0,
    positiveRatings: 0,
    recentRatings: 0
  });

  // Rating configurations
  const ratingConfig = {
    5: { color: 'bg-green-100 text-green-800', label: 'Excellent', icon: Award },
    4: { color: 'bg-blue-100 text-blue-800', label: 'Very Good', icon: ThumbsUp },
    3: { color: 'bg-yellow-100 text-yellow-800', label: 'Good', icon: Star },
    2: { color: 'bg-orange-100 text-orange-800', label: 'Fair', icon: AlertTriangle },
    1: { color: 'bg-red-100 text-red-800', label: 'Poor', icon: ThumbsDown }
  };
  // Fetch job requests with feedback data
  const fetchFeedbacks = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login to view feedback');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/v1/job-requests`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: 'closed',
          role: 'inspector'
        }
      });

      const jobs = response.data.data.jobRequests || [];
      setJobRequests(jobs);
      
      // Filter jobs that have client ratings
      const jobsWithRatings = jobs.filter(job => job.clientRating && job.clientRating.rating);
      
      // Calculate stats
      const totalFeedbacks = jobsWithRatings.length;
      const averageRating = totalFeedbacks > 0 
        ? jobsWithRatings.reduce((sum, job) => sum + job.clientRating.rating, 0) / totalFeedbacks 
        : 0;
      const positiveRatings = jobsWithRatings.filter(job => job.clientRating.rating >= 4).length;
      
      // Calculate recent ratings (last 30 days)
      const recentRatings = jobsWithRatings.filter(job => 
        new Date(job.clientRating.submittedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length;

      setStats({
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalFeedbacks,
        positiveRatings,
        recentRatings
      });
    } catch (error) {
      console.error('Error fetching feedback:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
      } else {
        toast.error('Failed to fetch feedback');
      }
    }
  }, []);
  // Fetch all data
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await fetchFeedbacks();
    setLoading(false);
  }, [fetchFeedbacks]);

  // Refresh data
  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    toast.success('Data refreshed successfully');
  };

  // Filter job requests that have client ratings
  const filteredFeedbacks = jobRequests
    .filter(job => job.clientRating && job.clientRating.rating) // Only jobs with ratings
    .filter(job => {
    const feedback = job.clientRating;
    const jobTitle = job.title || 'Inspection Request';
    const clientName = job.clientName || 'Unknown Client';
    const comment = feedback.review || '';

    const matchesSearch = !filters.search || 
      jobTitle.toLowerCase().includes(filters.search.toLowerCase()) ||
      clientName.toLowerCase().includes(filters.search.toLowerCase()) ||
      comment.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesRating = filters.rating === 'all' || feedback.rating.toString() === filters.rating;
    
    return matchesSearch && matchesRating;
  });

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render star rating
  const renderStars = (rating, size = 'h-4 w-4') => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`${size} ${
          index < rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="h-8 w-8 text-[#004aad]" />
              Inspector Feedback
            </h1>
            <p className="text-gray-600 mt-1">View feedback and ratings from your clients</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={refreshData}
              disabled={refreshing}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004aad]"></div>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Average Rating</p>
                    <div className="text-2xl font-bold flex items-center gap-2">
                      {stats.averageRating.toFixed(1)}
                      <Star className="h-6 w-6 text-yellow-300 fill-yellow-300" />
                    </div>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-100" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Feedback</p>
                    <div className="text-2xl font-bold">{stats.totalFeedbacks}</div>
                  </div>
                  <MessageCircle className="h-8 w-8 text-green-100" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm font-medium">Positive Ratings</p>
                    <div className="text-2xl font-bold">{stats.positiveRatings}</div>
                  </div>
                  <ThumbsUp className="h-8 w-8 text-yellow-100" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Recent (30 days)</p>
                    <div className="text-2xl font-bold">{stats.recentRatings}</div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-100" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="feedback" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="feedback" className="data-[state=active]:bg-[#004aad] data-[state=active]:text-white data-[state=active]:shadow-sm">Client Feedback</TabsTrigger>
              <TabsTrigger value="jobs" className="data-[state=active]:bg-[#004aad] data-[state=active]:text-white data-[state=active]:shadow-sm">Completed Jobs</TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-[#004aad] data-[state=active]:text-white data-[state=active]:shadow-sm">Performance Analytics</TabsTrigger>
            </TabsList>

            {/* Feedback Tab */}
            <TabsContent value="feedback">
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Client Feedback & Ratings</CardTitle>
                      <CardDescription>Reviews and ratings from clients after inspection completion</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search feedback..."
                          value={filters.search}
                          onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Select
                        value={filters.rating}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, rating: value }))}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Ratings</SelectItem>
                          <SelectItem value="5">5 Stars</SelectItem>
                          <SelectItem value="4">4 Stars</SelectItem>
                          <SelectItem value="3">3 Stars</SelectItem>
                          <SelectItem value="2">2 Stars</SelectItem>
                          <SelectItem value="1">1 Star</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FeedbackList 
                    feedbacks={filteredFeedbacks}
                    ratingConfig={ratingConfig}
                    formatDate={formatDate}
                    renderStars={renderStars}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Completed Jobs Tab */}
            <TabsContent value="jobs">
              <Card>
                <CardHeader>
                  <CardTitle>Completed Inspections</CardTitle>
                  <CardDescription>All your completed inspections and their feedback status</CardDescription>
                </CardHeader>
                <CardContent>                  <CompletedJobsList 
                    jobs={jobRequests}
                    formatDate={formatDate}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">              <FeedbackAnalytics 
                feedbacks={filteredFeedbacks}
                stats={stats}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

// Feedback List Component
const FeedbackList = ({ feedbacks, ratingConfig, formatDate, renderStars }) => {
  if (feedbacks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No feedback received yet</p>
        <p className="text-sm mt-1">Client feedback will appear here after job completion</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedbacks.map((job, index) => {
        const feedback = job.clientRating;
        const jobTitle = job.title || 'Inspection Request';
        const clientName = job.clientName || 'Unknown Client';
        const RatingIcon = ratingConfig[feedback.rating]?.icon || Star;
        
        return (
          <Card key={job._id || index} className="border-l-4 border-l-[#004aad]">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <ShieldCheck className="h-4 w-4 text-[#004aad]" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{jobTitle}</h3>
                      <p className="text-sm text-gray-500">Job ID: {job._id?.slice(-8)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {clientName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(feedback.submittedAt)}
                    </span>
                  </div>
                  
                  {feedback.review && (
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-sm italic">"{feedback.review}"</p>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Badge className={ratingConfig[feedback.rating]?.color}>
                    <RatingIcon className="h-3 w-3 mr-1" />
                    {feedback.rating}/5
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    {renderStars(feedback.rating)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Completed Jobs List Component
const CompletedJobsList = ({ jobs, formatDate }) => {
  // Filter only completed jobs
  const completedJobs = jobs.filter(job => job.status === 'closed' || job.status === 'completed');
  
  if (completedJobs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CheckCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No completed inspections found</p>
        <p className="text-sm mt-1">Completed inspections will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {completedJobs.map((job, index) => {
        const hasFeedback = job.clientRating && job.clientRating.rating;
        const jobTitle = job.title || 'Inspection Request';
        const clientName = job.clientName || 'Unknown Client';
        const location = job.location || 'Location not specified';
        
        return (
          <Card key={job._id || index} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#004aad]" />
                    {jobTitle}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">{job.description || 'Inspection request'}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {clientName}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(job.updatedAt)}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                  
                  {hasFeedback ? (
                    <div className="flex flex-col gap-1">
                      <Badge className="bg-blue-100 text-[#004aad]">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Feedback Received
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium">{job.clientRating.rating}/5</span>
                      </div>
                    </div>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-800">
                      <Clock className="h-3 w-3 mr-1" />
                      No Feedback Yet
                    </Badge>
                  )}
                </div>
              </div>
              
              <Separator className="my-3" />
              
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Status: <strong>Inspection Complete</strong>
                </div>
                
                {/* <Button size="sm" variant="outline">
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button> */}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Feedback Analytics Component
const FeedbackAnalytics = ({ feedbacks, stats }) => {
  // Calculate rating distribution
  const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
    const rating = 5 - i;
    const count = feedbacks.filter(job => job.clientRating?.rating === rating).length;
    const percentage = feedbacks.length > 0 ? ((count / feedbacks.length) * 100).toFixed(1) : 0;
    return { rating, count, percentage };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Rating Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {ratingDistribution.map(({ rating, count, percentage }) => (
            <div key={rating} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium">{rating}</span>
                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="w-20 text-sm text-gray-600 text-right">
                {count} ({percentage}%)
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Average Rating:</span>
            <span className="font-semibold flex items-center gap-1">
              {stats.averageRating}
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Reviews:</span>
            <span className="font-semibold">{stats.totalFeedbacks}</span>
          </div>
          <div className="flex justify-between">
            <span>Positive Reviews (4-5★):</span>
            <span className="font-semibold text-green-600">{stats.positiveRatings}</span>
          </div>
          <div className="flex justify-between">
            <span>Satisfaction Rate:</span>
            <span className="font-semibold text-blue-600">
              {stats.totalFeedbacks > 0 ? ((stats.positiveRatings / stats.totalFeedbacks) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Recent Feedback (30d):</span>
            <span className="font-semibold">{stats.recentRatings}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InspectorFeedback;
