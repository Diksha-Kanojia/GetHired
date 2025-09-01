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
    const extractedData = {
      position: data.position || "Software Developer",
      interviewType: data.interviewType || "mixed",
      duration: data.duration || 30,
      userProfile: data.userProfile || {},
      resumeData: data.resumeData || null,
    };
    
    console.log('🔍 INTERVIEW DATA RECEIVED:', {
      originalDuration: data.duration,
      finalDuration: extractedData.duration,
      durationType: typeof extractedData.duration,
      position: extractedData.position,
      interviewType: extractedData.interviewType
    });
    
    return extractedData;
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

  // Calculate max questions based on duration (same logic as InterviewQuestion.jsx)
  const getMaxQuestions = (duration) => {
    console.log(`🎯 Interview.jsx getMaxQuestions: duration = ${duration} (type: ${typeof duration})`);
    if (duration === 15) return 4;      // 15 min = 3-4 questions (use 4)
    if (duration === 30) return 6;      // 30 min = 5-6 questions (use 6) 
    if (duration === 45) return 8;      // 45 min = 7-8 questions (use 8)
    if (duration === 60) return 10;     // 60 min = 9-10 questions (use 10)
    console.log(`⚠️ Interview.jsx getMaxQuestions: Using fallback (4) for duration: ${duration}`);
    return 4; // fallback to 4 instead of 6
  };
  
  const maxQuestions = getMaxQuestions(interviewData.duration);
  console.log(`📋 INTERVIEW CONFIG: Duration=${interviewData.duration}min, MaxQuestions=${maxQuestions}`);

  // Optionally aggregate the report here before navigation
  const buildReportData = useCallback(() => {
    console.log(`📊 BUILD REPORT: Starting with ${responses.length} responses:`, responses);
    
    // Compute overall score (average), aggregate strengths/weaknesses, etc.
    if (!responses.length) {
      console.warn('❌ BUILD REPORT: No responses found for report generation');
      return null;
    }

    const totalQuestions = responses.length;
    console.log(`📈 BUILD REPORT: Total questions counted: ${totalQuestions}`);
    
    let totalClarity = 0, totalRelevance = 0, totalDepth = 0, totalConfidence = 0;
    const allStrengths = [];
    const allImprovements = [];
    const allRedFlags = [];
    const allStandouts = [];
    const sentiments = { positive: 0, neutral: 0, negative: 0 };

    responses.forEach((r, index) => {
      console.log(`🔍 BUILD REPORT: Processing response ${index + 1}:`, {
        questionNumber: r.questionNumber || r.questionIndex + 1,
        questionId: r.questionId,
        hasAnalysis: !!r.analysis,
        hasScores: !!(r.analysis && r.analysis.scores)
      });
      
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

    const finalReport = {
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
    
    console.log(`✅ BUILD REPORT: Final report generated:`, {
      totalQuestions: finalReport.totalQuestions,
      overallScore: finalReport.overallScore,
      responsesCount: finalReport.perQuestion.length
    });
    
    return finalReport;
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

      // Save interview results to localStorage for dashboard
      const interviewResult = {
        id: Date.now(),
        position: interviewData.position,
        type: interviewData.interviewType,
        date: new Date().toISOString().split('T')[0],
        duration: interviewData.duration,
        score: report.overallScore,
        status: 'Completed',
        totalQuestions: report.totalQuestions,
        responses: responses,
        report: report
      };
      
      // Get existing results and add the new one
      const existingResults = JSON.parse(localStorage.getItem('interview_results') || '[]');
      existingResults.unshift(interviewResult); // Add to beginning (newest first)
      localStorage.setItem('interview_results', JSON.stringify(existingResults));
      
      console.log('💾 SAVED INTERVIEW RESULT:', {
        id: interviewResult.id,
        totalQuestions: interviewResult.totalQuestions,
        responsesCount: interviewResult.responses.length,
        score: interviewResult.score,
        status: interviewResult.status
      });

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

  // Function to handle ending interview with a specific set of responses
  const endInterviewWithResponses = useCallback(async (allResponses) => {
    if (interviewEndedRef.current) {
      console.log('Interview already ended, ignoring duplicate call');
      return;
    }
    
    console.log('Ending interview with provided responses...');
    console.log(`📊 ENDING WITH RESPONSES: ${allResponses.length} total responses`);
    interviewEndedRef.current = true;
    setInterviewEnded(true);
    
    try {
      // Build report with the provided responses instead of state
      const buildReportWithResponses = (responseList) => {
        console.log(`📊 BUILD REPORT WITH RESPONSES: Starting with ${responseList.length} responses:`, responseList);
        
        if (!responseList.length) {
          console.warn('❌ BUILD REPORT WITH RESPONSES: No responses found for report generation');
          return null;
        }

        const totalQuestions = responseList.length;
        console.log(`📈 BUILD REPORT WITH RESPONSES: Total questions counted: ${totalQuestions}`);
        
        let totalClarity = 0, totalRelevance = 0, totalDepth = 0, totalConfidence = 0;
        const allStrengths = [];
        const allImprovements = [];
        const allRedFlags = [];
        const allStandouts = [];
        const sentiments = { positive: 0, neutral: 0, negative: 0 };

        responseList.forEach((r, index) => {
          console.log(`🔍 BUILD REPORT WITH RESPONSES: Processing response ${index + 1}:`, {
            questionNumber: r.questionNumber || r.questionIndex + 1,
            questionId: r.questionId,
            hasAnalysis: !!r.analysis,
            hasScores: !!(r.analysis && r.analysis.scores)
          });
          
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

        const finalReport = {
          overallScore,
          overallScores,
          strengths: Array.from(new Set(allStrengths.filter(Boolean))).slice(0, 5),
          improvements: Array.from(new Set(allImprovements.filter(Boolean))).slice(0, 5),
          redFlags: Array.from(new Set(allRedFlags.filter(Boolean))),
          standouts: Array.from(new Set(allStandouts.filter(Boolean))),
          sentimentSummary: sentiments,
          perQuestion: responseList,
          completedAt: new Date().toISOString(),
          interviewee: reportConfig.userProfile,
          position: reportConfig.position,
          interviewType: reportConfig.interviewType,
          totalQuestions,
          interviewDuration: reportConfig.duration,
        };
        
        console.log(`✅ BUILD REPORT WITH RESPONSES: Final report generated:`, {
          totalQuestions: finalReport.totalQuestions,
          overallScore: finalReport.overallScore,
          responsesCount: finalReport.perQuestion.length
        });
        
        return finalReport;
      };
      
      const report = buildReportWithResponses(allResponses);
      
      if (!report) {
        console.warn('No report generated, creating minimal report');
        const minimalReport = {
          overallScore: 0,
          overallScores: { clarity: 0, relevance: 0, depth: 0, confidence: 0 },
          strengths: [],
          improvements: ['Complete more interview questions'],
          redFlags: ['Interview ended prematurely'],
          standouts: [],
          sentimentSummary: { positive: 0, neutral: 0, negative: 1 },
          perQuestion: allResponses,
          completedAt: new Date().toISOString(),
          interviewee: reportConfig.userProfile,
          position: reportConfig.position,
          interviewType: reportConfig.interviewType,
          totalQuestions: allResponses.length,
          interviewDuration: reportConfig.duration,
        };
        
        navigate('/results', {
          state: {
            report: minimalReport,
            responses: allResponses,
            interviewData
          },
          replace: true
        });
        return;
      }

      // Save interview results to localStorage for dashboard
      const interviewResult = {
        id: Date.now(),
        position: interviewData.position,
        type: interviewData.interviewType,
        date: new Date().toISOString().split('T')[0],
        duration: interviewData.duration,
        score: report.overallScore,
        status: 'Completed',
        totalQuestions: report.totalQuestions,
        responses: allResponses,
        report: report
      };
      
      // Get existing results and add the new one
      const existingResults = JSON.parse(localStorage.getItem('interview_results') || '[]');
      existingResults.unshift(interviewResult); // Add to beginning (newest first)
      localStorage.setItem('interview_results', JSON.stringify(existingResults));
      
      console.log('💾 SAVED INTERVIEW RESULT WITH RESPONSES:', {
        id: interviewResult.id,
        totalQuestions: interviewResult.totalQuestions,
        responsesCount: interviewResult.responses.length,
        score: interviewResult.score,
        status: interviewResult.status
      });

      navigate('/results', {
        state: {
          report,
          responses: allResponses,
          interviewData
        },
        replace: true
      });
    } catch (error) {
      console.error('Error generating final report with responses:', error);
      // Still navigate but with error state
      navigate('/results', {
        state: {
          error: 'Failed to generate report',
          responses: allResponses,
          interviewData
        },
        replace: true
      });
    }
  }, [reportConfig, navigate, interviewData]);

  // Attach camera stream to video element on mount with better error handling
  useEffect(() => {
    const setupVideo = async () => {
      try {
        const mediaStream = getMediaStream();
        console.log('Setting up video with stream:', mediaStream);
        
        if (videoRef.current && mediaStream && mediaStream.active) {
          // Clear any existing stream first
          if (videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
          }

          // Set the stream
          videoRef.current.srcObject = mediaStream;
          
          // Add event listeners for video with better error handling
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, attempting to play...');
            if (videoRef.current) {
              videoRef.current.play().then(() => {
                console.log('Video playing successfully');
                setVideoError(false);
              }).catch((e) => {
                console.warn('Video autoplay failed:', e.message);
                // Try to play manually after a short delay
                setTimeout(() => {
                  if (videoRef.current) {
                    videoRef.current.play().catch(() => {
                      console.warn('Manual video play also failed');
                    });
                  }
                }, 100);
              });
            }
          };
          
          videoRef.current.onerror = (e) => {
            console.error('Video element error:', e);
            setVideoError(true);
          };

          // Force load if needed
          if (videoRef.current.readyState === 0) {
            videoRef.current.load();
          }
        } else {
          console.warn('Video setup skipped - missing requirements:', {
            hasVideoRef: !!videoRef.current,
            hasMediaStream: !!mediaStream,
            isStreamActive: mediaStream?.active
          });
        }
      } catch (error) {
        console.error('Error setting up video:', error);
        setVideoError(true);
      }
    };

    // Add a small delay to ensure video element is mounted
    const timeoutId = setTimeout(() => {
      if (isMediaReady()) {
        setupVideo();
      }
    }, 100);

    return () => clearTimeout(timeoutId);
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
    console.log(`📥 PARENT: Response recorded for question ${responseData.questionNumber}:`, responseData);
    console.log(`📊 PARENT: Current responses count before adding:`, responses.length);
    
    setResponses(prev => {
      const newResponses = [...prev, responseData];
      console.log(`📊 PARENT: New responses count after adding:`, newResponses.length);
      console.log(`📋 PARENT: All responses so far:`, newResponses.map(r => ({
        questionNumber: r.questionNumber || r.questionIndex + 1,
        questionId: r.questionId,
        questionText: r.questionText?.substring(0, 50) + '...'
      })));
      return newResponses;
    });
    
    setCurrentQuestionIndex(prev => {
      const newIndex = prev + 1;
      console.log(`🔢 PARENT: Moving from question index ${prev} to ${newIndex}`);
      return newIndex;
    });
  }, [responses.length]);

  // On last question, child will call this (passed as prop)
  const handleInterviewEnd = useCallback((finalResponse = null) => {
    console.log('🏁 INTERVIEW END: Triggered by child component');
    console.log(`🏁 INTERVIEW END: Current responses count: ${responses.length}`);
    console.log(`🏁 INTERVIEW END: Final response provided:`, !!finalResponse);
    console.log(`🏁 INTERVIEW END: All responses:`, responses);
    
    if (finalResponse) {
      console.log('🏁 INTERVIEW END: Adding final response before ending');
      // Add the final response to current responses before ending
      const allResponses = [...responses, finalResponse];
      console.log(`🏁 INTERVIEW END: Total responses including final: ${allResponses.length}`);
      endInterviewWithResponses(allResponses);
    } else {
      endInterview();
    }
  }, [responses, endInterview, endInterviewWithResponses]);

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
          {/* Debug info */}
          <div className="mt-4 text-xs text-gray-600">
            <p>Media Ready: {isMediaReady() ? 'Yes' : 'No'}</p>
            <p>Stream Available: {getMediaStream() ? 'Yes' : 'No'}</p>
          </div>
        </div>
      </div>
    );
  }

  const mediaStream = getMediaStream();
  console.log('Render - Media stream available:', !!mediaStream, mediaStream?.active);

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
                <button 
                  onClick={() => {
                    setVideoError(false);
                    // Retry video setup
                    if (videoRef.current && mediaStream) {
                      videoRef.current.srcObject = mediaStream;
                      videoRef.current.play().catch(() => setVideoError(true));
                    }
                  }}
                  className="mt-2 px-3 py-1 bg-blue-600 text-xs rounded hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              className="rounded-lg shadow-lg w-72 h-44 object-cover bg-gray-800" 
              autoPlay 
              playsInline 
              muted
              onError={(e) => {
                console.error('Video element error event:', e);
                setVideoError(true);
              }}
              onCanPlay={() => {
                console.log('Video can play');
                setVideoError(false);
              }}
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
      {!interviewEnded && currentQuestionIndex < maxQuestions - 1 && (
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