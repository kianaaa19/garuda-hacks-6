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

  const getMockPairners = () => [
    {
      id: 1,
      name: 'Sari',
      age: 19,
      gender: 'female',
      orphanage_id: 1,
      skills: 'Memasak, Mengaji, Bahasa Inggris',
      bio: 'Saya suka anak-anak dan berpengalaman merawat adik-adik di panti.',
      intro_video_url: 'https://example.com/video1',
      is_available: true,
      rating: 4.8
    },
    {
      id: 2,
      name: 'Budi',
      age: 20,
      gender: 'male',
      orphanage_id: 1,
      skills: 'Olahraga, Komputer, Matematika',
      bio: 'Saya sabar dan suka mengajar anak-anak.',
      intro_video_url: 'https://example.com/video2',
      is_available: true,
      rating: 4.6
    },
    {
      id: 3,
      name: 'Nia',
      age: 18,
      gender: 'female',
      orphanage_id: 2,
      skills: 'Menari, Menggambar, Musik',
      bio: 'Saya kreatif dan energik dalam mengasuh anak.',
      intro_video_url: 'https://example.com/video3',
      is_available: false,
      rating: 4.9
    },
    {
      id: 4,
      name: 'Andi',
      age: 21,
      gender: 'male',
      orphanage_id: 2,
      skills: 'Bahasa Inggris, Komputer, Fotografi',
      bio: 'Berpengalaman mengajar dan sangat menyukai anak-anak.',
      intro_video_url: null,
      is_available: true,
      rating: 4.5
    }
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading your personalized dashboard...</p>
      </div>
    );
  }

  const displayRecommendedPairners = recommendedPairners.length > 0 ? recommendedPairners : getMockPairners().slice(0, 2);
  const displayRecentPairners = recentPairners.length > 0 ? recentPairners : getMockPairners().slice(2, 4);

  return (
    <div className="home-container fade-in">
      {/* Hero Welcome Section */}
      <div className="hero-welcome">
        <div className="hero-content">
          <div className="welcome-text">
            <h1 className="hero-title">
              Welcome back, <span className="highlight">{getDisplayName()}</span>! 👋
            </h1>
            <p className="hero-subtitle">
              Find your perfect childcare companion today. Connect with trained and verified au pairs who can provide loving care for your children.
            </p>
          </div>
          <div className="hero-cards">
            <div className="floating-card card-1">
              <div className="card-icon">👶</div>
              <div className="card-text">
                <h4>Trusted Care</h4>
                <p>Verified au pairs</p>
              </div>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">🎓</div>
              <div className="card-text">
                <h4>Trained Professionals</h4>
                <p>Comprehensive training</p>
              </div>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">💝</div>
              <div className="card-text">
                <h4>Making a Difference</h4>
                <p>Supporting orphanages</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Statistics */}
      <div className="stats-section">
        <div className="section-header">
          <h2>Your Activity</h2>
          <p className="section-subtitle">Track your progress in finding the perfect au pair</p>
        </div>
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">💬</div>
            <div className="stat-content">
              <div className="stat-number">{stats.total_conversations}</div>
              <div className="stat-label">Active Conversations</div>
            </div>
          </div>
          <div className="stat-card stat-success">
            <div className="stat-icon">📅</div>
            <div className="stat-content">
              <div className="stat-number">{stats.total_meetings}</div>
              <div className="stat-label">Scheduled Meetings</div>
            </div>
          </div>
          <div className="stat-card stat-accent">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <div className="stat-number">{displayRecommendedPairners.length}</div>
              <div className="stat-label">Perfect Matches</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="section-header">
          <h2>Quick Actions</h2>
          <p className="section-subtitle">Get started with these common tasks</p>
        </div>
        <div className="action-grid">
          <div className="action-card" onClick={() => navigate('search')}>
            <div className="action-icon">🔍</div>
            <div className="action-content">
              <h3>Find Au Pairs</h3>
              <p>Search through our database of qualified au pairs</p>
            </div>
            <div className="action-arrow">→</div>
          </div>
          <div className="action-card" onClick={() => navigate('chat')}>
            <div className="action-icon">💬</div>
            <div className="action-content">
              <h3>Messages</h3>
              <p>Continue conversations with potential au pairs</p>
            </div>
            <div className="action-arrow">→</div>
          </div>
          <div className="action-card" onClick={() => navigate('meetings')}>
            <div className="action-icon">📅</div>
            <div className="action-content">
              <h3>Schedule Interview</h3>
              <p>Set up meetings with your top candidates</p>
            </div>
            <div className="action-arrow">→</div>
          </div>
          <div className="action-card" onClick={() => navigate('profile')}>
            <div className="action-icon">⚙️</div>
            <div className="action-content">
              <h3>Settings</h3>
              <p>Update your preferences and profile</p>
            </div>
            <div className="action-arrow">→</div>
          </div>
        </div>
      </div>

      {/* Recommended Au Pairs */}
      <div className="recommended-section">
        <div className="section-header">
          <h2>Perfect Matches for You</h2>
          <p className="section-subtitle">Au pairs that match your preferences and needs</p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('search')}>
            View All
          </button>
        </div>
        
        {displayRecommendedPairners.length > 0 ? (
          <div className="pairners-grid">
            {displayRecommendedPairners.map((pairner) => (
              <PairnerCard 
                key={pairner.id} 
                pairner={pairner} 
                onClick={() => navigate('pairner', pairner)}
                enhanced={true}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-illustration">
              <div className="empty-circle circle-1"></div>
              <div className="empty-circle circle-2"></div>
              <div className="empty-circle circle-3"></div>
              <div className="empty-icon">🔍</div>
            </div>
            <h3>No matches yet</h3>
            <p>Complete your profile to get personalized recommendations</p>
            <button className="btn btn-primary" onClick={() => navigate('profile')}>
              Complete Profile
            </button>
          </div>
        )}
      </div>

      {/* Recently Added Au Pairs */}
      <div className="recent-section">
        <div className="section-header">
          <h2>Recently Added Au Pairs</h2>
          <p className="section-subtitle">New au pairs who just joined our platform</p>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('search')}>
            Browse All
          </button>
        </div>
        
        {displayRecentPairners.length > 0 ? (
          <div className="pairners-grid">
            {displayRecentPairners.map((pairner) => (
              <PairnerCard 
                key={pairner.id} 
                pairner={pairner} 
                onClick={() => navigate('pairner', pairner)}
                enhanced={true}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-illustration">
              <div className="empty-circle circle-1"></div>
              <div className="empty-circle circle-2"></div>
              <div className="empty-circle circle-3"></div>
              <div className="empty-icon">👥</div>
            </div>
            <h3>No recent additions</h3>
            <p>Check back soon for new au pairs joining our community</p>
          </div>
        )}
      </div>

      {/* About Aupairly */}
      <div className="features-section">
        <div className="section-header">
          <h2>Why Choose AuPairly?</h2>
          <p className="section-subtitle">We connect families with trusted childcare while supporting orphanages</p>
        </div>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">🔒</div>
            </div>
            <h3>Verified & Trusted</h3>
            <p>All au pairs undergo comprehensive background checks and training programs</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">🎓</div>
            </div>
            <h3>Professional Training</h3>
            <p>Our au pairs complete childcare certification and safety training courses</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">💝</div>
            </div>
            <h3>Supporting Communities</h3>
            <p>Every match helps support orphanages and creates opportunities for young adults</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <div className="feature-icon">🤝</div>
            </div>
            <h3>Ongoing Support</h3>
            <p>Continuous support and mediation throughout your au pair relationship</p>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="process-section">
        <div className="section-header">
          <h2>How AuPairly Works</h2>
          <p className="section-subtitle">Simple steps to find your perfect childcare match</p>
        </div>
        <div className="process-grid">
          <div className="process-step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Create Profile</h3>
              <p>Tell us about your family and childcare needs</p>
            </div>
          </div>
          <div className="step-connector"></div>
          <div className="process-step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Browse & Match</h3>
              <p>Discover au pairs that fit your requirements</p>
            </div>
          </div>
          <div className="step-connector"></div>
          <div className="process-step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Connect & Interview</h3>
              <p>Chat and schedule interviews with candidates</p>
            </div>
          </div>
          <div className="step-connector"></div>
          <div className="process-step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Welcome Your Au Pair</h3>
              <p>Finalize the arrangement and welcome your new family member</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-section">
        <div className="cta-content">
          <div className="cta-icon">🌟</div>
          <h2>Ready to Find Your Perfect Au Pair?</h2>
          <p>Join thousands of families who have found trusted childcare through our platform</p>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('search')}>
            Start Your Search
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;