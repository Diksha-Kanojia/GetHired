import { ArrowLeft, CheckCircle, Download, Share2, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Results() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  
  // Extract data from navigation state
  const { report, responses, interviewData, error } = location.state || {};

  useEffect(() => {
    // Simulate loading time for better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Redirect if no data
  useEffect(() => {
    if (!isLoading && !report && !error) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, report, error, navigate]);

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-blue-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBackground = (score) => {
    if (score >= 90) return 'bg-green-500';
    if (score >= 75) return 'bg-blue-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const downloadReport = () => {
    if (!report) return;
    
    const reportText = `
Interview Report - ${report.position}
=====================================
Overall Score: ${report.overallScore}%
Date: ${new Date(report.completedAt).toLocaleDateString()}

Scores Breakdown:
- Clarity: ${report.overallScores?.clarity || 0}%
- Relevance: ${report.overallScores?.relevance || 0}%
- Depth: ${report.overallScores?.depth || 0}%
- Confidence: ${report.overallScores?.confidence || 0}%

Strengths:
${report.strengths?.map(strength => `- ${strength}`).join('\n') || 'None recorded'}

Areas for Improvement:
${report.improvements?.map(improvement => `- ${improvement}`).join('\n') || 'None recorded'}

Questions & Responses:
${report.perQuestion?.map((q, index) => `
Q${index + 1}: ${q.question}
Response: ${q.response}
Score: ${q.analysis?.overallScore || 0}%
`).join('\n') || 'No questions recorded'}
    `;
    
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-report-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Analyzing Your Performance</h2>
          <p className="text-gray-400">Generating your personalized interview report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 mb-6">
            <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Results</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">No Results Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-6xl mx-auto px-6 py-4">
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
                <h1 className="text-2xl font-bold">Interview Results</h1>
                <p className="text-gray-400">{report.position} • {new Date(report.completedAt).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={downloadReport}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Overall Score */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-8 border border-gray-700">
            <div className="text-center">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-400 mr-3" />
                <h2 className="text-3xl font-bold">Interview Complete!</h2>
              </div>
              
              <div className="mb-6">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(report.overallScore)}`}>
                  {report.overallScore}%
                </div>
                <p className="text-gray-400 text-lg">Overall Performance Score</p>
              </div>
              
              <div className="w-full bg-gray-800 rounded-full h-3 mb-4">
                <div 
                  className={`h-3 rounded-full ${getScoreBackground(report.overallScore)} transition-all duration-1000 ease-out`}
                  style={{ width: `${report.overallScore}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Object.entries(report.overallScores || {}).map(([key, score]) => (
            <div key={key} className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-2 ${getScoreColor(score)}`}>
                  {score}%
                </div>
                <p className="text-gray-400 capitalize">{key}</p>
                <div className="w-full bg-gray-800 rounded-full h-2 mt-3">
                  <div 
                    className={`h-2 rounded-full ${getScoreBackground(score)} transition-all duration-1000 ease-out`}
                    style={{ width: `${score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-4">
              <TrendingUp className="w-6 h-6 text-green-400" />
              <h3 className="text-xl font-semibold">Key Strengths</h3>
            </div>
            {report.strengths && report.strengths.length > 0 ? (
              <ul className="space-y-3">
                {report.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-200">{strength}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">No specific strengths identified in this session.</p>
            )}
          </div>

          {/* Areas for Improvement */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-semibold">Areas for Improvement</h3>
            </div>
            {report.improvements && report.improvements.length > 0 ? (
              <ul className="space-y-3">
                {report.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-200">{improvement}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 italic">No specific improvements identified.</p>
            )}
          </div>
        </div>

        {/* Question-by-Question Breakdown */}
        {report.perQuestion && report.perQuestion.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
            <h3 className="text-xl font-semibold mb-6">Question Breakdown</h3>
            <div className="space-y-6">
              {report.perQuestion.map((questionData, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-white mb-2">
                        Question {index + 1}
                      </h4>
                      <p className="text-gray-300 mb-3">{questionData.question}</p>
                    </div>
                    <div className={`text-2xl font-bold ${getScoreColor(questionData.analysis?.overallScore || 0)}`}>
                      {questionData.analysis?.overallScore || 0}%
                    </div>
                  </div>
                  
                  {questionData.response && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-300 mb-2">Your Response:</h5>
                      <p className="text-gray-200 bg-gray-800 p-3 rounded-lg italic">
                        "{questionData.response}"
                      </p>
                    </div>
                  )}

                  {questionData.analysis && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(questionData.analysis.scores || {}).map(([metric, score]) => (
                        <div key={metric} className="text-center">
                          <div className={`text-lg font-semibold ${getScoreColor(score)}`}>
                            {score}%
                          </div>
                          <div className="text-xs text-gray-400 capitalize">{metric}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {questionData.skipped && (
                    <div className="mt-3 text-yellow-400 text-sm italic">
                      This question was skipped.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interview Summary */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 mb-8">
          <h3 className="text-xl font-semibold mb-4">Interview Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">{report.totalQuestions || 0}</div>
              <div className="text-gray-400 text-sm">Questions Answered</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">{report.interviewDuration || 0}m</div>
              <div className="text-gray-400 text-sm">Total Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 capitalize">
                {report.interviewType || 'Mixed'}
              </div>
              <div className="text-gray-400 text-sm">Interview Type</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {report.sentimentSummary?.positive || 0}
              </div>
              <div className="text-gray-400 text-sm">Positive Responses</div>
            </div>
          </div>
        </div>

        {/* Red Flags (if any) */}
        {report.redFlags && report.redFlags.length > 0 && (
          <div className="bg-red-900/20 border border-red-700 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <h3 className="text-xl font-semibold text-red-400">Areas of Concern</h3>
            </div>
            <ul className="space-y-2">
              {report.redFlags.map((flag, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-200">{flag}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Standout Points (if any) */}
        {report.standouts && report.standouts.length > 0 && (
          <div className="bg-green-900/20 border border-green-700 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h3 className="text-xl font-semibold text-green-400">Standout Moments</h3>
            </div>
            <ul className="space-y-2">
              {report.standouts.map((standout, index) => (
                <li key={index} className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-green-200">{standout}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/setup')}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Practice Again
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Tips for Next Time */}
        <div className="mt-12 bg-gray-900/50 rounded-xl p-6 border border-gray-800">
          <h4 className="text-lg font-semibold mb-4 text-gray-200">Tips for Your Next Interview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="font-medium text-gray-300 mb-2">Based on Your Performance:</h5>
              <ul className="text-gray-400 text-sm space-y-1">
                {report.overallScore < 70 && (
                  <>
                    <li>• Practice more common interview questions</li>
                    <li>• Prepare specific examples from your experience</li>
                  </>
                )}
                {report.overallScore >= 70 && report.overallScore < 85 && (
                  <>
                    <li>• Work on providing more detailed responses</li>
                    <li>• Practice the STAR method for behavioral questions</li>
                  </>
                )}
                {report.overallScore >= 85 && (
                  <>
                    <li>• Focus on advanced technical concepts</li>
                    <li>• Practice leadership and system design questions</li>
                  </>
                )}
                <li>• Record yourself to improve delivery</li>
                <li>• Research the company and role thoroughly</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium text-gray-300 mb-2">General Interview Tips:</h5>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>• Arrive early and dress professionally</li>
                <li>• Prepare thoughtful questions about the role</li>
                <li>• Show enthusiasm and genuine interest</li>
                <li>• Follow up with a thank-you email</li>
                <li>• Practice with mock interviews regularly</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}