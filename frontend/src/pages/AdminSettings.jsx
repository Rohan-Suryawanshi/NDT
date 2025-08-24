import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RotateCcw, Calculator, DollarSign, Settings, Shield } from 'lucide-react';
import { BACKEND_URL } from '@/constant/Global';
import NavbarSection from '@/features/NavbarSection/NavbarSection';

const AdminSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorData, setCalculatorData] = useState({
    amount: '',
    userType: 'provider',
    withdrawalMethod: 'bank_transfer'
  });
  const [calculatorResult, setCalculatorResult] = useState(null);

  // Create axios instance with auth header
  const createAxiosInstance = () => {
    const token = localStorage.getItem('accessToken');
    return axios.create({
      baseURL: BACKEND_URL,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      }
    });
  };

  // Update settings
  const updateSettings = async () => {
    try {
      setSaving(true);
      const api = createAxiosInstance();
      const response = await api.put('/api/v1/admin/settings', settings);
      setSettings(response.data.data);
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  // Reset settings to defaults
  const resetToDefaults = async () => {
    try {
      setSaving(true);
      const api = createAxiosInstance();
      const response = await api.post('/api/v1/admin/settings/reset');
      setSettings(response.data.data);
      setShowResetDialog(false);
      toast.success('Settings reset to defaults successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  // Calculate fees preview
  const calculateFees = async () => {
    if (!calculatorData.amount || calculatorData.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const api = createAxiosInstance();
      const response = await api.post('/api/v1/admin/settings/calculate-fees', calculatorData);
      setCalculatorResult(response.data.data);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to calculate fees');
    }
  };

  // Handle input changes
  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle withdrawal fees changes
  const handleWithdrawalFeesChange = (method, type, value) => {
    setSettings(prev => ({
      ...prev,
      withdrawalFees: {
        ...prev.withdrawalFees,
        [method]: {
          ...prev.withdrawalFees[method],
          [type]: parseFloat(value) || 0
        }
      }
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const api = createAxiosInstance();
        
        // Fetch settings
        const settingsResponse = await api.get('/api/v1/admin/settings');
        setSettings(settingsResponse.data.data);
      } catch (error) {
        toast.error(error.response?.data?.message || error.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004aad]"></div>
      </div>
    );
  }

  return (
    <>
    <NavbarSection/>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8 mt-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Settings</h1>
          <p className="text-gray-600">Manage platform settings, fees, and configurations</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button 
            onClick={updateSettings} 
            disabled={saving}
            className="bg-[#004aad] text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          
          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogTrigger asChild>
              {/* <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button> */}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reset Settings to Defaults</DialogTitle>
                <DialogDescription>
                  This will reset all settings to their default values. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={resetToDefaults} 
                  disabled={saving}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Reset Settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showCalculator} onOpenChange={setShowCalculator}>
            <DialogTrigger asChild>
              {/* <Button variant="outline">
                <Calculator className="w-4 h-4 mr-2" />
                Fee Calculator
              </Button> */}
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Fee Calculator</DialogTitle>
                <DialogDescription>
                  Calculate fees and earnings for different scenarios
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="calcAmount">Amount ($)</Label>
                  <Input
                    id="calcAmount"
                    type="number"
                    value={calculatorData.amount}
                    onChange={(e) => setCalculatorData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter amount..."
                  />
                </div>
                <div>
                  <Label htmlFor="userType">User Type</Label>
                  <Select 
                    value={calculatorData.userType} 
                    onValueChange={(value) => setCalculatorData(prev => ({ ...prev, userType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="provider">Service Provider</SelectItem>
                      <SelectItem value="inspector">Inspector</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="withdrawalMethod">Withdrawal Method</Label>
                  <Select 
                    value={calculatorData.withdrawalMethod} 
                    onValueChange={(value) => setCalculatorData(prev => ({ ...prev, withdrawalMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={calculateFees} className="w-full">
                  Calculate Fees
                </Button>
                
                {calculatorResult && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                    <h4 className="font-medium">Calculation Results:</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Input Amount:</span>
                        <span>${calculatorResult.inputAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Platform Fee:</span>
                        <span>${calculatorResult.paymentBreakdown?.platformFee?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Fee:</span>
                        <span>${calculatorResult.paymentBreakdown?.processingFee?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>User Earnings:</span>
                        <span>${calculatorResult.earningsBreakdown?.earnings?.toFixed(2) || '0.00'}</span>
                      </div>
                      {calculatorResult.withdrawalBreakdown && (
                        <>
                          <div className="flex justify-between">
                            <span>Withdrawal Fee:</span>
                            <span>${calculatorResult.withdrawalBreakdown.fee?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div className="flex justify-between font-medium text-green-600">
                            <span>Net Amount:</span>
                            <span>${calculatorResult.withdrawalBreakdown.netAmount?.toFixed(2) || '0.00'}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Settings Tabs */}
        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-white border">
            <TabsTrigger value="payments" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>Payments & Fees</span>
            </TabsTrigger>
            <TabsTrigger value="withdrawals" className="flex items-center space-x-2">
              <Settings className="w-4 h-4" />
              <span>Withdrawals</span>
            </TabsTrigger>
          </TabsList>

          {/* Payment Settings */}
          <TabsContent value="payments">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                  Platform Fees
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="platformFee">Platform Fee (%)</Label>
                    <Input
                      id="platformFee"
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={settings?.platformFeePercentage || ''}
                      onChange={(e) => handleSettingsChange('platformFeePercentage', parseFloat(e.target.value))}
                    />
                    <p className="text-sm text-gray-500 mt-1">Percentage of each transaction taken as platform fee</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="processingFee">Processing Fee (%)</Label>
                    <Input
                      id="processingFee"
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      value={settings?.processingFeePercentage || ''}
                      onChange={(e) => handleSettingsChange('processingFeePercentage', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="fixedProcessingFee">Fixed Processing Fee ($)</Label>
                    <Input
                      id="fixedProcessingFee"
                      type="number"
                      min="0"
                      step="0.01"
                      value={settings?.fixedProcessingFee || ''}
                      onChange={(e) => handleSettingsChange('fixedProcessingFee', parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </Card>
{/* 
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Commission Rates
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="providerCommission">Provider Commission (%)</Label>
                    <Input
                      id="providerCommission"
                      type="number"
                      min="50"
                      max="100"
                      step="1"
                      value={settings?.providerCommissionPercentage || ''}
                      onChange={(e) => handleSettingsChange('providerCommissionPercentage', parseFloat(e.target.value))}
                    />
                    <p className="text-sm text-gray-500 mt-1">Percentage service providers keep</p>
                  </div>
                  
                  <div>
                    <Label htmlFor="inspectorCommission">Inspector Commission (%)</Label>
                    <Input
                      id="inspectorCommission"
                      type="number"
                      min="50"
                      max="100"
                      step="1"
                      value={settings?.inspectorCommissionPercentage || ''}
                      onChange={(e) => handleSettingsChange('inspectorCommissionPercentage', parseFloat(e.target.value))}
                    />
                    <p className="text-sm text-gray-500 mt-1">Percentage inspectors keep</p>
                  </div>
                </div>
              </Card> */}
            </div>
          </TabsContent>

          {/* Withdrawal Settings */}
          <TabsContent value="withdrawals">
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Withdrawal Settings</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="minWithdrawal">Minimum Withdrawal Amount ($)</Label>
                    <Input
                      id="minWithdrawal"
                      type="number"
                      min="1"
                      value={settings?.minimumWithdrawalAmount || ''}
                      onChange={(e) => handleSettingsChange('minimumWithdrawalAmount', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="processingDays">Processing Days</Label>
                    <Input
                      id="processingDays"
                      type="number"
                      min="1"
                      max="30"
                      value={settings?.withdrawalProcessingDays || ''}
                      onChange={(e) => handleSettingsChange('withdrawalProcessingDays', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-semibold mb-4">Withdrawal Method Fees</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {Object.entries(settings?.withdrawalFees || {}).map(([method, fees]) => (
                    <div key={method} className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3 capitalize">{method.replace('_', ' ')}</h4>
                      <div className="space-y-2">
                        <div>
                          <Label>Percentage (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={fees?.percentage || ''}
                            onChange={(e) => handleWithdrawalFeesChange(method, 'percentage', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Fixed Fee ($)</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fees?.fixed || ''}
                            onChange={(e) => handleWithdrawalFeesChange(method, 'fixed', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
};

export default AdminSettings;