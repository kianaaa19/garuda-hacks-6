import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import PairnerCard from './PairnerCard';

function Home({ navigate }) {
  const { user, getDisplayName } = useAuth();
  const [recommendedPairners, setRecommendedPairners] = useState([]);
  const [recentPairners, setRecentPairners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total_conversations: 0,
    total_meetings: 0
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Load recommended pairners
      const recommendedResponse = await apiService.pairners.getRecommended();
      setRecommendedPairners(recommendedResponse.pairners || []);

      // Load recent pairners
      const recentResponse = await apiService.pairners.getAll({ limit: 4 });
      setRecentPairners(recentResponse.pairners || []);

      // Load user stats
      try {
        const chatStats = await apiService.chat.getStats();
        const meetingsResponse = await apiService.users.getMeetings();
        setStats({
          total_conversations: chatStats.stats?.total_conversations || 0,
          total_meetings: meetingsResponse.meetings?.length || 0
        });
      } catch (statsError) {
        console.log('Stats loading failed:', statsError);
      }

    } catch (error) {
      console.error('Error loading home data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePairnerClick = (pairner) => {
    navigate('pairner', pairner);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Welcome Header */}
      <div className="mt-lg">
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {getDisplayName()}! 👋
        </h1>
        <p className="text-secondary">
          Find the perfect au pair to care for your child while you're at work.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 mt-lg gap-md">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary">{stats.total_conversations}</div>
            <div className="text-sm text-secondary">Active Conversations</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-accent-orange">{stats.total_meetings}</div>
            <div className="text-sm text-secondary">Scheduled Meetings</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card mt-lg">
        <div className="card-header">
          <h3 className="m-0">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-md">
            <button
              className="btn btn-primary"
              onClick={() => navigate('search')}
            >
              🔍 Find Au Pairs
            </button>
            <button
              className="btn btn-outline"
              onClick={() => navigate('chat')}
            >
              💬 View Messages
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => navigate('meetings')}
            >
              📅 Manage Meetings
            </button>
          </div>
        </div>
      </div>

      {/* Recommended Au Pairs */}
      {recommendedPairners.length > 0 && (
        <div className="mt-lg">
          <div className="flex justify-between items-center mb-md">
            <h2 className="m-0">Recommended for You</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('search')}
            >
              View All
            </button>
          </div>
          <p className="text-secondary mb-lg">
            Based on your preferences: {user?.preferred_gender !== 'any' && `${user.preferred_gender}, `}
            {user?.preferred_age_range} years old
          </p>
          
          <div className="grid grid-cols-2">
            {recommendedPairners.slice(0, 4).map((pairner) => (
              <PairnerCard
                key={pairner.id}
                pairner={pairner}
                onClick={() => handlePairnerClick(pairner)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently Added Au Pairs */}
      {recentPairners.length > 0 && (
        <div className="mt-lg">
          <div className="flex justify-between items-center mb-md">
            <h2 className="m-0">Recently Added</h2>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('search')}
            >
              View All
            </button>
          </div>
          <p className="text-secondary mb-lg">
            Newly verified au pairs from our partner orphanages
          </p>
          
          <div className="grid grid-cols-2">
            {recentPairners.slice(0, 4).map((pairner) => (
              <PairnerCard
                key={pairner.id}
                pairner={pairner}
                onClick={() => handlePairnerClick(pairner)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recommendedPairners.length === 0 && recentPairners.length === 0 && (
        <div className="card mt-lg">
          <div className="card-body text-center p-2xl">
            <div className="text-6xl mb-md">👶</div>
            <h3>Welcome to Aupairly!</h3>
            <p className="text-secondary mb-lg">
              Let's find the perfect au pair for your child. Our trained caregivers from 
              affiliated orphanages are ready to help.
            </p>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('search')}
            >
              Start Your Search
            </button>
          </div>
        </div>
      )}

      {/* About Aupairly */}
      <div className="card mt-lg">
        <div className="card-header">
          <h3 className="m-0">About Our Au Pairs</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-md">
            <div className="flex items-start gap-md">
              <div className="text-2xl">🎓</div>
              <div>
                <h4 className="font-semibold mb-xs">Trained & Certified</h4>
                <p className="text-secondary text-sm m-0">
                  All au pairs complete our comprehensive training program covering childcare, 
                  safety, and household management.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-md">
              <div className="text-2xl">🏠</div>
              <div>
                <h4 className="font-semibold mb-xs">From Trusted Orphanages</h4>
                <p className="text-secondary text-sm m-0">
                  Our au pairs come from affiliated orphanages with proper background 
                  checks and character references.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-md">
              <div className="text-2xl">👥</div>
              <div>
                <h4 className="font-semibold mb-xs">Ongoing Support</h4>
                <p className="text-secondary text-sm m-0">
                  Regular monitoring and support from our team ensures the best care 
                  for your child and growth for the au pair.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Process */}
      <div className="card mt-lg mb-2xl">
        <div className="card-header">
          <h3 className="m-0">How It Works</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col gap-lg">
            <div className="flex items-center gap-md">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-blue text-white rounded-full font-bold text-sm">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-xs">Browse & Chat</h4>
                <p className="text-secondary text-sm m-0">
                  Search our verified au pairs and start conversations to find the right match.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-md">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-blue text-white rounded-full font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-xs">Schedule Meeting</h4>
                <p className="text-secondary text-sm m-0">
                  Arrange an interview to meet in person and discuss expectations.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-md">
              <div className="flex items-center justify-center w-8 h-8 bg-primary-blue text-white rounded-full font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-xs">Contract Signing</h4>
                <p className="text-secondary text-sm m-0">
                  Sign the agreement and provide single parent documentation for verification.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-md">
              <div className="flex items-center justify-center w-8 h-8 bg-accent-orange text-white rounded-full font-bold text-sm">
                4
              </div>
              <div>
                <h4 className="font-semibold mb-xs">Start Care</h4>
                <p className="text-secondary text-sm m-0">
                  Begin the au pair arrangement with ongoing support from our team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;