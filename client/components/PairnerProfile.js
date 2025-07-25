import React, { useState } from 'react';

function PairnerProfile({ pairner, navigate }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!pairner) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  const getSkillsArray = (skills) => {
    if (!skills) return [];
    return typeof skills === 'string' ? skills.split(',').map(s => s.trim()) : skills;
  };

  const getRatingStars = (rating = 0) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="star">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="star">⭐</span>);
      } else {
        stars.push(<span key={i} className="star empty">☆</span>);
      }
    }
    return stars;
  };

  const getGenderIcon = (gender) => {
    switch(gender?.toLowerCase()) {
      case 'female': return '👩';
      case 'male': return '👨';
      default: return '👤';
    }
  };

  return (
    <div className="profile-container fade-in">
      {/* Header */}
      <div className="profile-header-section">
        <button className="back-button" onClick={() => navigate('home')}>
          ← Back to Home
        </button>
        
        <div className="profile-hero">
          <div className="profile-avatar-large">
            <div className="avatar-circle-large">
              <span className="avatar-icon-large">{getGenderIcon(pairner.gender)}</span>
            </div>
            <div className="availability-badge-large">
              <div className="badge-dot"></div>
              {pairner.is_available !== false ? 'Available' : 'Busy'}
            </div>
          </div>
          
          <div className="profile-info">
            <h1 className="profile-name">{pairner.name}</h1>
            <div className="profile-details-main">
              <span className="detail-badge">
                <span className="detail-icon">🎂</span>
                {pairner.age} years old
              </span>
              <span className="detail-badge">
                <span className="detail-icon">👤</span>
                <span className="capitalize">{pairner.gender}</span>
              </span>
              {pairner.orphanage_id && (
                <span className="detail-badge">
                  <span className="detail-icon">🏠</span>
                  Orphanage #{pairner.orphanage_id}
                </span>
              )}
            </div>
            
            {pairner.rating && (
              <div className="profile-rating-main">
                <div className="rating-stars">
                  {getRatingStars(pairner.rating)}
                </div>
                <span className="rating-text">{pairner.rating}/5 rating</span>
              </div>
            )}
          </div>
          
          <div className="profile-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('chat', pairner)}>
              <span>💬</span>
              <span>Send Message</span>
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('meetings')}>
              <span>📅</span>
              <span>Schedule Interview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Skills & Experience
        </button>
        <button 
          className={`tab-button ${activeTab === 'background' ? 'active' : ''}`}
          onClick={() => setActiveTab('background')}
        >
          Background
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="tab-panel fade-in">
            {/* Introduction Video */}
            {pairner.intro_video_url && (
              <div className="card">
                <div className="card-header">
                  <h3>Introduction Video</h3>
                </div>
                <div className="card-body">
                  <div className="video-container">
                    <div className="video-placeholder">
                      <div className="video-icon-large">📹</div>
                      <p>Click to watch {pairner.name}'s introduction</p>
                      <button className="btn btn-primary">
                        <span>▶️</span>
                        <span>Play Video</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bio */}
            {pairner.bio && (
              <div className="card">
                <div className="card-header">
                  <h3>About {pairner.name}</h3>
                </div>
                <div className="card-body">
                  <p className="bio-text">"{pairner.bio}"</p>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="card">
              <div className="card-header">
                <h3>Quick Information</h3>
              </div>
              <div className="card-body">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">🎂</div>
                    <div className="info-content">
                      <div className="info-label">Age</div>
                      <div className="info-value">{pairner.age} years old</div>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-icon">👤</div>
                    <div className="info-content">
                      <div className="info-label">Gender</div>
                      <div className="info-value capitalize">{pairner.gender}</div>
                    </div>
                  </div>
                  {pairner.orphanage_id && (
                    <div className="info-item">
                      <div className="info-icon">🏠</div>
                      <div className="info-content">
                        <div className="info-label">Orphanage</div>
                        <div className="info-value">Orphanage #{pairner.orphanage_id}</div>
                      </div>
                    </div>
                  )}
                  <div className="info-item">
                    <div className="info-icon">📊</div>
                    <div className="info-content">
                      <div className="info-label">Status</div>
                      <div className="info-value">
                        {pairner.is_available !== false ? '✅ Available' : '❌ Currently Busy'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="tab-panel fade-in">
            {/* Skills */}
            {getSkillsArray(pairner.skills).length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3>Skills & Abilities</h3>
                </div>
                <div className="card-body">
                  <div className="skills-grid">
                    {getSkillsArray(pairner.skills).map((skill, index) => (
                      <div key={index} className="skill-card">
                        <div className="skill-icon">⭐</div>
                        <div className="skill-name">{skill}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Experience */}
            <div className="card">
              <div className="card-header">
                <h3>Experience & Training</h3>
              </div>
              <div className="card-body">
                <div className="experience-list">
                  <div className="experience-item">
                    <div className="experience-icon">🎓</div>
                    <div className="experience-content">
                      <h4>Childcare Training</h4>
                      <p>Completed comprehensive childcare training program including safety, first aid, and child development.</p>
                    </div>
                  </div>
                  <div className="experience-item">
                    <div className="experience-icon">👶</div>
                    <div className="experience-content">
                      <h4>Hands-on Experience</h4>
                      <p>Gained practical experience caring for children of various ages at the orphanage.</p>
                    </div>
                  </div>
                  <div className="experience-item">
                    <div className="experience-icon">🏆</div>
                    <div className="experience-content">
                      <h4>Certified Au Pair</h4>
                      <p>Officially certified by our partner training program with background verification.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'background' && (
          <div className="tab-panel fade-in">
            {/* Background Check */}
            <div className="card">
              <div className="card-header">
                <h3>Background Verification</h3>
              </div>
              <div className="card-body">
                <div className="verification-grid">
                  <div className="verification-item verified">
                    <div className="verification-icon">✅</div>
                    <div className="verification-content">
                      <h4>Identity Verified</h4>
                      <p>Official documents and identity have been verified</p>
                    </div>
                  </div>
                  <div className="verification-item verified">
                    <div className="verification-icon">✅</div>
                    <div className="verification-content">
                      <h4>Background Check</h4>
                      <p>Comprehensive background check completed successfully</p>
                    </div>
                  </div>
                  <div className="verification-item verified">
                    <div className="verification-icon">✅</div>
                    <div className="verification-content">
                      <h4>Training Completed</h4>
                      <p>Completed all required training modules and assessments</p>
                    </div>
                  </div>
                  <div className="verification-item verified">
                    <div className="verification-icon">✅</div>
                    <div className="verification-content">
                      <h4>Reference Check</h4>
                      <p>Character references from orphanage staff verified</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Orphanage Information */}
            {pairner.orphanage_id && (
              <div className="card">
                <div className="card-header">
                  <h3>Orphanage Partnership</h3>
                </div>
                <div className="card-body">
                  <div className="orphanage-info">
                    <div className="orphanage-details">
                      <h4>Partner Orphanage #{pairner.orphanage_id}</h4>
                      <p>This au pair comes from one of our verified partner orphanages that meets our strict standards for care, education, and character development.</p>
                      
                      <div className="orphanage-features">
                        <div className="feature">
                          <span className="feature-icon">🏠</span>
                          <span>Licensed & Regulated</span>
                        </div>
                        <div className="feature">
                          <span className="feature-icon">👥</span>
                          <span>Ongoing Support</span>
                        </div>
                        <div className="feature">
                          <span className="feature-icon">📚</span>
                          <span>Educational Programs</span>
                        </div>
                        <div className="feature">
                          <span className="feature-icon">💝</span>
                          <span>Character Development</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="profile-bottom-actions">
        <div className="action-card-large">
          <div className="action-content-large">
            <h3>Ready to connect with {pairner.name}?</h3>
            <p>Start a conversation to learn more and see if this is the right match for your family.</p>
          </div>
          <div className="action-buttons-large">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('chat', pairner)}>
              <span>💬</span>
              <span>Send Message</span>
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('meetings')}>
              <span>📅</span>
              <span>Schedule Interview</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PairnerProfile;