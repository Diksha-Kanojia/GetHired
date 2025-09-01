import { AlertCircle, ArrowLeft, Briefcase, Camera, CameraOff, CheckCircle, Clock, FileText, Mic, MicOff, Monitor, Upload, Users } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMedia } from './MediaContext';

export default function Setup() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    setupMedia,
    getMediaStream,
    isMediaReady,
    cameraEnabled,
    micEnabled,
    mediaError,
    isInitializing,
    clearMediaError,
    toggleCamera,
    toggleMicrophone,
    testMicrophone,
    permissionStatus
  } = useMedia();

  // Get data passed from Dashboard
  const dashboardData = location.state || {};

  // Form state
  const [formData, setFormData] = useState({
    resume: dashboardData.resume || null,
    position: dashboardData.position || '',
    interviewType: dashboardData.interviewType || 'mixed',
    duration: dashboardData.duration || 30,
    userProfile: dashboardData.userProfile || {
      experienceLevel: 'Mid-level',
      skills: '',
      background: '',
      yearsOfExperience: '2-5',
      education: 'Bachelor\'s Degree'
    }
  });

  // UI state
  const [dragActive, setDragActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isStarting, setIsStarting] = useState(false);
  const [micTestResult, setMicTestResult] = useState(null);
  const [showMediaTest, setShowMediaTest] = useState(false);

  // Track if media setup has been attempted
  const mediaSetupAttempted = useRef(false);

  // Interview configuration options
  const interviewTypes = [
    { 
      id: 'technical', 
      label: 'Technical Interview', 
      icon: '💻',
      description: 'Focus on technical skills, coding, and problem-solving'
    },
    { 
      id: 'behavioral', 
      label: 'Behavioral Interview', 
      icon: '🧠',
      description: 'Focus on past experiences, leadership, and soft skills'
    },
    { 
      id: 'mixed', 
      label: 'Mixed Interview', 
      icon: '⚡',
      description: 'Combination of technical and behavioral questions'
    }
  ];

  const durations = [
    { id: 15, label: '15 minutes', questions: '3-4 questions' },
    { id: 30, label: '30 minutes', questions: '5-6 questions' },
    { id: 45, label: '45 minutes', questions: '7-8 questions' },
    { id: 60, label: '60 minutes', questions: '9-10 questions' }
  ];

  const experienceLevels = [
    { id: 'entry', label: 'Entry Level (0-2 years)' },
    { id: 'mid', label: 'Mid Level (2-5 years)' },
    { id: 'senior', label: 'Senior Level (5-10 years)' },
    { id: 'lead', label: 'Lead/Principal (10+ years)' }
  ];

  // Memoized media setup function to prevent infinite loops
  const initializeMedia = useCallback(async () => {
    if (mediaSetupAttempted.current) {
      return; // Prevent multiple initialization attempts
    }
    
    mediaSetupAttempted.current = true;
    
    try {
      await setupMedia({ video: true, audio: true });
    } catch (error) {
      console.error('Failed to setup media:', error);
      // Don't block the setup process if media fails initially
    }
  }, [setupMedia]);

  // Auto-setup media on component mount - only run once
  useEffect(() => {
    initializeMedia();
  }, [initializeMedia]);

  // Handle file drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        handleFileUpload(file);
      } else {
        alert('Please upload a PDF file only.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        handleFileUpload(file);
      } else {
        alert('Please upload a PDF file only.');
      }
    }
  };

  const handleFileUpload = (file) => {
    setFormData(prev => ({ ...prev, resume: file }));
    
    // Basic resume parsing simulation (in real app, you'd send to a parsing service)
    const mockResumeData = {
      fileName: file.name,
      workExperience: [
        {
          title: formData.position || 'Software Developer',
          company: 'Tech Company',
          duration: '2+ years'
        }
      ],
      technicalSkills: formData.userProfile.skills ? 
        formData.userProfile.skills.split(',').map(s => s.trim()) : 
        ['JavaScript', 'React', 'Node.js'],
      projects: [],
      certifications: []
    };

    setFormData(prev => ({
      ...prev,
      resumeData: mockResumeData,
      userProfile: {
        ...prev.userProfile,
        skills: prev.userProfile.skills || mockResumeData.technicalSkills.join(', ')
      }
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfileChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      userProfile: { ...prev.userProfile, [field]: value }
    }));
  };

  const testMicrophoneFunction = async () => {
    try {
      setMicTestResult('testing');
      const result = await testMicrophone();
      setMicTestResult('success');
      console.log('Microphone test result:', result);
    } catch (error) {
      setMicTestResult('failed');
      console.error('Microphone test failed:', error);
    }
  };

  const retryMediaSetup = async () => {
    clearMediaError();
    mediaSetupAttempted.current = false; // Reset the flag to allow retry
    try {
      await setupMedia({ video: true, audio: true });
      mediaSetupAttempted.current = true;
    } catch (error) {
      console.error('Media setup retry failed:', error);
      mediaSetupAttempted.current = true; // Still set to prevent infinite retries
    }
  };

  const startInterview = async () => {
    // Validate required fields
    if (!formData.position.trim()) {
      alert('Please enter a position title.');
      return;
    }

    // Check if media is ready
    if (!isMediaReady()) {
      alert('Camera and microphone setup required. Please allow permissions and try again.');
      setShowMediaTest(true);
      return;
    }

    setIsStarting(true);

    try {
      // Prepare interview data (excluding the MediaStream which cannot be serialized)
      const interviewData = {
        ...formData,
        startTime: new Date().toISOString(),
        // Remove totalQuestions calculation - let InterviewQuestion component handle it
      };

      // Navigate to interview screen
      // The Interview component will access the MediaStream directly from MediaContext
      navigate('/interview', {
        state: interviewData,
        replace: true
      });

    } catch (error) {
      console.error('Failed to start interview:', error);
      alert('Failed to start interview. Please try again.');
      setIsStarting(false);
    }
  };

  const nextStep = () => {
    if (currentStep === 1 && !formData.position.trim()) {
      alert('Please enter a position title.');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getStepIcon = (step) => {
    if (currentStep > step) return <CheckCircle className="w-6 h-6 text-green-400" />;
    if (currentStep === step) return <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">{step}</div>;
    return <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-sm font-bold">{step}</div>;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => navigate('/dashboard')} 
                className="text-gray-400 hover:text-white transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold">Interview Setup</h1>
                <p className="text-gray-400">Configure your mock interview experience</p>
              </div>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                {getStepIcon(1)}
                <span className={`text-sm ${currentStep >= 1 ? 'text-white' : 'text-gray-400'}`}>Details</span>
              </div>
              <div className="w-8 h-px bg-gray-700"></div>
              <div className="flex items-center space-x-2">
                {getStepIcon(2)}
                <span className={`text-sm ${currentStep >= 2 ? 'text-white' : 'text-gray-400'}`}>Profile</span>
              </div>
              <div className="w-8 h-px bg-gray-700"></div>
              <div className="flex items-center space-x-2">
                {getStepIcon(3)}
                <span className={`text-sm ${currentStep >= 3 ? 'text-white' : 'text-gray-400'}`}>Setup</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Step 1: Basic Interview Details */}
        {currentStep === 1 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Tell us about your interview</h2>
              <p className="text-gray-400">Let's start with the basics</p>
            </div>

            {/* Position Input */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center space-x-3 mb-4">
                <Briefcase className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-semibold">Position / Role</h3>
              </div>
              <input
                type="text"
                placeholder="e.g. Frontend Developer, Data Scientist, Product Manager"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-colors text-lg"
                required
              />
            </div>

            {/* Interview Type */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center space-x-3 mb-4">
                <Users className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-semibold">Interview Type</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {interviewTypes.map((type) => (
                  <label
                    key={type.id}
                    className={`flex items-start space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.interviewType === type.id
                        ? 'border-blue-400 bg-blue-400/10'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="interviewType"
                      value={type.id}
                      checked={formData.interviewType === type.id}
                      onChange={(e) => handleInputChange('interviewType', e.target.value)}
                      className="text-blue-400 mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-2xl">{type.icon}</span>
                        <span className="font-semibold text-lg">{type.label}</span>
                      </div>
                      <p className="text-gray-400 text-sm">{type.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center space-x-3 mb-4">
                <Clock className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-semibold">Interview Duration</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {durations.map((duration) => (
                  <label
                    key={duration.id}
                    className={`flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.duration === duration.id
                        ? 'border-blue-400 bg-blue-400/10'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value={duration.id}
                      checked={formData.duration === duration.id}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      className="sr-only"
                    />
                    <span className="font-semibold text-lg">{duration.label}</span>
                    <span className="text-gray-400 text-sm mt-1">{duration.questions}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: User Profile & Resume */}
        {currentStep === 2 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Your profile</h2>
              <p className="text-gray-400">Help us personalize your interview questions</p>
            </div>

            {/* Resume Upload */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center space-x-3 mb-4">
                <FileText className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-semibold">Resume (Optional)</h3>
              </div>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-400/5'
                    : formData.resume
                    ? 'border-green-400 bg-green-400/5'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className={`w-12 h-12 mx-auto mb-4 ${
                  formData.resume ? 'text-green-400' : 'text-gray-500'
                }`} />
                
                {formData.resume ? (
                  <div>
                    <p className="text-green-400 font-medium">{formData.resume.name}</p>
                    <p className="text-gray-400 text-sm mt-1">Resume uploaded successfully</p>
                    <button
                      onClick={() => setFormData(prev => ({ ...prev, resume: null, resumeData: null }))}
                      className="text-red-400 text-sm mt-2 hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg mb-2">Drop your resume here</p>
                    <p className="text-gray-400 mb-4">or</p>
                    <label className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors">
                      <span>Browse Files</span>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                    <p className="text-gray-500 text-sm mt-3">PDF files only</p>
                  </div>
                )}
              </div>
            </div>

            {/* Experience Level */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center space-x-3 mb-4">
                <Monitor className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-semibold">Experience Level</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {experienceLevels.map((level) => (
                  <label
                    key={level.id}
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.userProfile.experienceLevel === level.id
                        ? 'border-blue-400 bg-blue-400/10'
                        : 'border-gray-700 hover:border-gray-600 hover:bg-gray-800/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="experienceLevel"
                      value={level.id}
                      checked={formData.userProfile.experienceLevel === level.id}
                      onChange={(e) => handleProfileChange('experienceLevel', e.target.value)}
                      className="text-blue-400"
                    />
                    <span className="font-medium">{level.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center space-x-3 mb-4">
                <CheckCircle className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-semibold">Key Skills</h3>
              </div>
              <textarea
                placeholder="e.g. JavaScript, React, Node.js, Python, SQL, Project Management..."
                value={formData.userProfile.skills}
                onChange={(e) => handleProfileChange('skills', e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:border-blue-400 focus:ring-1 focus:ring-blue-400 focus:outline-none transition-colors"
                rows="3"
              />
              <p className="text-gray-500 text-sm mt-2">Separate multiple skills with commas</p>
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={nextStep}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Media Setup & Final Check */}
        {currentStep === 3 && (
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Camera & microphone setup</h2>
              <p className="text-gray-400">We need access to your camera and microphone for the interview</p>
            </div>

            {/* Media Controls */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center space-x-3 mb-6">
                <Camera className="w-5 h-5 text-blue-400" />
                <h3 className="text-xl font-semibold">Media Permissions</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Camera Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {cameraEnabled ? (
                        <Camera className="w-5 h-5 text-green-400" />
                      ) : (
                        <CameraOff className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="font-medium">Camera</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${cameraEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                        {cameraEnabled ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={toggleCamera}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          cameraEnabled ? 'bg-green-600' : 'bg-gray-600'
                        }`}
                        disabled={isInitializing}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          cameraEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Camera Preview */}
                  <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                    {cameraEnabled && getMediaStream() ? (
                      <video
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        ref={(video) => {
                          if (video && getMediaStream()) {
                            video.srcObject = getMediaStream();
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <CameraOff className="w-12 h-12 mx-auto mb-2" />
                          <p className="text-sm">Camera preview</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Microphone Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {micEnabled ? (
                        <Mic className="w-5 h-5 text-green-400" />
                      ) : (
                        <MicOff className="w-5 h-5 text-gray-400" />
                      )}
                      <span className="font-medium">Microphone</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${micEnabled ? 'text-green-400' : 'text-gray-400'}`}>
                        {micEnabled ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={toggleMicrophone}
                        className={`w-10 h-6 rounded-full transition-colors ${
                          micEnabled ? 'bg-green-600' : 'bg-gray-600'
                        }`}
                        disabled={isInitializing}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                          micEnabled ? 'translate-x-5' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  {/* Microphone Test */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Microphone Test</span>
                      <button
                        onClick={testMicrophoneFunction}
                        disabled={!micEnabled || micTestResult === 'testing'}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                      >
                        {micTestResult === 'testing' ? 'Testing...' : 'Test Mic'}
                      </button>
                    </div>
                    
                    {micTestResult === 'success' && (
                      <div className="flex items-center space-x-2 text-green-400">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Microphone working properly</span>
                      </div>
                    )}
                    
                    {micTestResult === 'failed' && (
                      <div className="flex items-center space-x-2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Microphone test failed</span>
                      </div>
                    )}
                    
                    {micTestResult === 'testing' && (
                      <div className="flex items-center space-x-2 text-blue-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                        <span className="text-sm">Speak into your microphone...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Media Error */}
              {mediaError && (
                <div className="mt-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-300 font-medium">Media Setup Error</p>
                      <p className="text-red-200 text-sm mt-1">{mediaError}</p>
                      <button
                        onClick={retryMediaSetup}
                        className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                        disabled={isInitializing}
                      >
                        {isInitializing ? 'Retrying...' : 'Retry Setup'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Permission Status */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-800 rounded-lg">
                  <div className={`text-sm font-medium ${
                    permissionStatus.camera === 'granted' ? 'text-green-400' :
                    permissionStatus.camera === 'denied' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    Camera: {permissionStatus.camera}
                  </div>
                </div>
                <div className="text-center p-3 bg-gray-800 rounded-lg">
                  <div className={`text-sm font-medium ${
                    permissionStatus.microphone === 'granted' ? 'text-green-400' :
                    permissionStatus.microphone === 'denied' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    Microphone: {permissionStatus.microphone}
                  </div>
                </div>
              </div>
            </div>

            {/* Interview Summary */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h3 className="text-xl font-semibold mb-4">Interview Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Position:</span>
                  <span className="font-medium">{formData.position || 'Not specified'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Type:</span>
                  <span className="font-medium capitalize">{formData.interviewType}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Duration:</span>
                  <span className="font-medium">{formData.duration} minutes</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Experience Level:</span>
                  <span className="font-medium capitalize">{formData.userProfile.experienceLevel || 'Not specified'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Resume:</span>
                  <span className="font-medium">
                    {formData.resume ? 'Uploaded' : 'Not uploaded'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Media Status:</span>
                  <span className={`font-medium ${isMediaReady() ? 'text-green-400' : 'text-red-400'}`}>
                    {isMediaReady() ? 'Ready' : 'Setup required'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={prevStep}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors"
              >
                Back
              </button>
              <button
                onClick={startInterview}
                disabled={isStarting || !formData.position.trim() || (!isMediaReady() && !mediaError)}
                className="flex items-center space-x-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors"
              >
                {isStarting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Starting Interview...</span>
                  </>
                ) : (
                  <>
                    <span>Start Interview</span>
                    <CheckCircle className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Media Test Modal */}
        {showMediaTest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 rounded-xl p-6 w-full max-w-md border border-gray-800">
              <h3 className="text-xl font-semibold text-white mb-4">Media Setup Required</h3>
              
              <div className="space-y-4">
                <p className="text-gray-400">
                  Camera and microphone access is required for the interview. Please ensure both are enabled.
                </p>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Camera</span>
                    <span className={`text-sm ${cameraEnabled ? 'text-green-400' : 'text-red-400'}`}>
                      {cameraEnabled ? '✓ Ready' : '✗ Not available'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Microphone</span>
                    <span className={`text-sm ${micEnabled ? 'text-green-400' : 'text-red-400'}`}>
                      {micEnabled ? '✓ Ready' : '✗ Not available'}
                    </span>
                  </div>
                </div>

                {mediaError && (
                  <div className="p-3 bg-red-900/30 border border-red-700 rounded-lg">
                    <p className="text-red-300 text-sm">{mediaError}</p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowMediaTest(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={retryMediaSetup}
                  disabled={isInitializing}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  {isInitializing ? 'Setting up...' : 'Retry Setup'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Help Section */}
        <div className="mt-12 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h4 className="text-lg font-semibold mb-4 text-gray-200">Tips for a Great Interview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-300 mb-2">Before Starting:</h5>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Ensure good lighting for your video</li>
                <li>• Find a quiet environment</li>
                <li>• Test your microphone and camera</li>
                <li>• Have your resume or notes ready</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-300 mb-2">During the Interview:</h5>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Speak clearly and at a normal pace</li>
                <li>• Provide specific examples from your experience</li>
                <li>• Take your time to think before answering</li>
                <li>• Maintain good eye contact with the camera</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}