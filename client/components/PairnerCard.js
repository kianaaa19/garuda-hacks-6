import React from 'react';

function PairnerCard({ pairner, onClick, enhanced = false }) {
  if (!pairner) return null;

  const getAgeDisplay = (age) => {
    return `${age} years old`;
  };

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

  const getAvailabilityBadge = (isAvailable) => {
    return isAvailable ? (
      <div className="availability-badge available">
        <div className="badge-dot"></div>
        Available
      </div>
    ) : (
      <div className="availability-badge unavailable">
        <div className="badge-dot"></div>
        Busy
      </div>
    );
  };

  return (
    <div className={`pairner-card ${enhanced ? 'enhanced' : ''}`} onClick={onClick}>
      {/* Card Header with Avatar and Status */}
      <div className="pairner-card-header">
        <div className="pairner-avatar">
          <div className="avatar-circle">
            <span className="avatar-icon">{getGenderIcon(pairner.gender)}</span>
          </div>
          {enhanced && getAvailabilityBadge(pairner.is_available !== false)}
        </div>
        {enhanced && (
          <div className="card-actions">
            <button className="action-btn favorite" title="Add to favorites">
              <span>💝</span>
            </button>
            <button className="action-btn share" title="Share profile">
              <span>📤</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Image Section */}
      <div className="pairner-card-image">
        {pairner.intro_video_url ? (
          <div className="video-preview">
            <div className="video-icon">📹</div>
            <div className="video-text">Intro Video</div>
            <div className="play-button">▶️</div>
          </div>
        ) : (
          <div className="image-placeholder">
            <span className="placeholder-icon">{getGenderIcon(pairner.gender)}</span>
            <div className="placeholder-text">Photo Coming Soon</div>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="pairner-card-content">
        {/* Name and Basic Info */}
        <div className="profile-header">
          <h3 className="pairner-card-name">{pairner.name}</h3>
          {enhanced && (
            <div className="profile-rating">
              <div className="rating-stars">
                {getRatingStars(pairner.rating)}
              </div>
              <span className="rating-text">
                {pairner.rating ? `${pairner.rating}/5` : 'New'}
              </span>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="pairner-card-details">
          <div className="detail-item">
            <span className="detail-icon">🎂</span>
            <span>{getAgeDisplay(pairner.age)}</span>
          </div>
          <div className="detail-item">
            <span className="detail-icon">👤</span>
            <span className="capitalize">{pairner.gender}</span>
          </div>
          {pairner.orphanage_id && (
            <div className="detail-item">
              <span className="detail-icon">🏠</span>
              <span>Orphanage #{pairner.orphanage_id}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {pairner.bio && (
          <div className="pairner-bio">
            <p>"{pairner.bio}"</p>
          </div>
        )}

        {/* Skills */}
        {getSkillsArray(pairner.skills).length > 0 && (
          <div className="pairner-card-skills">
            <div className="skills-header">
              <span className="skills-icon">⭐</span>
              <span className="skills-label">Skills</span>
            </div>
            <div className="skills-list">
              {getSkillsArray(pairner.skills).slice(0, enhanced ? 4 : 3).map((skill, index) => (
                <span key={index} className="skill-tag">
                  {skill}
                </span>
              ))}
              {getSkillsArray(pairner.skills).length > (enhanced ? 4 : 3) && (
                <span className="skill-tag more">
                  +{getSkillsArray(pairner.skills).length - (enhanced ? 4 : 3)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {enhanced && (
          <div className="card-buttons">
            <button className="btn btn-outline btn-sm">
              <span>💬</span>
              <span>Message</span>
            </button>
            <button className="btn btn-primary btn-sm">
              <span>👁️</span>
              <span>View Profile</span>
            </button>
          </div>
        )}
      </div>

      {/* Hover Effect Overlay */}
      {enhanced && (
        <div className="card-overlay">
          <div className="overlay-content">
            <div className="overlay-icon">👋</div>
            <div className="overlay-text">Click to view full profile</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PairnerCard;