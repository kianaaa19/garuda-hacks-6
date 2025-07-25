import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function Meeting({ navigate }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [meetings, setMeetings] = useState([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedPairner, setSelectedPairner] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      // Mock meetings data - replace with actual API call
      const mockMeetings = [
        {
          id: 1,
          pairner_name: 'Sari',
          pairner_id: 1,
          date: '2024-01-20',
          time: '14:00',
          status: 'scheduled',
          type: 'video',
          notes: 'Initial interview to discuss family needs and expectations'
        },
        {
          id: 2,
          pairner_name: 'Budi',
          pairner_id: 2,
          date: '2024-01-18',
          time: '10:30',
          status: 'completed',
          type: 'video',
          notes: 'Great conversation! Budi seems very experienced with children.'
        },
        {
          id: 3,
          pairner_name: 'Nia',
          pairner_id: 3,
          date: '2024-01-22',
          time: '16:00',
          status: 'scheduled',
          type: 'in-person',
          notes: 'Meeting at local coffee shop to discuss trial arrangement'
        }
      ];
      setMeetings(mockMeetings);
    } catch (error) {
      console.error('Error loading meetings:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleMeeting = async () => {
    if (!selectedDate || !selectedTime || !selectedPairner) return;

    try {
      const newMeeting = {
        id: Date.now(),
        pairner_name: selectedPairner.name,
        pairner_id: selectedPairner.id,
        date: selectedDate,
        time: selectedTime,
        status: 'scheduled',
        type: 'video',
        notes: notes
      };

      setMeetings(prev => [...prev, newMeeting]);
      setShowScheduleModal(false);
      resetForm();
    } catch (error) {
      console.error('Error scheduling meeting:', error);
    }
  };

  const resetForm = () => {
    setSelectedDate('');
    setSelectedTime('');
    setSelectedPairner(null);
    setNotes('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { text: 'Scheduled', class: 'status-scheduled' },
      completed: { text: 'Completed', class: 'status-completed' },
      cancelled: { text: 'Cancelled', class: 'status-cancelled' },
      rescheduled: { text: 'Rescheduled', class: 'status-rescheduled' }
    };
    
    const badge = badges[status] || badges.scheduled;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const getUpcomingMeetings = () => {
    return meetings.filter(meeting => 
      meeting.status === 'scheduled' && new Date(meeting.date) >= new Date()
    );
  };

  const getPastMeetings = () => {
    return meetings.filter(meeting => 
      meeting.status === 'completed' || new Date(meeting.date) < new Date()
    );
  };

  const getTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour <= 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  // Mock available au pairs for scheduling
  const availablePairners = [
    { id: 1, name: 'Sari', age: 19, gender: 'female' },
    { id: 2, name: 'Budi', age: 20, gender: 'male' },
    { id: 3, name: 'Nia', age: 18, gender: 'female' }
  ];

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading meetings...</p>
      </div>
    );
  }

  return (
    <div className="meetings-container fade-in">
      {/* Header */}
      <div className="meetings-header">
        <button className="back-button" onClick={() => navigate('home')}>
          ← Back to Home
        </button>
        
        <div className="header-content">
          <h1>Meetings & Interviews</h1>
          <p>Schedule and manage your au pair interviews</p>
        </div>
        
        <button 
          className="btn btn-primary"
          onClick={() => setShowScheduleModal(true)}
        >
          <span>📅</span>
          <span>Schedule Meeting</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="meetings-stats">
        <div className="stat-card">
          <div className="stat-number">{getUpcomingMeetings().length}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{getPastMeetings().length}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{meetings.length}</div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="meetings-tabs">
        <button 
          className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({getUpcomingMeetings().length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past ({getPastMeetings().length})
        </button>
      </div>

      {/* Meetings List */}
      <div className="meetings-list">
        {activeTab === 'upcoming' && (
          <div className="tab-panel fade-in">
            {getUpcomingMeetings().length === 0 ? (
              <div className="empty-meetings">
                <div className="empty-icon">📅</div>
                <h3>No upcoming meetings</h3>
                <p>Schedule your first interview with an au pair to get started</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowScheduleModal(true)}
                >
                  Schedule Meeting
                </button>
              </div>
            ) : (
              getUpcomingMeetings().map((meeting) => (
                <div key={meeting.id} className="meeting-card upcoming">
                  <div className="meeting-header">
                    <div className="meeting-info">
                      <h3>{meeting.pairner_name}</h3>
                      <div className="meeting-datetime">
                        <span className="date">📅 {formatDate(meeting.date)}</span>
                        <span className="time">🕐 {formatTime(meeting.time)}</span>
                      </div>
                    </div>
                    <div className="meeting-status">
                      {getStatusBadge(meeting.status)}
                      <div className="meeting-type">
                        {meeting.type === 'video' ? '📹 Video' : '👥 In-person'}
                      </div>
                    </div>
                  </div>
                  
                  {meeting.notes && (
                    <div className="meeting-notes">
                      <p>📝 {meeting.notes}</p>
                    </div>
                  )}
                  
                  <div className="meeting-actions">
                    <button className="btn btn-outline btn-sm">
                      📝 Edit
                    </button>
                    <button className="btn btn-primary btn-sm">
                      🎥 Join Call
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      💬 Message
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'past' && (
          <div className="tab-panel fade-in">
            {getPastMeetings().length === 0 ? (
              <div className="empty-meetings">
                <div className="empty-icon">📋</div>
                <h3>No past meetings</h3>
                <p>Your completed meetings will appear here</p>
              </div>
            ) : (
              getPastMeetings().map((meeting) => (
                <div key={meeting.id} className="meeting-card past">
                  <div className="meeting-header">
                    <div className="meeting-info">
                      <h3>{meeting.pairner_name}</h3>
                      <div className="meeting-datetime">
                        <span className="date">📅 {formatDate(meeting.date)}</span>
                        <span className="time">🕐 {formatTime(meeting.time)}</span>
                      </div>
                    </div>
                    <div className="meeting-status">
                      {getStatusBadge(meeting.status)}
                      <div className="meeting-type">
                        {meeting.type === 'video' ? '📹 Video' : '👥 In-person'}
                      </div>
                    </div>
                  </div>
                  
                  {meeting.notes && (
                    <div className="meeting-notes">
                      <p>📝 {meeting.notes}</p>
                    </div>
                  )}
                  
                  <div className="meeting-actions">
                    <button className="btn btn-outline btn-sm">
                      📊 View Details
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      💬 Message
                    </button>
                    <button className="btn btn-accent btn-sm">
                      📋 Leave Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal schedule-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Schedule Interview</h2>
              <button 
                className="close-btn"
                onClick={() => setShowScheduleModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Select Au Pair</label>
                <div className="pairner-selection">
                  {availablePairners.map((pairner) => (
                    <div 
                      key={pairner.id}
                      className={`pairner-option ${selectedPairner?.id === pairner.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPairner(pairner)}
                    >
                      <div className="option-avatar">👤</div>
                      <div className="option-info">
                        <div className="option-name">{pairner.name}</div>
                        <div className="option-details">{pairner.age} years, {pairner.gender}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time</label>
                  <select
                    className="form-select"
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                  >
                    <option value="">Select time</option>
                    {getTimeSlots().map((slot) => (
                      <option key={slot} value={slot}>
                        {formatTime(slot)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (Optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Add any specific topics you'd like to discuss..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="3"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={scheduleMeeting}
                disabled={!selectedDate || !selectedTime || !selectedPairner}
              >
                Schedule Meeting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="meeting-tips">
        <h3>💡 Interview Tips</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <div className="tip-icon">❓</div>
            <h4>Prepare Questions</h4>
            <p>Ask about experience, availability, and childcare philosophy</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🎯</div>
            <h4>Discuss Expectations</h4>
            <p>Be clear about your needs, schedule, and household rules</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">📋</div>
            <h4>Check References</h4>
            <p>Ask for and verify references from previous families or the orphanage</p>
          </div>
          <div className="tip-card">
            <div className="tip-icon">🤝</div>
            <h4>Trust Your Instincts</h4>
            <p>Choose someone you feel comfortable with and trust with your child</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Meeting;