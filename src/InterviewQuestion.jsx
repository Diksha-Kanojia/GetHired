import { AlertCircle, CheckCircle, Loader2, Mic, MicOff, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMedia } from './MediaContext';

// Mock API service for generating questions and analyzing responses
const InterviewService = {
  generateQuestion: async (interviewData, currentIndex, previousResponses) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { position, interviewType, userProfile } = interviewData;
    
    // Sample questions based on type and index
    const technicalQuestions = [
      "Walk me through how you would design a scalable web application.",
      "How do you handle state management in React applications?", 
      "Explain the difference between SQL and NoSQL databases.",
      "How would you optimize the performance of a slow-loading website?",
      "Describe your approach to testing and debugging code.",
      "What's your experience with cloud services and deployment?"
    ];
    
    const behavioralQuestions = [
      "Tell me about a challenging project you worked on and how you overcame obstacles.",
      "Describe a time when you had to work with a difficult team member.",
      "How do you prioritize tasks when you have multiple deadlines?",
      "Tell me about a mistake you made and what you learned from it.",
      "Describe a situation where you had to learn something completely new.",
      "How do you handle feedback and criticism?"
    ];
    
    const mixedQuestions = [...technicalQuestions, ...behavioralQuestions];
    
    let questionPool;
    if (interviewType === 'technical') {
      questionPool = technicalQuestions;
    } else if (interviewType === 'behavioral') {
      questionPool = behavioralQuestions;
    } else {
      questionPool = mixedQuestions;
    }
    
    const question = questionPool[currentIndex % questionPool.length];
    
    return {
      id: `q_${currentIndex + 1}`,
      text: question,
      type: interviewType === 'mixed' ? 
        (currentIndex % 2 === 0 ? 'technical' : 'behavioral') : 
        interviewType,
      timeLimit: 120, // 2 minutes per question
      difficulty: userProfile.experienceLevel === 'entry' ? 'easy' : 
                 userProfile.experienceLevel === 'senior' ? 'hard' : 'medium'
    };
  },

  analyzeResponse: async (question, response, userProfile) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock analysis based on response length and content
    const wordCount = response.trim().split(/\s+/).length;
    const hasExamples = /example|experience|project|time when/i.test(response);
    const hasTechnicalTerms = /react|javascript|database|api|framework|algorithm/i.test(response);
    
    // Calculate scores based on various factors
    const clarity = Math.min(100, Math.max(20, wordCount * 2 + (hasExamples ? 20 : 0)));
    const relevance = Math.min(100, Math.max(30, 
      (question.type === 'technical' && hasTechnicalTerms ? 80 : 50) + 
      (hasExamples ? 20 : 0)
    ));
    const depth = Math.min(100, Math.max(20, wordCount * 1.5 + (hasExamples ? 30 : 0)));
    const confidence = Math.min(100, Math.max(40, 60 + Math.random() * 40));
    
    return {
      scores: { clarity, relevance, depth, confidence },
      overallScore: Math.round((clarity + relevance + depth + confidence) / 4),
      keyStrengths: [
        hasExamples && "Provided concrete examples",
        hasTechnicalTerms && "Used relevant technical terminology",
        wordCount > 50 && "Comprehensive response",
        "Clear communication"
      ].filter(Boolean),
      improvementAreas: [
        wordCount < 30 && "Provide more detailed responses",
        !hasExamples && "Include specific examples from experience",
        !hasTechnicalTerms && question.type === 'technical' && "Use more technical terminology"
      ].filter(Boolean),
      sentiment: wordCount > 40 ? 'positive' : wordCount > 20 ? 'neutral' : 'negative',
      redFlags: wordCount < 10 ? ["Very brief response"] : [],
      standoutPoints: hasExamples && wordCount > 60 ? ["Well-structured response with examples"] : []
    };
  }
};

// Speech Services
const SpeechServices = {
  recognition: null,
  isListening: false,
  
  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;
    }
  },
  
  start(onResult, onError) {
    if (!this.recognition) {
      onError('Speech recognition not supported');
      return;
    }
    
    if (this.isListening) return;
    
    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
      
      onResult(finalTranscript.trim(), interimTranscript.trim());
    };
    
    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      onError(`Speech recognition error: ${event.error}`);
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
    };
    
    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      onError('Failed to start speech recognition');
    }
  },
  
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  },
  
  speak(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      // Set voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Female') || voice.name.includes('Google'))
      );
      if (preferredVoice) utterance.voice = preferredVoice;
      
      window.speechSynthesis.speak(utterance);
      return utterance;
    }
    return null;
  }
};

