import { AlertCircle, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import InterviewQuestion from './InterviewQuestion';
import { useMedia } from './MediaContext';

// Utility function to format time in mm:ss
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function InterviewScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use MediaContext instead of getting mediaStream from navigation state
  const { getMediaStream, isMediaReady } = useMedia();

  // Extract interview data from navigation state with safe defaults
  const interviewData = useMemo(() => {
    const data = location.state || {};
    return {
      position: data.position || "Software Developer",
      interviewType: data.interviewType || "mixed",
      duration: data.duration || 30,
      userProfile: data.userProfile || {},
      resumeData: data.resumeData || null,
    };
  }, [location.state]);

  // Calculate initial timer (subtract 60 seconds buffer)
  const initialTimeSeconds = useMemo(() => {
    const bufferSeconds = 60;
    return Math.max(interviewData.duration * 60 - bufferSeconds, 0);
  }, [interviewData.duration]);

  const [timeLeft, setTimeLeft] = useState(initialTimeSeconds);
  const [mediaCheckComplete, setMediaCheckComplete] = useState(false);

  // States for questions and responses
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState([]); // Array of {question, response, analysis...}
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Video preview reference
  const videoRef = useRef(null);
  const interviewEndedRef = useRef(false);
  const redirectTimeoutRef = useRef(null);

  // Report configuration - memoized to prevent unnecessary re-renders
  const reportConfig = useMemo(() => ({
    position: interviewData.position,
    interviewType: interviewData.interviewType,
    duration: interviewData.duration,
    userProfile: interviewData.userProfile
  }), [interviewData.position, interviewData.interviewType, interviewData.duration, interviewData.userProfile]);

  // The max number of questions should align with InterviewQuestion
  const maxQuestions = 6;

  // Optionally aggregate the report here before navigation
  const buildReportData = useCallback(() => {
    // Compute overall score (average), aggregate strengths/weaknesses, etc.
    if (!responses.length) {
      console.warn('No responses found for report generation');
      return null;
    }

    const totalQuestions = responses.length;
    let totalClarity = 0, totalRelevance = 0, totalDepth = 0, totalConfidence = 0;
    const allStrengths = [];
    const allImprovements = [];
    const allRedFlags = [];
    const allStandouts = [];
    const sentiments = { positive: 0, neutral: 0, negative: 0 };

    responses.forEach(r => {
      if (r.analysis && r.analysis.scores) {
        totalClarity += r.analysis.scores.clarity || 0;
        totalRelevance += r.analysis.scores.relevance || 0;
        totalDepth += r.analysis.scores.depth || 0;
        totalConfidence += r.analysis.scores.confidence || 0;
        
        if (r.analysis.keyStrengths) allStrengths.push(...r.analysis.keyStrengths);
        if (r.analysis.improvementAreas) allImprovements.push(...r.analysis.improvementAreas);
        if (r.analysis.redFlags) allRedFlags.push(...r.analysis.redFlags);
        if (r.analysis.standoutPoints) allStandouts.push(...r.analysis.standoutPoints);
        if (r.analysis.sentiment) {
          sentiments[r.analysis.sentiment] = (sentiments[r.analysis.sentiment] || 0) + 1;
        }
      }
    });

    const overallScores = {
      clarity: Math.round(totalClarity / totalQuestions),
      relevance: Math.round(totalRelevance / totalQuestions),
      depth: Math.round(totalDepth / totalQuestions),
      confidence: Math.round(totalConfidence / totalQuestions),
    };
    
    const overallScore = Math.round(
      (overallScores.clarity + overallScores.relevance + overallScores.depth + overallScores.confidence) / 4
    );

    return {
      overallScore,
      overallScores,
      strengths: Array.from(new Set(allStrengths.filter(Boolean))).slice(0, 5),
      improvements: Array.from(new Set(allImprovements.filter(Boolean))).slice(0, 5),
      redFlags: Array.from(new Set(allRedFlags.filter(Boolean))),
      standouts: Array.from(new Set(allStandouts.filter(Boolean))),
      sentimentSummary: sentiments,
      perQuestion: responses,
      completedAt: new Date().toISOString(),
      interviewee: reportConfig.userProfile,
      position: reportConfig.position,
      interviewType: reportConfig.interviewType,
      totalQuestions,
      interviewDuration: reportConfig.duration,
    };
  }, [responses, reportConfig]);

  // Function to handle ending the interview
  const endInterview = useCallback(async () => {
    if (interviewEndedRef.current) {
      console.log('Interview already ended, ignoring duplicate call');
      return;
    }
    
    console.log('Ending interview...');
    interviewEndedRef.current = true;
    setInterviewEnded(true);
    
    try {
      const report = buildReportData();
      
      if (!report && responses.length === 0) {
        // Handle case where no responses were recorded
        console.warn('No responses recorded, creating minimal report');
        const minimalReport = {
          overallScore: 0,
          overallScores: { clarity: 0, relevance: 0, depth: 0, confidence: 0 },
          strengths: [],
          improvements: ['Complete more interview questions', 'Speak clearly into microphone'],
          redFlags: ['Interview ended prematurely'],
          standouts: [],
          sentimentSummary: { positive: 0, neutral: 0, negative: 1 },
          perQuestion: [],
          completedAt: new Date().toISOString(),
          interviewee: reportConfig.userProfile,
          position: reportConfig.position,
          interviewType: reportConfig.interviewType,
          totalQuestions: 0,
          interviewDuration: reportConfig.duration,
        };
        
        navigate('/results', {
          state: {
            report: minimalReport,
            responses: [],
            interviewData
          },
          replace: true
        });
        return;
      }

      navigate('/results', {
        state: {
          report,
          responses,
          interviewData
        },
        replace: true
      });
    } catch (error) {
      console.error('Error generating final report:', error);
      // Still navigate but with error state
      navigate('/results', {
        state: {
          error: 'Failed to generate report',
          responses,
          interviewData
        },
        replace: true
      });
    }
  }, [buildReportData, responses, reportConfig, navigate, interviewData]);

  // Attach camera stream to video element on mount with better error handling
  useEffect(() => {
    const setupVideo = async () => {
      try {
        const mediaStream = getMediaStream();
        if (videoRef.current && mediaStream) {
          // Clear any existing stream first
          if (videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
          }

          videoRef.current.srcObject = mediaStream;
          
          // Add event listeners for video
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch((e) => {
                console.warn('Video autoplay failed, this is normal:', e.message);
                setVideoError(false);
              });
            }
          };
          videoRef.current.onerror = (e) => {
            console.error('Video error:', e);
            setVideoError(true);
          };
        }
      } catch (error) {
        console.error('Error setting up video:', error);
        setVideoError(true);
      }
    };

    if (isMediaReady()) {
      setupVideo();
    }
  }, [getMediaStream, isMediaReady]);

  // FIXED: Better media readiness check with timeout
  useEffect(() => {
    let timeoutId;
    
    const checkMediaReadiness = () => {
      if (isMediaReady()) {
        console.log('Media is ready, continuing with interview...');
        setMediaCheckComplete(true);
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      } else {
        console.log('Media not ready yet, waiting...');
        // Set a timeout to redirect if media isn't ready after a reasonable time
        timeoutId = setTimeout(() => {
          console.log('Media setup timeout, redirecting to setup...');
          navigate('/setup', { 
            state: interviewData,
            replace: true 
          });
        }, 5000); // 5 second timeout
      }
    };

    checkMediaReadiness();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isMediaReady, navigate, interviewData]);

  // Countdown timer effect
  useEffect(() => {
    if (interviewEnded || !mediaCheckComplete) return;   // Don't start timer until media is ready
    
    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [interviewEnded, mediaCheckComplete]);

  // When time expires, end the interview
  useEffect(() => {
    if (timeLeft === 0 && !interviewEnded && mediaCheckComplete) {
      console.log('Time expired, ending interview');
      endInterview();
    }
  }, [timeLeft, interviewEnded, mediaCheckComplete, endInterview]);

  // Handles each question's receive analysis (from child component)
  const handleResponseRecorded = useCallback((responseData) => {
    console.log('Response recorded:', responseData);
    setResponses(prev => [...prev, responseData]);
    setCurrentQuestionIndex(prev => prev + 1);
  }, []);

  // On last question, child will call this (passed as prop)
  const handleInterviewEnd = useCallback(() => {
    console.log('Interview end triggered by child component');
    endInterview();
  }, [endInterview]);

  // Handle "Finish Now" button
  const finishNow = useCallback(() => {
    console.log('Finish now button clicked');
    endInterview();
  }, [endInterview]);

  // Show loading while checking media readiness
  if (!mediaCheckComplete) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Preparing interview...</p>
          <p className="text-gray-500 text-sm mt-2">Setting up media and initializing questions</p>
        </div>
      </div>
    );
  }

  const mediaStream = getMediaStream();

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header / Timer */}
      <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-900 px-6 py-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="text-gray-400 hover:text-white transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="text-gray-100 text-xl font-semibold">{interviewData.position}</div>
            <div className="text-gray-400 text-sm">{interviewData.interviewType.charAt(0).toUpperCase() + interviewData.interviewType.slice(1)} Interview</div>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4 sm:mt-0">
          <div className="flex items-center gap-1 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="font-semibold">{currentQuestionIndex}/{maxQuestions}</span>
          </div>
          <div className={`flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-lg text-xs font-mono ${
            timeLeft < 300 ? 'text-red-400' : 'text-blue-400'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>

      {/* Video Preview */}
      {mediaStream && (
        <div className="bg-black flex justify-center py-4 border-b border-gray-800">
          {videoError ? (
            <div className="w-72 h-44 bg-gray-800 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Video preview unavailable</p>
                <p className="text-xs">Audio recording still works</p>
              </div>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              className="rounded-lg shadow-lg w-72 h-44 object-cover bg-gray-800" 
              autoPlay 
              playsInline 
              muted
              onError={() => setVideoError(true)}
            />
          )}
        </div>
      )}

      {/* Interview Question Area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-gray-950">
        {!interviewEnded && currentQuestionIndex < maxQuestions && (
          <div className="w-full max-w-4xl">
            <InterviewQuestion
              interviewData={interviewData}
              currentQuestionIndex={currentQuestionIndex}
              responses={responses}
              onQuestionGenerated={(questionData) => {
                console.log('Question generated:', questionData);
              }}
              onResponseRecorded={handleResponseRecorded}
              onInterviewEnd={handleInterviewEnd}
            />
          </div>
        )}
        {(interviewEnded || currentQuestionIndex >= maxQuestions) && (
          <div className="text-center text-gray-300">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <p className="mb-2 text-2xl font-bold">Interview Completed!</p>
            <p className="mb-6 text-gray-400">
              {responses.length > 0 
                ? `You answered ${responses.length} question${responses.length !== 1 ? 's' : ''}`
                : 'Thank you for participating'
              }
            </p>
            <button
              onClick={endInterview}
              className="bg-blue-600 px-8 py-3 rounded-lg text-white font-semibold shadow hover:bg-blue-700 transition-colors"
            >
              View Results
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      {!interviewEnded && (
        <div className="flex justify-between items-center bg-gray-900 py-4 px-6 border-t border-gray-800">
          <div className="text-gray-400 text-sm">
            {currentQuestionIndex > 0 && (
              <span>Progress: {Math.round((currentQuestionIndex / maxQuestions) * 100)}%</span>
            )}
          </div>
          <button
            onClick={finishNow}
            className="flex items-center gap-2 px-5 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg shadow transition-colors"
            disabled={interviewEnded}
          >
            <CheckCircle className="w-4 h-4" />
            Finish Interview
          </button>
        </div>
      )}

      {/* Loading Overlay */}
      {interviewEnded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
            <p className="text-white">Generating your results...</p>
          </div>
        </div>
      )}
    </div>
  );
}