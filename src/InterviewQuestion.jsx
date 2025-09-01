import { AlertCircle, CheckCircle, Loader2, Mic, Volume2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Mock API service for generating questions and analyzing responses
const InterviewService = {
  generateQuestion: async (interviewData, currentIndex, previousResponses) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const { position, interviewType, userProfile } = interviewData;
    const positionLower = position.toLowerCase();
    
    // Generate questions based on position and skills
    const getPositionSpecificQuestions = () => {
      if (positionLower.includes('frontend') || positionLower.includes('react') || positionLower.includes('ui')) {
        return [
          "How do you handle state management in React applications?",
          "Explain the difference between controlled and uncontrolled components in React.",
          "How would you optimize the performance of a React application?",
          "Describe your approach to responsive web design.",
          "How do you ensure cross-browser compatibility?",
          "What's your experience with CSS frameworks and preprocessors?"
        ];
      } else if (positionLower.includes('backend') || positionLower.includes('server') || positionLower.includes('api')) {
        return [
          "How do you design RESTful APIs?",
          "Explain the difference between SQL and NoSQL databases.",
          "How do you handle authentication and authorization in your applications?",
          "Describe your approach to database optimization.",
          "How do you ensure API security?",
          "What's your experience with microservices architecture?"
        ];
      } else if (positionLower.includes('fullstack') || positionLower.includes('full stack')) {
        return [
          "Walk me through how you would design a scalable web application.",
          "How do you handle state management across frontend and backend?",
          "Describe your approach to API design and integration.",
          "How do you ensure data consistency between frontend and backend?",
          "What's your experience with deployment and DevOps?",
          "How do you handle error handling across the full stack?"
        ];
      } else if (positionLower.includes('data') || positionLower.includes('analyst') || positionLower.includes('scientist')) {
        return [
          "How do you approach data cleaning and preprocessing?",
          "Explain your experience with data visualization tools.",
          "Describe a complex data analysis project you've worked on.",
          "How do you ensure data quality and accuracy?",
          "What's your approach to statistical analysis?",
          "How do you communicate technical findings to non-technical stakeholders?"
        ];
      } else {
        return [
          `What experience do you have that makes you suitable for a ${position} role?`,
          `Describe a challenging ${position} project you've worked on.`,
          `How do you stay updated with the latest trends in ${position.split(' ')[0]}?`,
          `What tools and technologies do you use in your ${position} work?`,
          `How do you approach problem-solving in ${position} scenarios?`,
          `What's your experience working in teams for ${position} projects?`
        ];
      }
    };

    // Skills-based questions
    const getSkillsBasedQuestions = () => {
      const skills = userProfile.skills.toLowerCase();
      const questions = [];
      
      if (skills.includes('javascript') || skills.includes('js')) {
        questions.push("Explain the concept of closures in JavaScript.");
        questions.push("How do you handle asynchronous operations in JavaScript?");
      }
      if (skills.includes('python')) {
        questions.push("What are the advantages of using Python for development?");
        questions.push("Explain the difference between lists and tuples in Python.");
      }
      if (skills.includes('java')) {
        questions.push("Explain the concept of inheritance in Java.");
        questions.push("What's the difference between abstract classes and interfaces in Java?");
      }
      if (skills.includes('sql') || skills.includes('database')) {
        questions.push("How would you optimize a slow-performing SQL query?");
        questions.push("Explain the different types of joins in SQL.");
      }
      if (skills.includes('aws') || skills.includes('cloud')) {
        questions.push("What's your experience with cloud deployment and scaling?");
        questions.push("How do you ensure security in cloud applications?");
      }
      
      return questions.length > 0 ? questions : getPositionSpecificQuestions();
    };

    const technicalQuestions = getSkillsBasedQuestions();
    
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
      timeAllocated: 300, // 5 minutes per question
      difficulty: currentIndex < 2 ? 'easy' : currentIndex < 4 ? 'medium' : 'hard'
    };
  },

  analyzeResponse: async (question, response, userProfile) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock analysis based on response content
    const wordCount = response.split(' ').length;
    const hasExamples = response.toLowerCase().includes('example') || response.toLowerCase().includes('project');
    const hasTechnicalTerms = /\b(algorithm|database|api|framework|library|method|function|class|interface|deployment|server|client|frontend|backend)\b/i.test(response);
    
    return {
      overallScore: Math.min(95, Math.max(40, wordCount * 2 + (hasExamples ? 20 : 0) + (hasTechnicalTerms ? 15 : 0))),
      scores: {
        clarity: Math.min(100, wordCount > 30 ? 80 + Math.random() * 20 : 60 + Math.random() * 20),
        relevance: Math.min(100, hasTechnicalTerms ? 75 + Math.random() * 25 : 60 + Math.random() * 25),
        depth: Math.min(100, hasExamples ? 70 + Math.random() * 30 : 50 + Math.random() * 30),
        confidence: Math.min(100, wordCount > 40 ? 75 + Math.random() * 25 : 60 + Math.random() * 25)
      },
      keyStrengths: [
        wordCount > 50 && "Comprehensive response",
        hasExamples && "Provided concrete examples",
        hasTechnicalTerms && question.type === 'technical' && "Used appropriate technical terminology",
        response.length > 200 && "Detailed explanation"
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
  
  // Response states
  const [response, setResponse] = useState('');
  
  // Analysis states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  
  // Timer states
  const [questionTimer, setQuestionTimer] = useState(0);
  
  // Audio recording states (mock)
  const [audioError, setAudioError] = useState(null);
  
  // Refs
  const questionTimerRef = useRef(null);
  const hasRecordedResponse = useRef(false);
  
  // Calculate max questions based on duration (matching the UI exactly)
  const getMaxQuestions = (duration) => {
    console.log(`🎯 getMaxQuestions: duration received = ${duration} (type: ${typeof duration})`);
    if (duration === 15) return 4;      // 15 min = 3-4 questions (use 4)
    if (duration === 30) return 6;      // 30 min = 5-6 questions (use 6) 
    if (duration === 45) return 8;      // 45 min = 7-8 questions (use 8)
    if (duration === 60) return 10;     // 60 min = 9-10 questions (use 10)
    console.log(`⚠️ getMaxQuestions: Using fallback (6) for duration: ${duration}`);
    return 4; // fallback to 4 instead of 6
  };
  
  const maxQuestions = getMaxQuestions(interviewData.duration);
  const isLastQuestion = currentQuestionIndex >= maxQuestions - 1;
  
  // Timer functions (defined before useEffect to avoid hoisting issues)
  const clearTimers = useCallback(() => {
    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  }, []);
  
  const startQuestionTimer = useCallback(() => {
    setQuestionTimer(0);
    questionTimerRef.current = setInterval(() => {
      setQuestionTimer(prev => prev + 1);
    }, 1000);
  }, []);
  
  // Debug logging for question tracking
  useEffect(() => {
    console.log(`🎯 Question Component State:`, {
      currentQuestionIndex,
      maxQuestions,
      isLastQuestion,
      duration: interviewData.duration,
      calculation: `${interviewData.duration} / 2.5 = ${interviewData.duration / 2.5}`
    });
  }, [currentQuestionIndex, maxQuestions, isLastQuestion, interviewData.duration]);
  
  // Generate question when component mounts or question index changes
  useEffect(() => {
    generateCurrentQuestion();
    return () => {
      clearTimers();
    };
  }, [currentQuestionIndex]);

  // Start question timer when question is loaded
  useEffect(() => {
    if (currentQuestion && !questionTimerRef.current) {
      startQuestionTimer();
    }
    return () => clearTimers();
  }, [currentQuestion]);

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
      onQuestionGenerated && onQuestionGenerated(question);
      
      // Speak the question automatically after a short delay
      setTimeout(() => {
        speakQuestion(question.text);
      }, 1000);
      
    } catch (error) {
      console.error('Failed to generate question:', error);
      setQuestionError('Failed to load question. Please try again.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Simple text-to-speech function
  const speakQuestion = (text) => {
    if ('speechSynthesis' in window) {
      try {
        // Stop any ongoing speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        
        // Use a nice voice if available
        const voices = speechSynthesis.getVoices();
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
        
        speechSynthesis.speak(utterance);
        console.log('🔊 Speaking question');
      } catch (error) {
        console.error('Speech error:', error);
      }
    }
  };

  // Function to replay the current question
  const replayQuestion = () => {
    if (currentQuestion) {
      speakQuestion(currentQuestion.text);
    }
  };
  
  const submitResponse = async () => {
    const userResponse = response.trim();
    
    if (userResponse.length === 0) {
      setAnalysisError('Please provide a response before submitting.');
      return;
    }
    
    // Prevent double submission
    if (isAnalyzing) {
      console.log('⚠️ Already analyzing, preventing double submission');
      return;
    }
    
    console.log(`🚀 SUBMITTING RESPONSE:`, {
      questionNumber: currentQuestionIndex + 1,
      maxQuestions,
      isLastQuestion,
      questionId: currentQuestion?.id,
      questionText: currentQuestion?.text?.substring(0, 50) + '...',
      responseLength: userResponse.length
    });
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    
    try {
      // Analyze the response
      const analysis = await InterviewService.analyzeResponse(currentQuestion, userResponse);
      
      // Record the response
      const responseData = {
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        userResponse,
        analysis,
        timeSpent: questionTimer,
        timestamp: new Date().toISOString(),
        questionIndex: currentQuestionIndex,
        questionNumber: currentQuestionIndex + 1
      };
      
      console.log(`📝 Recording response for question ${currentQuestionIndex + 1}:`, responseData);
      
      // Record the response first
      onResponseRecorded(responseData);
      
      // Clear the response for next question
      setResponse('');
      hasRecordedResponse.current = false;
      
      // Move to next question or end interview
      if (isLastQuestion) {
        console.log(`🏁 LAST QUESTION REACHED - Question ${currentQuestionIndex + 1} of ${maxQuestions} - ENDING INTERVIEW`);
        // Pass the response data directly to avoid race condition
        setTimeout(() => {
          onInterviewEnd(responseData);
        }, 100);
      } else {
        console.log(`➡️ Moving to next question: ${currentQuestionIndex + 2} of ${maxQuestions}`);
        // The parent component will handle moving to the next question
      }
    } catch (error) {
      console.error('Failed to submit response:', error);
      setAnalysisError('Failed to submit response. Please try again.');
    } finally {
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
      timestamp: new Date().toISOString(),
      skipped: true
    };
    
    clearTimers();
    onResponseRecorded(responseData);
    
    if (isLastQuestion) {
      setTimeout(() => {
        onInterviewEnd(responseData);
      }, 500);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (isLoadingQuestion) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-20">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-gray-400">Generating your question...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (questionError) {
    return (
      <div className="max-w-4xl mx-auto py-20">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-red-400">{questionError}</p>
          <button
            onClick={generateCurrentQuestion}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
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
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-white leading-relaxed mb-3">
                {currentQuestion?.text}
              </h2>
              <button
                onClick={replayQuestion}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600/50 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
              >
                <Volume2 className="w-4 h-4" />
                <span>🔊 Replay Question</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Response Section */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Your Response</h3>
        
        {/* Text Input */}
        <div className="space-y-4">
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your answer here..."
            className="w-full h-40 p-4 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base leading-relaxed"
            disabled={isAnalyzing}
          />
          
          {/* Record Audio Button */}
          <div className="flex justify-center">
            <button
              onClick={() => setAudioError('Network error, please type your answer.')}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              disabled={isAnalyzing}
            >
              <Mic className="w-4 h-4" />
              <span>Record Audio</span>
            </button>
          </div>
          
          {/* Audio Error Display */}
          {audioError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{audioError}</p>
            </div>
          )}
          
          <div className="flex justify-between items-center text-sm text-gray-400">
            <span>{response.length} characters</span>
            {response.length > 0 && (
              <span>{response.split(' ').filter(word => word.trim().length > 0).length} words</span>
            )}
          </div>
        </div>

        {/* Error Display */}
        {analysisError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{analysisError}</p>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={skipQuestion}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          disabled={isAnalyzing}
        >
          Skip Question
        </button>
        
        <div className="flex space-x-4">
          {!isLastQuestion ? (
            <button
              onClick={submitResponse}
              disabled={!response.trim() || isAnalyzing}
              className="flex items-center space-x-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>Next Question</span>
              )}
            </button>
          ) : (
            <button
              onClick={submitResponse}
              disabled={!response.trim() || isAnalyzing}
              className="flex items-center space-x-2 px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Finish Interview</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
