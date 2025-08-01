import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Eye, 
  Edit, 
  FileText, 
  Paperclip, 
  Calendar, 
  MapPin, 
  User, 
  Clock, 
  DollarSign, 
  Filter,
  Search,
  Download,
  Upload,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RotateCcw,
  RefreshCw
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { BACKEND_URL } from '@/constant/Global';

const InspectorJobDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusUpdateOpen, setStatusUpdateOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [attachmentDialogOpen, setAttachmentDialogOpen] = useState(false);  const [filters, setFilters] = useState({
    status: 'all',
    urgency: 'all',
    search: ''
  });
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState('general');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileCategory, setFileCategory] = useState('other');  const [refreshing, setRefreshing] = useState(false);

  // Job status configurations
  const statusConfig = {
    open: { color: 'bg-blue-100 text-blue-800', icon: Play, label: 'Open' },
    quoted: { color: 'bg-purple-100 text-purple-800', icon: DollarSign, label: 'Quoted' },
    negotiating: { color: 'bg-yellow-100 text-yellow-800', icon: MessageSquare, label: 'Negotiating' },
    accepted: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Accepted' },
    in_progress: { color: 'bg-blue-100 text-blue-800', icon: Play, label: 'In Progress' },
    completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' },
    delivered: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle, label: 'Delivered' },
    closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Closed' },
    cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
    disputed: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Disputed' },
    on_hold: { color: 'bg-gray-100 text-gray-800', icon: Pause, label: 'On Hold' }
  };

  const urgencyConfig = {
    low: { color: 'bg-green-100 text-green-800', label: 'Low' },
    medium: { color: 'bg-yellow-100 text-yellow-800', label: 'Medium' },
    high: { color: 'bg-orange-100 text-orange-800', label: 'High' },
    urgent: { color: 'bg-red-100 text-red-800', label: 'Urgent' }
  };

  // Available status transitions for inspectors
  const availableStatuses = [
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'disputed', label: 'Disputed' },
    { value: 'on_hold', label: 'On Hold' },
    { value: 'closed', label: 'Closed' }
  ];

  const noteTypes = [
    { value: 'general', label: 'General' },
    { value: 'technical', label: 'Technical' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'logistics', label: 'Logistics' }
  ];

  const fileCategories = [
    { value: 'drawing', label: 'Drawing' },
    { value: 'specification', label: 'Specification' },
    { value: 'report', label: 'Report' },
    { value: 'certificate', label: 'Certificate' },
    { value: 'photo', label: 'Photo' },
    { value: 'other', label: 'Other' }
  ];  // Fetch jobs assigned to inspector
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login to view jobs');
        return;
      }

      // Build query parameters - only include non-empty values
      const params = {};
      if (filters.status && filters.status !== 'all') params.status = filters.status;
      if (filters.urgency && filters.urgency !== 'all') params.urgencyLevel = filters.urgency;
      if (filters.search) params.search = filters.search;

      const response = await axios.get(`${BACKEND_URL}/api/v1/job-requests`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setJobs(response.data.data.jobRequests || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
      } else {
        toast.error('Failed to fetch jobs');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Refresh jobs
  const refreshJobs = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
    toast.success('Jobs refreshed successfully');
  };
  // Update job status
  const updateJobStatus = async () => {
    if (!selectedJob || !newStatus) {
      toast.error('Please select a status');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login to update job status');
        return;
      }

      await axios.patch(
        `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/status`,
        {
          status: newStatus,
          reason: statusReason
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Job status updated successfully');
      setStatusUpdateOpen(false);
      setNewStatus('');
      setStatusReason('');
      fetchJobs();
    } catch (error) {
      console.error('Error updating status:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update status');
      }
    }
  };
  // Add internal note
  const addNote = async () => {
    if (!selectedJob || !newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login to add notes');
        return;
      }

      await axios.post(
        `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/notes`,
        {
          content: newNote,
          noteType: noteType
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Note added successfully');
      setNoteDialogOpen(false);
      setNewNote('');
      setNoteType('general');
      fetchJobs();
    } catch (error) {
      console.error('Error adding note:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
      } else {
        toast.error(error.response?.data?.message || 'Failed to add note');
      }
    }
  };
  // Upload attachment
  const uploadAttachment = async () => {
    if (!selectedJob || !selectedFile) {
      toast.error('Please select a file');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        toast.error('Please login to upload attachments');
        return;
      }

      const formData = new FormData();
      formData.append('attachment', selectedFile);
      formData.append('category', fileCategory);

      await axios.post(
        `${BACKEND_URL}/api/v1/job-requests/${selectedJob._id}/attachments`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      toast.success('Attachment uploaded successfully');
      setAttachmentDialogOpen(false);
      setSelectedFile(null);
      setFileCategory('other');
      fetchJobs();
    } catch (error) {
      console.error('Error uploading attachment:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('accessToken');
      } else {
        toast.error(error.response?.data?.message || 'Failed to upload attachment');
      }
    }
  };
  // Filter jobs
  const filteredJobs = jobs.filter(job => {
    const matchesStatus = !filters.status || filters.status === 'all' || job.status === filters.status;
    const matchesUrgency = !filters.urgency || filters.urgency === 'all' || job.urgencyLevel === filters.urgency;
    const matchesSearch = !filters.search || 
      job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.description.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.clientName.toLowerCase().includes(filters.search.toLowerCase());
    
    return matchesStatus && matchesUrgency && matchesSearch;
  });

  // Format date
  const formatDate = (date) => {
    if (!date) return 'Not set';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'Not quoted';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspector Job Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage and track your assigned job requests</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={refreshJobs}
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

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {availableStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.urgency}
              onValueChange={(value) => setFilters(prev => ({ ...prev, urgency: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by urgency" />
              </SelectTrigger>              <SelectContent>
                <SelectItem value="all">All Urgencies</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>            <Button
              onClick={() => setFilters({ status: 'all', urgency: 'all', search: '' })}
              variant="outline"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <FileText className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Jobs Found</h3>
            <p className="text-gray-500 text-center">
              {jobs.length === 0 
                ? "You don't have any assigned jobs yet." 
                : "No jobs match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredJobs.map((job) => {
            const StatusIcon = statusConfig[job.status]?.icon || FileText;
            return (
              <Card key={job._id} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{job.title}</CardTitle>
                      <CardDescription className="mt-1">
                        Job ID: {job._id.slice(-8)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <Badge className={statusConfig[job.status]?.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {statusConfig[job.status]?.label || job.status}
                      </Badge>
                      {job.isPremium && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Job Info */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Client:</span>
                      <span className="font-medium">{job.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Location:</span>
                      <span className="truncate">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Duration:</span>
                      <span>{job.projectDuration} day(s)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Urgency:</span>
                      <Badge className={urgencyConfig[job.urgencyLevel]?.color}>
                        {urgencyConfig[job.urgencyLevel]?.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Info */}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Estimated Value</p>
                      <p className="font-semibold">{formatCurrency(job.estimatedTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="font-medium">{formatDate(job.createdAt)}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedJob(job)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Job Details - {selectedJob?.title}
                          </DialogTitle>
                          <DialogDescription>
                            Complete information about job request #{selectedJob?._id.slice(-8)}
                          </DialogDescription>
                        </DialogHeader>
                        {selectedJob && (
                          <JobDetailsModal 
                            job={selectedJob} 
                            onStatusUpdate={() => setStatusUpdateOpen(true)}
                            onAddNote={() => setNoteDialogOpen(true)}
                            onAddAttachment={() => setAttachmentDialogOpen(true)}
                          />
                        )}
                      </DialogContent>
                    </Dialog>
                    
                    <Button
                      size="sm"
                      onClick={() => {
                        setSelectedJob(job);
                        setStatusUpdateOpen(true);
                      }}
                      className="flex items-center gap-1"
                    >
                      <Edit className="h-4 w-4" />
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateOpen} onOpenChange={setStatusUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Job Status</DialogTitle>
            <DialogDescription>
              Change the status of job: {selectedJob?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for status change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setStatusUpdateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={updateJobStatus} disabled={!newStatus}>
                Update Status
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Internal Note</DialogTitle>
            <DialogDescription>
              Add a note to job: {selectedJob?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="noteType">Note Type</Label>
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {noteTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="note">Note Content</Label>
              <Textarea
                id="note"
                placeholder="Enter your note..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addNote} disabled={!newNote.trim()}>
                Add Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Attachment Dialog */}
      <Dialog open={attachmentDialogOpen} onOpenChange={setAttachmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Attachment</DialogTitle>
            <DialogDescription>
              Upload a file for job: {selectedJob?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category">File Category</Label>
              <Select value={fileCategory} onValueChange={setFileCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fileCategories.map(category => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="file">Select File</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.zip"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: PDF, DOC, DOCX, JPG, PNG, GIF, ZIP
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAttachmentDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={uploadAttachment} disabled={!selectedFile}>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Job Details Modal Component
const JobDetailsModal = ({ job, onStatusUpdate, onAddNote, onAddAttachment }) => {
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

  const formatCurrency = (amount) => {
    if (!amount) return 'Not quoted';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="notes">Notes ({job.internalNotes?.length || 0})</TabsTrigger>
        <TabsTrigger value="attachments">Files ({job.attachments?.length || 0})</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Job Information</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-500">Title</Label>
                <p className="font-medium">{job.title}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Description</Label>
                <p className="text-sm text-gray-700">{job.description}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Location</Label>
                <p>{job.location}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Region</Label>
                <p>{job.region}</p>
              </div>
            </div>
          </div>

          {/* Client & Timeline */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Client & Timeline</h3>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-500">Client</Label>
                <p className="font-medium">{job.clientName}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Client Email</Label>
                <p>{job.clientEmail}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Project Duration</Label>
                <p>{job.projectDuration} day(s)</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Preferred Start Date</Label>
                <p>{formatDate(job.preferredStartDate)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Expected Completion</Label>
                <p>{formatDate(job.expectedCompletionDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <Separator className="my-6" />
        <div>
          <h3 className="text-lg font-semibold mb-4">Financial Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label className="text-sm font-medium text-gray-500">Estimated Total</Label>
              <p className="text-xl font-bold text-blue-600">{formatCurrency(job.estimatedTotal)}</p>
            </div>
      
            <div className="bg-purple-50 p-4 rounded-lg">
              <Label className="text-sm font-medium text-gray-500">Urgency Level</Label>
              <p className="text-lg font-semibold text-purple-600 capitalize">{job.urgencyLevel}</p>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="notes" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Internal Notes</h3>
          <Button onClick={onAddNote} size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Note
          </Button>
        </div>
        
        {job.internalNotes && job.internalNotes.length > 0 ? (
          <div className="space-y-3">
            {job.internalNotes.map((note, index) => (
              <Card key={index} className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="outline" className="text-xs">
                      {note.noteType}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDate(note.addedAt)}
                    </span>
                  </div>
                  <p className="text-sm">{note.note}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No notes added yet</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="attachments" className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Attachments</h3>
          <Button onClick={onAddAttachment} size="sm">
            <Paperclip className="h-4 w-4 mr-2" />
            Add File
          </Button>
        </div>
        
        {job.attachments && job.attachments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {job.attachments.map((attachment, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium truncate">{attachment.originalFileName}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {attachment.category} • {(attachment.fileSize / 1024).toFixed(1)} KB
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(attachment.uploadedAt)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(attachment.fileUrl, '_blank')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Paperclip className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No attachments uploaded yet</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="actions" className="space-y-4">
        <h3 className="text-lg font-semibold">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button onClick={onStatusUpdate} className="h-20 flex flex-col gap-2">
            <Edit className="h-6 w-6" />
            Update Job Status
          </Button>
          <Button onClick={onAddNote} variant="outline" className="h-20 flex flex-col gap-2">
            <MessageSquare className="h-6 w-6" />
            Add Internal Note
          </Button>
          <Button onClick={onAddAttachment} variant="outline" className="h-20 flex flex-col gap-2">
            <Paperclip className="h-6 w-6" />
            Upload Attachment
          </Button>
          <Button variant="outline" className="h-20 flex flex-col gap-2">
            <Download className="h-6 w-6" />
            Generate Report
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default InspectorJobDashboard;