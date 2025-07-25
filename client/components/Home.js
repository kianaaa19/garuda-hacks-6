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
      {/* Hero Welcome Section */}
      <div className="hero-welcome">
        <div className="hero-content">
          <h1 className="hero-title">
            {getGreeting()}, {getDisplayName()}! 
            <span className="wave">👋</span>
          </h1>
          <p className="hero-subtitle">
            Find the perfect au pair to care for your child while you're at work.
            <br />
            <span className="text-accent">Trusted • Trained • Caring</span>
          </p>
        </div>
        <div className="hero-illustration">
          <div className="floating-card">
            <div className="card-icon">👶</div>
            <div className="card-text">Safe Care</div>
          </div>
          <div className="floating-card delay-1">
            <div className="card-icon">🎓</div>
            <div className="card-text">Trained</div>
          </div>
          <div className="floating-card delay-2">
            <div className="card-icon">❤️</div>
            <div className="card-text">Trusted</div>
          </div>
        </div>
      </div>

      {/* Quick Stats Dashboard */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card primary">
            <div className="stat-icon">💬</div>
            <div className="stat-number">{stats.total_conversations}</div>
            <div className="stat-label">Active Conversations</div>
          </div>
          <div className="stat-card accent">
            <div className="stat-icon">📅</div>
            <div className="stat-number">{stats.total_meetings}</div>
            <div className="stat-label">Scheduled Meetings</div>
          </div>
          <div className="stat-card success">
            <div className="stat-icon">⭐</div>
            <div className="stat-number">{recommendedPairners.length}</div>
            <div className="stat-label">Recommended Matches</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="action-grid">
          <button 
            className="action-card primary"
            onClick={() => navigate('search')}
          >
            <div className="action-icon">🔍</div>
            <div className="action-content">
              <h3>Find Au Pairs</h3>
              <p>Search our verified caregivers</p>
            </div>
            <div className="action-arrow">→</div>
          </button>
          
          <button 
            className="action-card secondary"
            onClick={() => navigate('chat')}
          >
            <div className="action-icon">💬</div>
            <div className="action-content">
              <h3>View Messages</h3>
              <p>Continue conversations</p>
            </div>
            <div className="action-arrow">→</div>
          </button>
          
          <button 
            className="action-card accent"
            onClick={() => navigate('meetings')}
          >
            <div className="action-icon">📅</div>
            <div className="action-content">
              <h3>Manage Meetings</h3>
              <p>Schedule interviews</p>
            </div>
            <div className="action-arrow">→</div>
          </button>
        </div>
      </div>

      {/* Recommended Au Pairs */}
      {recommendedPairners.length > 0 && (
        <div className="recommended-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recommended for You</h2>
              <p className="section-subtitle">
                Based on your preferences: {user?.preferred_gender !== 'any' && `${user.preferred_gender}, `}
                {user?.preferred_age_range} years old
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate('search')}
            >
              View All
            </button>
          </div>
          
          <div className="pairners-grid">
            {recommendedPairners.slice(0, 4).map((pairner) => (
              <PairnerCard
                key={pairner.id}
                pairner={pairner}
                onClick={() => handlePairnerClick(pairner)}
                enhanced={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recently Added Au Pairs */}
      {recentPairners.length > 0 && (
        <div className="recent-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recently Added</h2>
              <p className="section-subtitle">
                Newly verified au pairs from our partner orphanages
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => navigate('search')}
            >
              View All
            </button>
          </div>
          
          <div className="pairners-grid">
            {recentPairners.slice(0, 4).map((pairner) => (
              <PairnerCard
                key={pairner.id}
                pairner={pairner}
                onClick={() => handlePairnerClick(pairner)}
                enhanced={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {recommendedPairners.length === 0 && recentPairners.length === 0 && (
        <div className="empty-state">
          <div className="empty-illustration">
            <div className="empty-icon">🌟</div>
            <div className="empty-circles">
              <div className="circle circle-1"></div>
              <div className="circle circle-2"></div>
              <div className="circle circle-3"></div>
            </div>
          </div>
          <h3>Welcome to AuPairly!</h3>
          <p>
            Let's find the perfect au pair for your child. Our trained caregivers from 
            affiliated orphanages are ready to help provide quality care while you work.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => navigate('search')}
          >
            <span>Start Your Search</span>
            <span className="btn-icon">✨</span>
          </button>
        </div>
      )}

      {/* Features Section */}
      <div className="features-section">
        <h2 className="section-title">Why Choose Our Au Pairs?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper primary">
              <div className="feature-icon">🎓</div>
            </div>
            <h3>Trained & Certified</h3>
            <p>
              All au pairs complete our comprehensive training program covering childcare, 
              safety, and household management.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper accent">
              <div className="feature-icon">🏠</div>
            </div>
            <h3>From Trusted Orphanages</h3>
            <p>
              Our au pairs come from affiliated orphanages with proper background 
              checks and character references.
            </p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper success">
              <div className="feature-icon">👥</div>
            </div>
            <h3>Ongoing Support</h3>
            <p>
              Regular monitoring and support from our team ensures the best care 
              for your child and growth for the au pair.
            </p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="process-section">
        <h2 className="section-title">How It Works</h2>
        <div className="process-grid">
          <div className="process-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Browse & Chat</h3>
              <p>Search our verified au pairs and start conversations to find the right match.</p>
            </div>
            <div className="step-connector"></div>
          </div>
          
          <div className="process-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Schedule Meeting</h3>
              <p>Arrange an interview to meet in person and discuss expectations.</p>
            </div>
            <div className="step-connector"></div>
          </div>
          
          <div className="process-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Contract Signing</h3>
              <p>Sign the agreement and provide single parent documentation for verification.</p>
            </div>
            <div className="step-connector"></div>
          </div>
          
          <div className="process-step">
            <div className="step-number accent">4</div>
            <div className="step-content">
              <h3>Start Care</h3>
              <p>Begin the au pair arrangement with ongoing support from our team.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="cta-section">
        <div className="cta-content">
          <h2>Ready to Find Your Perfect Au Pair?</h2>
          <p>Join thousands of satisfied parents who found trusted childcare through AuPairly</p>
          <button 
            className="btn btn-primary btn-lg"
            onClick={() => navigate('search')}
          >
            <span>Start Searching Now</span>
            <span className="btn-icon">🚀</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;