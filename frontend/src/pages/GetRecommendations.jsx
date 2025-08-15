import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { 
  Star, 
  MapPin, 
  Search, 
  Filter, 
  Building2, 
  Award, 
  Phone, 
  Mail, 
  RefreshCw,
  TrendingUp,
  Target,
  Users,
  CheckCircle,
  AlertCircle,
  Eye,
  Send,
  DollarSign,
  Clock,
  Shield
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BACKEND_URL } from '@/constant/Global';
import NavbarSection from '@/features/NavbarSection/NavbarSection';

const GetRecommendations = () => {
  // State Management
  const [providers, setProviders] = useState([]);
  const [services, setServices] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Filter States
  const [filters, setFilters] = useState({
    selectedService: 'all',
    location: '',
    specialization: '',
    minRating: [0],
    maxBudget: [10000],
    urgency: 'any', // low, medium, high, urgent, any
    verified: 'all', // all, verified, unverified
    availability: 'all' // all, available, busy
  });

  // Recommendation Criteria
  const [recommendationCriteria, setRecommendationCriteria] = useState({
    prioritizeRating: true,
    prioritizePrice: false,
    prioritizeLocation: true,
    prioritizeExperience: true,
    prioritizeCertifications: true
  });

  // Fetch Data
  const fetchProviders = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/api/v1/service-provider/all`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      if (response.data.success) {
        setProviders(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setError('Failed to load service providers');
      toast.error('Failed to load providers');
    }
  }, []);

  const fetchServices = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${BACKEND_URL}/api/v1/service`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      if (response.data.success) {
        setServices(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    }
  }, []);

  // Smart Recommendation Algorithm
  const generateRecommendations = useCallback(() => {
    let filtered = [...providers];

    // Basic filtering
    if (filters.selectedService && filters.selectedService !== 'all') {
      filtered = filtered.filter(provider =>
        provider.services?.some(service => service.serviceId === filters.selectedService)
      );
    }

    if (filters.location) {
      filtered = filtered.filter(provider =>
        provider.companyLocation?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.specialization) {
      filtered = filtered.filter(provider =>
        provider.companySpecialization?.some(spec =>
          spec.toLowerCase().includes(filters.specialization.toLowerCase())
        )
      );
    }

    if (filters.minRating[0] > 0) {
      filtered = filtered.filter(provider => provider.rating >= filters.minRating[0]);
    }

    if (filters.verified !== 'all') {
      filtered = filtered.filter(provider =>
        filters.verified === 'verified' ? provider.user?.isVerified : !provider.user?.isVerified
      );
    }

    // Smart scoring algorithm
    const scoredProviders = filtered.map(provider => {
      let score = 0;
      let maxScore = 0;

      // Rating score (0-30 points)
      if (recommendationCriteria.prioritizeRating) {
        score += (provider.rating || 0) * 6; // Max 30 points for 5-star rating
        maxScore += 30;
      }

      // Price score (0-25 points) - Lower price = higher score
      if (recommendationCriteria.prioritizePrice && filters.selectedService && filters.selectedService !== 'all') {
        const serviceOffering = provider.services?.find(s => s.serviceId === filters.selectedService);
        if (serviceOffering) {
          const priceScore = Math.max(0, 25 - (serviceOffering.charge / filters.maxBudget[0]) * 25);
          score += priceScore;
        }
        maxScore += 25;
      }

      // Location proximity (0-20 points)
      if (recommendationCriteria.prioritizeLocation && filters.location) {
        const locationMatch = provider.companyLocation?.toLowerCase().includes(filters.location.toLowerCase());
        if (locationMatch) score += 20;
        maxScore += 20;
      }

      // Experience/Certifications (0-15 points)
      if (recommendationCriteria.prioritizeCertifications) {
        const certCount = provider.certificates?.length || 0;
        score += Math.min(15, certCount * 3); // Max 15 points
        maxScore += 15;
      }

      // Specialization match (0-10 points)
      if (filters.specialization) {
        const specMatch = provider.companySpecialization?.some(spec =>
          spec.toLowerCase().includes(filters.specialization.toLowerCase())
        );
        if (specMatch) score += 10;
        maxScore += 10;
      }

      return {
        ...provider,
        recommendationScore: maxScore > 0 ? (score / maxScore) * 100 : 0,
        matchReasons: getMatchReasons(provider, filters)
      };
    });

    // Sort by recommendation score
    const sorted = scoredProviders.sort((a, b) => b.recommendationScore - a.recommendationScore);
    
    setRecommendations(sorted);
  }, [providers, filters, recommendationCriteria]);

  // Get match reasons for display
  const getMatchReasons = (provider, filters) => {
    const reasons = [];

    if (provider.rating >= 4) reasons.push('High rated');
    if (provider.certificates?.length >= 3) reasons.push('Well certified');
    if (filters.location && provider.companyLocation?.toLowerCase().includes(filters.location.toLowerCase())) {
      reasons.push('Local provider');
    }
    if (provider.user?.isVerified) reasons.push('Verified profile');
    if (filters.selectedService && filters.selectedService !== 'all') {
      const hasService = provider.services?.some(s => s.serviceId === filters.selectedService);
      if (hasService) reasons.push('Offers requested service');
    }

    return reasons;
  };

  // Effects
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchProviders(), fetchServices()]);
      setLoading(false);
    };
    loadData();
  }, [fetchProviders, fetchServices]);

  useEffect(() => {
    if (providers.length > 0) {
      generateRecommendations();
    }
  }, [providers, filters, recommendationCriteria, generateRecommendations]);

  // Helper Functions
  const getServiceName = (serviceId) => {
    const service = services.find(s => s._id === serviceId);
    return service?.name || 'Unknown Service';
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const handleViewDetails = (provider) => {
    setSelectedProvider(provider);
    setShowDetailsModal(true);
  };

  const clearFilters = () => {
    setFilters({
      selectedService: 'all',
      location: '',
      specialization: '',
      minRating: [0],
      maxBudget: [10000],
      urgency: 'any',
      verified: 'all',
      availability: 'all'
    });
    toast.success('Filters cleared');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavbarSection />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 mt-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Target className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Smart Recommendations</h1>
              <Badge variant="secondary" className="text-sm">
                {recommendations.length} Recommended
              </Badge>
            </div>
            <Button
              onClick={() => {
                fetchProviders();
                fetchServices();
              }}
              variant="outline"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Smart Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Service Selection */}
                <div>
                  <Label>Required Service</Label>
                  <Select
                    value={filters.selectedService}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, selectedService: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Services</SelectItem>
                      {services.map(service => (
                        <SelectItem key={service._id} value={service._id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Location */}
                <div>
                  <Label>Location</Label>
                  <Input
                    placeholder="Enter city or region"
                    value={filters.location}
                    onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>

                {/* Specialization */}
                <div>
                  <Label>Specialization</Label>
                  <Input
                    placeholder="e.g., Radiographic Testing"
                    value={filters.specialization}
                    onChange={(e) => setFilters(prev => ({ ...prev, specialization: e.target.value }))}
                  />
                </div>

                {/* Rating Filter */}
                <div>
                  <Label>Minimum Rating: {filters.minRating[0]}</Label>
                  <Slider
                    value={filters.minRating}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: value }))}
                    max={5}
                    min={0}
                    step={0.5}
                    className="mt-2"
                  />
                </div>

                {/* Budget Filter */}
                <div>
                  <Label>Max Budget: ${filters.maxBudget[0]}</Label>
                  <Slider
                    value={filters.maxBudget}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, maxBudget: value }))}
                    max={20000}
                    min={100}
                    step={100}
                    className="mt-2"
                  />
                </div>

                {/* Verified Filter */}
                <div>
                  <Label>Verification Status</Label>
                  <Select
                    value={filters.verified}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, verified: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      <SelectItem value="verified">Verified Only</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Recommendation Criteria */}
                <div className="border-t pt-4">
                  <Label className="text-sm font-medium">Prioritize:</Label>
                  <div className="space-y-2 mt-2">
                    {Object.entries(recommendationCriteria).map(([key, value]) => (
                      <label key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={value}
                          onChange={(e) => setRecommendationCriteria(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm capitalize">
                          {key.replace('prioritize', '').replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button onClick={clearFilters} variant="outline" className="w-full">
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading recommendations...</span>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-12">
                <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
                <p className="text-gray-500">Try adjusting your filters to see more providers.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Recommendation Stats */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                          <span className="font-medium">
                            {recommendations.filter(p => p.recommendationScore >= 80).length} Perfect Matches
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          <span className="font-medium">
                            {recommendations.filter(p => p.recommendationScore >= 60).length} Good Matches
                          </span>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        Sorted by relevance
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Provider Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                  {recommendations.map((provider) => (
                    <Card key={provider._id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        {/* Header with Score */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={provider.user?.avatar || '/default-avatar.png'}
                              alt={provider.user?.fullName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div>
                              <h3 className="font-bold text-lg">{provider.user?.fullName}</h3>
                              <p className="text-sm text-gray-600">{provider.companyName}</p>
                              <div className="flex items-center space-x-1">
                                {renderStars(provider.rating || 0)}
                                <span className="text-sm font-medium ml-1">
                                  {provider.rating || 'New'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              className={
                                provider.recommendationScore >= 80
                                  ? 'bg-green-100 text-green-800'
                                  : provider.recommendationScore >= 60
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {Math.round(provider.recommendationScore)}% Match
                            </Badge>
                            {provider.user?.isVerified && (
                              <Badge variant="outline" className="bg-green-100 text-green-800 ml-2">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Match Reasons */}
                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1">
                            {provider.matchReasons.map((reason, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center space-x-2 text-sm">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <span>{provider.companyLocation}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-sm">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <span>{provider.contactNumber}</span>
                          </div>
                        </div>

                        {/* Services & Pricing */}
                        {provider.services?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2">Services Offered:</h4>
                            <div className="space-y-1">
                              {provider.services.slice(0, 3).map((service, index) => (
                                <div key={index} className="flex justify-between text-sm">
                                  <span>{getServiceName(service.serviceId)}</span>
                                  <span className="font-medium">
                                    ${service.charge} {service.unit}
                                  </span>
                                </div>
                              ))}
                              {provider.services.length > 3 && (
                                <p className="text-xs text-gray-500">
                                  +{provider.services.length - 3} more services
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Certifications */}
                        {provider.certificates?.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center">
                              <Award className="w-4 h-4 mr-1" />
                              Certifications ({provider.certificates.length}):
                            </h4>
                            <div className="flex flex-wrap gap-1">
                              {provider.certificates.slice(0, 3).map((cert, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {cert.certificateName || `Cert ${index + 1}`}
                                </Badge>
                              ))}
                              {provider.certificates.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{provider.certificates.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex space-x-2 pt-4 border-t">
                          <Button
                            onClick={() => handleViewDetails(provider)}
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                          <Button
                            onClick={() => {
                              // Navigate to request service
                              window.location.href = `/client-provider-selection?provider=${provider._id}`;
                            }}
                            size="sm"
                            className="flex-1 bg-[#004aad]hover:bg-blue-700"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Request Service
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Provider Details Modal */}
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <img
                  src={selectedProvider?.user?.avatar || '/default-avatar.png'}
                  alt={selectedProvider?.user?.fullName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <span>{selectedProvider?.user?.fullName}</span>
                  <p className="text-sm text-gray-600 font-normal">
                    {selectedProvider?.companyName}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedProvider && (
              <div className="space-y-6">
                {/* Match Score */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">Recommendation Score</h3>
                      <p className="text-sm text-gray-600">Based on your criteria</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {Math.round(selectedProvider.recommendationScore)}%
                      </div>
                      <p className="text-sm text-gray-600">Match</p>
                    </div>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedProvider.contactNumber}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedProvider.user?.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedProvider.companyLocation}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm">Rating: {selectedProvider.rating || 'New'}/5</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{selectedProvider.companyName}</span>
                    </div>
                  </div>
                </div>

                {/* Company Description */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">About</h3>
                  <p className="text-gray-600">{selectedProvider.companyDescription}</p>
                </div>

                {/* Specializations */}
                {selectedProvider.companySpecialization?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Specializations</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedProvider.companySpecialization.map((spec, index) => (
                        <Badge key={index} variant="outline">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Services */}
                {selectedProvider.services?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Services & Pricing</h3>
                    <div className="grid gap-3">
                      {selectedProvider.services.map((service, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <span className="font-medium">{getServiceName(service.serviceId)}</span>
                            <p className="text-sm text-gray-600">Unit: {service.unit}</p>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-green-600">
                              ${service.charge}
                            </span>
                            <p className="text-xs text-gray-500">{service.currency}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certifications */}
                {selectedProvider.certificates?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Award className="w-5 h-5 mr-2" />
                      Certifications ({selectedProvider.certificates.length})
                    </h3>
                    <div className="grid gap-3">
                      {selectedProvider.certificates.map((cert, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h4 className="font-medium">{cert.certificateName}</h4>
                          <p className="text-sm text-gray-600">
                            Issued by: {cert.issuingAuthority}
                          </p>
                          <p className="text-sm text-gray-600">
                            Valid until: {new Date(cert.expirationDate).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setShowDetailsModal(false);
                      window.location.href = `/client-provider-selection?provider=${selectedProvider._id}`;
                    }}
                    className="flex-1 bg-[#004aad] hover:bg-blue-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Request Service
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default GetRecommendations;