export default function InterviewQuestion({
  interviewData,
  currentQuestionIndex,
  responses,
  onQuestionGenerated,
  onResponseRecorded,
  onInterviewEnd
}) {
  // States
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [questionError, setQuestionError] = useState(null);
  
  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [recordingError, setRecordingError] = useState(null);
  
  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  // Timer states
  const [questionTimer, setQuestionTimer] = useState(0);
  const [recordingTimer, setRecordingTimer] = useState(0);
  
  // Refs
  const questionTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const hasRecordedResponse = useRef(false);
  const speechInitialized = useRef(false);
  
  // Media context
  const { getMediaStream, micEnabled } = useMedia();
  
  // Maximum questions limit
  const maxQuestions = 6;
  const isLastQuestion = currentQuestionIndex >= maxQuestions - 1;
  
  // Initialize speech services
  useEffect(() => {
    if (!speechInitialized.current) {
      SpeechServices.init();
      speechInitialized.current = true;
    }
  }, []);
  
  // Generate question when component mounts or question index changes
  useEffect(() => {
    generateCurrentQuestion();
    return () => {
      clearTimers();
      SpeechServices.stop();
    };
  }, [currentQuestionIndex]);
  
  // Start question timer when question is loaded
  useEffect(() => {
    if (currentQuestion && !questionTimerRef.current) {
      startQuestionTimer();
    }
    return () => clearTimers();
  }, [currentQuestion]);
  
  const clearTimers = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);
  
  const startQuestionTimer = useCallback(() => {
    setQuestionTimer(0);
    questionTimerRef.current = setInterval(() => {
      setQuestionTimer(prev => prev + 1);
    }, 1000);
  }, []);
  
  const startRecordingTimer = useCallback(() => {
    setRecordingTimer(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingTimer(prev => prev + 1);
    }, 1000);
  }, []);
  
  const stopRecordingTimer = useCallback(() => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }, []);
  
  const generateCurrentQuestion = async () => {
    setIsLoadingQuestion(true);
    setQuestionError(null);
    setCurrentQuestion(null);
    
    try {
      const question = await InterviewService.generateQuestion(
        interviewData,
        currentQuestionIndex,
        responses
      );
      
      setCurrentQuestion(question);
      onQuestionGenerated?.(question);
      
      // Read question aloud
      setTimeout(() => {
        SpeechServices.speak(question.text);
      }, 500);
      
    } catch (error) {
      console.error('Failed to generate question:', error);
      setQuestionError('Failed to load question. Please try again.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };
  
  const startRecording = useCallback(() => {
    if (!micEnabled) {
      setRecordingError('Microphone is not available');
      return;
    }
    
    setRecordingError(null);
    setFinalTranscript('');
    setInterimTranscript('');
    setIsRecording(true);
    startRecordingTimer();
    
    SpeechServices.start(
      (final, interim) => {
        if (final) {
          setFinalTranscript(prev => prev + ' ' + final);
        }
        setInterimTranscript(interim);
      },
      (error) => {
        setRecordingError(error);
        stopRecording();
      }
    );
  }, [micEnabled, startRecordingTimer]);
  
  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    
    SpeechServices.stop();
    setIsRecording(false);
    setInterimTranscript('');
    stopRecordingTimer();
    
    // Mark that user has provided a response
    const fullResponse = finalTranscript.trim();
    if (fullResponse.length > 0) {
      hasRecordedResponse.current = true;
    }
  }, [isRecording, finalTranscript, stopRecordingTimer]);
  
  const submitResponse = async () => {
    const response = finalTranscript.trim();
    
    if (response.length === 0) {
      setRecordingError('Please provide a response before submitting.');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    clearTimers();
    
    try {
      const analysis = await InterviewService.analyzeResponse(
        currentQuestion,
        response,
        interviewData.userProfile
      );
      
      const responseData = {
        questionId: currentQuestion.id,
        question: currentQuestion.text,
        response,
        analysis,
        questionIndex: currentQuestionIndex,
        timeSpent: questionTimer,
        recordingTime: recordingTimer,
        timestamp: new Date().toISOString()
      };
      
      // Call parent callback
      onResponseRecorded(responseData);
      
      // Check if this is the last question
      if (isLastQuestion) {
        setTimeout(() => {
          onInterviewEnd();
        }, 1000);
      }
      
    } catch (error) {
      console.error('Failed to analyze response:', error);
      setAnalysisError('Failed to analyze response. Please try again.');
      setIsAnalyzing(false);
    }
  };
  
  const skipQuestion = () => {
    const responseData = {
      questionId: currentQuestion?.id,
      question: currentQuestion?.text,
      response: '',
      analysis: {
        scores: { clarity: 0, relevance: 0, depth: 0, confidence: 0 },
        overallScore: 0,
        keyStrengths: [],
        improvementAreas: ['Question was skipped'],
        sentiment: 'neutral',
        redFlags: ['No response provided'],
        standoutPoints: []
      },
      questionIndex: currentQuestionIndex,
      timeSpent: questionTimer,
      recordingTime: 0,
      timestamp: new Date().toISOString(),
      skipped: true
    };
    
    clearTimers();
    onResponseRecorded(responseData);
    
    if (isLastQuestion) {
      setTimeout(() => {
        onInterviewEnd();
      }, 500);
    }
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Loading state
  if (isLoadingQuestion) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
          <p className="text-gray-300">Generating your question...</p>
          <p className="text-gray-500 text-sm">
            Question {currentQuestionIndex + 1} of {maxQuestions}
          </p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (questionError) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-red-300 font-medium">Error Loading Question</p>
          <p className="text-gray-400 text-sm max-w-md">{questionError}</p>
          <button
            onClick={generateCurrentQuestion}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Analysis loading state
  if (isAnalyzing) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-green-400" />
          <p className="text-gray-300">Analyzing your response...</p>
          <p className="text-gray-500 text-sm">This will take a moment</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Question Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
          <span>Question {currentQuestionIndex + 1} of {maxQuestions}</span>
          <span>•</span>
          <span className="capitalize">{currentQuestion?.type || 'Mixed'}</span>
          <span>•</span>
          <span>Time: {formatTime(questionTimer)}</span>
        </div>
        
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-6 rounded-xl border border-gray-700">
          <div className="flex items-start space-x-3">
            <Volume2 className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
            <h2 className="text-2xl font-semibold text-white leading-relaxed">
              {currentQuestion?.text}
            </h2>
          </div>
        </div>
      </div>
      
      {/* Recording Section */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <div className="space-y-6">
          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={!micEnabled}
                className="flex items-center space-x-3 px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-colors shadow-lg"
              >
                <Mic className="w-6 h-6" />
                <span>Start Recording</span>
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center space-x-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
              >
                <MicOff className="w-6 h-6" />
                <span>Stop Recording</span>
              </button>
            )}
            
            {isRecording && (
              <div className="flex items-center space-x-2 text-red-400">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                <span className="font-mono text-sm">{formatTime(recordingTimer)}</span>
              </div>
            )}
          </div>
          
          {/* Recording Status */}
          {!micEnabled && (
            <div className="flex items-center justify-center space-x-2 text-yellow-400 bg-yellow-400/10 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">Microphone not available</span>
            </div>
          )}
          
          {recordingError && (
            <div className="flex items-center justify-center space-x-2 text-red-400 bg-red-400/10 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{recordingError}</span>
            </div>
          )}
          
          {analysisError && (
            <div className="flex items-center justify-center space-x-2 text-red-400 bg-red-400/10 p-3 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{analysisError}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Transcript Display */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Your Response</h3>
        <div className="min-h-32 p-4 bg-gray-800 rounded-lg border border-gray-700">
          {finalTranscript || interimTranscript ? (
            <div className="space-y-2">
              {finalTranscript && (
                <p className="text-gray-200 leading-relaxed">{finalTranscript}</p>
              )}
              {interimTranscript && (
                <p className="text-gray-400 italic">{interimTranscript}</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 italic">
              {isRecording 
                ? "Listening... Start speaking now." 
                : "Your response will appear here when you start recording."
              }
            </p>
          )}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={skipQuestion}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Skip Question
        </button>
        
        <div className="flex space-x-4">
          {!isLastQuestion ? (
            <button
              onClick={submitResponse}
              disabled={!finalTranscript.trim() || isRecording}
              className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              <span>Next Question</span>
            </button>
          ) : (
            <button
              onClick={submitResponse}
              disabled={!finalTranscript.trim() || isRecording}
              className="flex items-center space-x-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Finish Interview</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Help Text */}
      <div className="text-center text-gray-500 text-sm">
        <p>Take your time to think before answering. Provide specific examples from your experience when possible.</p>
      </div>
    </div>
  );
}