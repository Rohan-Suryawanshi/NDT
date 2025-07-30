import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Mail,
  Building,
  FileText,
  Filter,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  MessageSquare,
  Quote,
  Star,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  Paperclip,
  Tag,
  CalendarDays,
  User,
  Award,
  Loader2,
  RefreshCw,
  Settings,
  ExternalLink,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { BACKEND_URL } from '@/constant/Global';
import { useAuth } from '@/hooks/useAuth';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const REGIONS = [
  'North India', 'South India', 'East India', 'West India', 'Central India', 'Northeast India'
];

const MAJOR_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800 border-gray-200' }, // Created but not submitted
  { value: 'open', label: 'Open', color: 'bg-green-100 text-green-800 border-green-200' }, // Submitted and waiting for provider response
  { value: 'quoted', label: 'Quoted', color: 'bg-blue-100 text-blue-800 border-blue-200' }, // Provider has provided quotation
  { value: 'negotiating', label: 'Negotiating', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }, // In negotiation phase
  { value: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800 border-green-200' }, // Quote accepted, work can begin
  { value: 'in_progress', label: 'In Progress', color: 'bg-orange-100 text-orange-800 border-orange-200' }, // Work is ongoing
  { value: 'completed', label: 'Completed', color: 'bg-purple-100 text-purple-800 border-purple-200' }, // Work completed
  { value: 'delivered', label: 'Delivered', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' }, // Report/results delivered
  { value: 'closed', label: 'Closed', color: 'bg-green-100 text-green-800 border-green-200' }, // Job closed successfully
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800 border-red-200' }, // Cancelled by client
  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' }, // Rejected by provider
  { value: 'disputed', label: 'Disputed', color: 'bg-pink-100 text-pink-800 border-pink-200' }, // In dispute
  { value: 'on_hold', label: 'On Hold', color: 'bg-gray-100 text-gray-800 border-gray-200' } // Temporarily on hold
];

const NOTE_TYPES = [
  { value: 'general', label: 'General', icon: MessageSquare },
  { value: 'technical', label: 'Technical', icon: Settings },
  { value: 'commercial', label: 'Commercial', icon: DollarSign },
  { value: 'logistics', label: 'Logistics', icon: MapPin }
];

const ATTACHMENT_CATEGORIES = [
  { value: 'specification', label: 'Specification' },
  { value: 'drawing', label: 'Drawing' },
  { value: 'report', label: 'Report' },
  { value: 'certificate', label: 'Certificate' },
  { value: 'photo', label: 'Photo' },
  { value: 'other', label: 'Other' }
];

const JobRequestsDashboard = () => {
  const { user } = useAuth();
  const [jobRequests, setJobRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    region: 'all',
    location: 'all',
    isPremium: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 12,
    totalPages: 1,
    totalJobs: 0
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [expandedCostBreakdown, setExpandedCostBreakdown] = useState({});
  
  // Form states
  const [quotationForm, setQuotationForm] = useState({
    amount: '',
    currency: 'USD',
    validUntil: '',
    description: '',
    terms: '',
    breakdownItems: []
  });
  const [noteForm, setNoteForm] = useState({
    content: '',
    type: 'general',
    isInternal: false
  });
  const [attachmentForm, setAttachmentForm] = useState({
    files: [],
    category: 'other',
    description: ''
  });
  // Fetch job requests
  const fetchJobRequests = useCallback(async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem('accessToken');
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.pageSize,
        search: searchTerm,
        ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== 'all' && v !== ''))
      });

      const response = await axios.get(
        `${BACKEND_URL}/api/v1/job-requests?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.success) {
        setJobRequests(response.data.data.jobRequests || []);
        setPagination(prev => ({
          ...prev,
          ...response.data.data.pagination
        }));
      }
    } catch (error) {
      console.error('Error fetching job requests:', error);
      toast.error('Failed to fetch job requests');
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.pageSize, searchTerm, filters]);
  useEffect(() => {
    fetchJobRequests();
  }, [fetchJobRequests]);

  // Get status configuration
  const getStatusConfig = (status) => {
    return STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Handle job actions
  const handleViewDetails = async (jobId) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axios.get(
        `${BACKEND_URL}/api/v1/job-requests/${jobId}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      
      if (response.data.success) {
        setSelectedJob(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to fetch job details');
    }
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axios.patch(
        `${BACKEND_URL}/api/v1/job-requests/${jobId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.success) {
        toast.success('Status updated successfully');
        fetchJobRequests();
        if (selectedJob && selectedJob._id === jobId) {
          setSelectedJob(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  // Quotation functions
  const handleAddQuotation = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/quotations`,
        quotationForm,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.success) {
        toast.success('Quotation added successfully');
        setShowQuotationModal(false);
        setQuotationForm({
          amount: '',
          currency: 'USD',
          validUntil: '',
          description: '',
          terms: '',
          breakdownItems: []
        });
        fetchJobRequests();
        handleViewDetails(selectedJob._id);
      }
    } catch (error) {
      console.error('Error adding quotation:', error);
      toast.error(error.response?.data?.message || 'Failed to add quotation');
    }
  };

  // Notes functions
  const handleAddNote = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await axios.post(
        `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/notes`,
        noteForm,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      if (response.data.success) {
        toast.success('Note added successfully');
        setShowNotesModal(false);
        setNoteForm({ content: '', type: 'general', isInternal: false });
        handleViewDetails(selectedJob._id);
      }
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error(error.response?.data?.message || 'Failed to add note');
    }
  };

  // Attachment functions
  const handleAddAttachment = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const formData = new FormData();
      
      attachmentForm.files.forEach(file => {
        formData.append('attachment', file);
      });
      formData.append('category', attachmentForm.category);
      formData.append('description', attachmentForm.description);

      const response = await axios.post(
        `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/attachments`,
        formData,
        { 
          headers: { 
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'multipart/form-data'
          } 
        }
      );

      if (response.data.success) {
        toast.success('Attachments uploaded successfully');
        setShowAttachmentModal(false);
        setAttachmentForm({ files: [], category: 'other', description: '' });
        handleViewDetails(selectedJob._id);
      }
    } catch (error) {
      console.error('Error uploading attachments:', error);
      toast.error(error.response?.data?.message || 'Failed to upload attachments');
    }
  };

  // Filter functions
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const toggleCostBreakdown = (jobId) => {
    setExpandedCostBreakdown(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canEditJob = (job) => {
    return user?.role === 'admin' || 
           (user?.role === 'client' && job.clientId._id === user._id) ||
           (user?.role === 'provider' && job.assignedProviderId === user._id);
  };

  const canAddQuotation = (job) => {
    return user?.role === 'provider' && 
           (job.assignedProviderId === user._id || job.status === 'open');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-16 w-16 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading job requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Building className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Job Requests</h1>
              </div>
              <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                {pagination.totalJobs} {pagination.totalJobs === 1 ? 'Request' : 'Requests'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={fetchJobRequests}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                New Request
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Advanced Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search jobs, clients, providers..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Region Filter */}
              <Select value={filters.region} onValueChange={(value) => handleFilterChange('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  {REGIONS.map(region => (
                    <SelectItem key={region} value={region}>
                      {region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Location Filter */}
              <Select value={filters.location} onValueChange={(value) => handleFilterChange('location', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {MAJOR_CITIES.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Premium Filter */}
              <Select value={filters.isPremium} onValueChange={(value) => handleFilterChange('isPremium', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Premium" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Jobs</SelectItem>
                  <SelectItem value="true">Premium Only</SelectItem>
                  <SelectItem value="false">Standard Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              <div>
                <Label htmlFor="dateFrom">From Date</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">To Date</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilters({
                      status: 'all',
                      region: 'all',
                      location: 'all',
                      isPremium: 'all',
                      dateFrom: '',
                      dateTo: ''
                    });
                    setSearchTerm('');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
              <div className="flex items-end justify-end">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Job Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobRequests.map((job) => (
            <Card key={job._id} className="hover:shadow-lg transition-shadow duration-200">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                      {job.isPremium && (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Star className="h-3 w-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{job.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <CalendarDays className="h-4 w-4" />
                        <span>{formatDate(job.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getStatusConfig(job.status).color}>
                      {getStatusConfig(job.status).label}
                    </Badge>
                    <div className={`flex items-center space-x-1 text-xs ${getUrgencyColor(job.urgencyLevel)}`}>
                      <AlertCircle className="h-3 w-3" />
                      <span>{job.urgencyLevel}</span>
                    </div>
                  </div>
                </div>

                {/* Client Info */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">{job.clientName}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{job.clientEmail}</span>
                      </div>
                    </div>
                    {job.assignedProviderId && (
                      <Badge variant="outline">
                        <Award className="h-3 w-3 mr-1" />
                        Assigned
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Services */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Required Services</h4>
                  <div className="flex flex-wrap gap-1">
                    {job.requiredServices?.slice(0, 3).map((service) => (
                      <Badge key={service._id} variant="secondary" className="text-xs">
                        {service.code}
                      </Badge>
                    ))}
                    {job.requiredServices?.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{job.requiredServices.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Cost Summary</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleCostBreakdown(job._id)}
                    >
                      {expandedCostBreakdown[job._id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Total Cost:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(job.estimatedTotal, job.costDetails?.currency)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Duration:</span>
                      <span>{job.projectDuration} day{job.projectDuration > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  {/* Expanded Cost Breakdown */}
                  {expandedCostBreakdown[job._id] && job.costDetails && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-2">
                      <div className="text-xs font-medium text-gray-700 mb-2">Detailed Breakdown</div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>Base Cost:</span>
                          <span>{formatCurrency(job.costDetails.totals.baseCost)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>{formatCurrency(job.costDetails.totals.tax)}</span>
                        </div>
                        {job.costDetails.totals.additional > 0 && (
                          <div className="flex justify-between">
                            <span>Additional:</span>
                            <span>{formatCurrency(job.costDetails.totals.additional)}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t pt-1 font-semibold">
                          <span>Total:</span>
                          <span>{formatCurrency(job.costDetails.totals.grandTotal)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quotations Summary */}
                {job.quotationHistory?.length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-blue-900">
                        {job.quotationHistory.length} Quotation{job.quotationHistory.length > 1 ? 's' : ''}
                      </span>
                      <Quote className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      Latest: {formatCurrency(job.quotationHistory[job.quotationHistory.length - 1]?.quotedAmount)}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewDetails(job._id)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  {canAddQuotation(job) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowQuotationModal(true);
                      }}
                    >
                      <Quote className="h-4 w-4 mr-1" />
                      Quote
                    </Button>
                  )}

                  {canEditJob(job) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // Navigate to edit page or open edit modal
                        toast.success(`Edit job ${job._id}`);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {jobRequests.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No job requests found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <div className="text-sm text-gray-700">
              Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalJobs)} of{' '}
              {pagination.totalJobs} results
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.currentPage === 1}
                onClick={() => handlePageChange(pagination.currentPage - 1)}
              >
                Previous
              </Button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <Button
                  key={page}
                  variant={page === pagination.currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => handlePageChange(pagination.currentPage + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Job Details</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedJob(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Details */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Job Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{selectedJob.title}</span>
                        <Badge className={getStatusConfig(selectedJob.status).color}>
                          {getStatusConfig(selectedJob.status).label}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{selectedJob.description}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Location</Label>
                          <p className="font-medium">{selectedJob.location}, {selectedJob.region}</p>
                        </div>
                        <div>
                          <Label>Duration</Label>
                          <p className="font-medium">{selectedJob.projectDuration} day{selectedJob.projectDuration > 1 ? 's' : ''}</p>
                        </div>
                        <div>
                          <Label>Inspectors Required</Label>
                          <p className="font-medium">{selectedJob.numInspectors}</p>
                        </div>
                        <div>
                          <Label>Created</Label>
                          <p className="font-medium">{formatDate(selectedJob.createdAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Detailed Cost Breakdown */}
                  {selectedJob.costDetails && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Cost Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {/* Services */}
                          <div>
                            <h4 className="font-semibold mb-3">Services</h4>
                            <div className="space-y-2">
                              {selectedJob.costDetails.services?.map((service, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                  <div>
                                    <p className="font-medium">{service.name}</p>
                                    <p className="text-sm text-gray-600">
                                      {formatCurrency(service.charge)} × {service.quantity}
                                      {service.multiplier > service.quantity && (
                                        <span> × {service.multiplier / service.quantity}</span>
                                      )}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium">{formatCurrency(service.baseCost)}</p>
                                    <p className="text-sm text-gray-600">
                                      +{formatCurrency(service.taxAmount)} tax
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Additional Costs */}
                          {selectedJob.costDetails.additional?.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-3">Additional Costs</h4>
                              <div className="space-y-2">
                                {selectedJob.costDetails.additional.map((cost, index) => (
                                  <div key={index} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                                    <span>{cost.name}</span>
                                    <span className="font-medium">{formatCurrency(cost.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Totals */}
                          <div className="border-t pt-4 space-y-2">
                            <div className="flex justify-between">
                              <span>Subtotal:</span>
                              <span>{formatCurrency(selectedJob.costDetails.totals.baseCost)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tax:</span>
                              <span>{formatCurrency(selectedJob.costDetails.totals.tax)}</span>
                            </div>
                            {selectedJob.costDetails.totals.additional > 0 && (
                              <div className="flex justify-between">
                                <span>Additional:</span>
                                <span>{formatCurrency(selectedJob.costDetails.totals.additional)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-lg font-bold border-t pt-2">
                              <span>Total:</span>
                              <span className="text-green-600">
                                {formatCurrency(selectedJob.costDetails.totals.grandTotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Quotations */}
                  {selectedJob.quotationHistory?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Quotations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedJob.quotationHistory.map((quotation, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-semibold text-lg text-green-600">
                                    {formatCurrency(quotation.quotedAmount, quotation.currency)}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Valid until: {formatDate(quotation.validUntil)}
                                  </p>
                                </div>
                                <Badge variant="outline">
                                  {quotation.status}
                                </Badge>
                              </div>
                              {quotation.description && (
                                <p className="text-sm text-gray-700 mb-2">{quotation.description}</p>
                              )}
                              <p className="text-xs text-gray-500">
                                Submitted by {quotation.providerId?.companyName} on {formatDate(quotation.quotedAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Notes */}
                  {selectedJob.notes?.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Notes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedJob.notes.map((note, index) => (
                            <div key={index} className="p-3 border-l-4 border-blue-500 bg-blue-50">
                              <div className="flex items-center justify-between mb-1">
                                <Badge variant="outline">{note.type}</Badge>
                                <span className="text-xs text-gray-500">
                                  {formatDate(note.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm">{note.content}</p>
                              <p className="text-xs text-gray-600 mt-1">
                                By {note.addedBy?.name || 'Unknown'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Status Update */}
                  {canEditJob(selectedJob) && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Update Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Select 
                          value={selectedJob.status} 
                          onValueChange={(value) => handleStatusUpdate(selectedJob._id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(status => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  )}

                  {/* Client Info */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Client Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <Label>Name</Label>
                          <p className="font-medium">{selectedJob.clientName}</p>
                        </div>
                        <div>
                          <Label>Email</Label>
                          <p className="font-medium">{selectedJob.clientEmail}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {canAddQuotation(selectedJob) && (
                        <Button 
                          className="w-full"
                          onClick={() => setShowQuotationModal(true)}
                        >
                          <Quote className="h-4 w-4 mr-2" />
                          Add Quotation
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowNotesModal(true)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Add Note
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => setShowAttachmentModal(true)}
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Add Attachment
                      </Button>
                      
                      <Button variant="outline" className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Export Details
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quotation Modal */}
      {showQuotationModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Add Quotation</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={quotationForm.amount}
                      onChange={(e) => setQuotationForm(prev => ({ ...prev, amount: e.target.value }))
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select 
                      value={quotationForm.currency} 
                      onValueChange={(value) => setQuotationForm(prev => ({ ...prev, currency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="validUntil">Valid Until *</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={quotationForm.validUntil}
                    onChange={(e) => setQuotationForm(prev => ({ ...prev, validUntil: e.target.value }))
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={quotationForm.description}
                    onChange={(e) => setQuotationForm(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description of the quotation..."
                  />
                </div>

                <div>
                  <Label htmlFor="terms">Terms & Conditions</Label>
                  <Textarea
                    id="terms"
                    value={quotationForm.terms}
                    onChange={(e) => setQuotationForm(prev => ({ ...prev, terms: e.target.value }))
                    }
                    placeholder="Payment terms, delivery conditions, etc..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button onClick={handleAddQuotation} className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Submit Quotation
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowQuotationModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Add Note</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="noteType">Note Type</Label>
                  <Select 
                    value={noteForm.type} 
                    onValueChange={(value) => setNoteForm(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NOTE_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <type.icon className="h-4 w-4 mr-2" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="noteContent">Content *</Label>
                  <Textarea
                    id="noteContent"
                    value={noteForm.content}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))
                    }
                    placeholder="Enter your note..."
                    rows={4}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isInternal"
                    checked={noteForm.isInternal}
                    onChange={(e) => setNoteForm(prev => ({ ...prev, isInternal: e.target.checked }))
                    }
                  />
                  <Label htmlFor="isInternal">Internal note (not visible to client)</Label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button onClick={handleAddNote} className="flex-1">
                    <Send className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNotesModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Modal */}
      {showAttachmentModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">Add Attachment</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="files">Files *</Label>
                  <Input
                    id="files"
                    type="file"
                    multiple
                    onChange={(e) => setAttachmentForm(prev => ({ 
                      ...prev, 
                      files: Array.from(e.target.files) 
                    }))
                    }
                  />
                  {attachmentForm.files.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {attachmentForm.files.map((file, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center">
                          <Paperclip className="h-3 w-3 mr-1" />
                          {file.name} ({(file.size / 1024).toFixed(1)} KB)
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={attachmentForm.category} 
                    onValueChange={(value) => setAttachmentForm(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ATTACHMENT_CATEGORIES.map(category => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="attachmentDescription">Description</Label>
                  <Textarea
                    id="attachmentDescription"
                    value={attachmentForm.description}
                    onChange={(e) => setAttachmentForm(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description of the files..."
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    onClick={handleAddAttachment} 
                    className="flex-1"
                    disabled={attachmentForm.files.length === 0}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAttachmentModal(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobRequestsDashboard;