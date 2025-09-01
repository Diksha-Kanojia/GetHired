import { ChevronRight, FileText, LogOut, Plus, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previousInterviews, setPreviousInterviews] = useState([]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          setUser(session?.user ?? null);
          loadPreviousInterviews(session?.user?.id);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setPreviousInterviews([]);
          setLoading(false);
          navigate('/'); // Redirect to home page instead of auth
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Load previous interviews from localStorage (real data only)
  const loadPreviousInterviews = async (userId) => {
    try {
      // Get real interview results from localStorage
      const realInterviews = JSON.parse(localStorage.getItem('interview_results') || '[]');
      console.log('Loaded real interviews:', realInterviews);
      
      // Sort by date (newest first)
      realInterviews.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setPreviousInterviews(realInterviews);
    } catch (error) {
      console.error('Error loading interviews:', error);
      setPreviousInterviews([]);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Redirect to home page after successful logout
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error.message);
      setError('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  const viewInterviewDetails = (interview) => {
    if (interview.report && interview.responses) {
      // This is a real completed interview with full data
      navigate('/results', {
        state: {
          report: interview.report,
          responses: interview.responses,
          interviewData: {
            position: interview.position,
            interviewType: interview.type,
            duration: interview.duration
          }
        }
      });
    } else {
      // Fallback for any interviews without full data
      alert(`Interview Details:\nPosition: ${interview.position}\nType: ${interview.type}\nScore: ${interview.score}%\nDate: ${interview.date}\n\nDetailed results not available for this interview.`);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreBg = (score) => {
    if (score >= 90) return 'bg-green-900/30 border-green-500/30';
    if (score >= 75) return 'bg-yellow-900/30 border-yellow-500/30';
    return 'bg-red-900/30 border-red-500/30';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Completed': return 'text-green-400 bg-green-900/20';
      case 'In Progress': return 'text-yellow-400 bg-yellow-900/20';
      case 'Scheduled': return 'text-blue-400 bg-blue-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  // Stats
  const completedInterviews = previousInterviews.filter(i => i.status === 'Completed');
  const averageScore = completedInterviews.length > 0 
    ? Math.round(completedInterviews.reduce((acc, curr) => acc + (curr.score || 0), 0) / completedInterviews.length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-5xl md:text-3xl font-extrabold leading-snug tracking-tight text-white">
              <span className="text-indigo-400">Get Hired</span>
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-gray-300">
                <User className="w-5 h-5 mr-2" />
                <span>{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Ready for your next mock interview?
          </h2>
          <p className="text-gray-400 text-lg">
            Get personalized mock interviews tailored to your target role and experience level.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm font-medium">Total Interviews</p>
            <p className="text-3xl font-bold text-white">{previousInterviews.length}</p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm font-medium">Average Score</p>
            <p className="text-3xl font-bold text-white">{averageScore}%</p>
          </div>

          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <p className="text-gray-400 text-sm font-medium">This Month</p>
            <p className="text-3xl font-bold text-white">
              {previousInterviews.filter(i => {
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return new Date(i.date) > monthAgo;
              }).length}
            </p>
          </div>
        </div>

        {/* Quick Start Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/setup')}
            className="flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New Interview
          </button>
        </div>

        {/* Previous Interviews */}
        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="px-6 py-4 border-b border-gray-800">
            <h3 className="text-xl font-semibold text-white">Recent Interviews</h3>
          </div>
          <div className="p-6">
            {previousInterviews.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No interviews yet. Click "Create New Interview" to get started!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {previousInterviews.map((interview) => (
                  <div 
                    key={interview.id} 
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
                    onClick={() => viewInterviewDetails(interview)}
                  >
                    <div>
                      <h4 className="font-semibold text-white">{interview.position}</h4>
                      <p className="text-gray-400 text-sm">
                        {interview.type} • {interview.duration} min • {new Date(interview.date).toLocaleDateString()}
                        {interview.totalQuestions && (
                          <span> • {interview.totalQuestions} questions</span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      {interview.score !== null && (
                        <div className={`px-3 py-1 rounded-lg border ${getScoreBg(interview.score)}`}>
                          <span className={`font-semibold ${getScoreColor(interview.score)}`}>
                            {interview.score}%
                          </span>
                        </div>
                      )}
                      <div className="text-gray-400 hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
