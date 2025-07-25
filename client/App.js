import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import components
import Login from './components/Login';
import Home from './components/Home';
import PairnerCard from './components/PairnerCard';
import PairnerProfile from './components/PairnerProfile';
import Chat from './components/Chat';
import Meeting from './components/Meeting';

// Main App Component
function App() {
  return (
    <div className="app">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </div>
  );
}

// App Content Component
function AppContent() {
  const { isAuthenticated, isLoading, isInitialized, user } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPairner, setSelectedPairner] = useState(null);

  // Handle navigation
  const navigate = (page, data = null) => {
    setCurrentPage(page);
    if (data) {
      setSelectedPairner(data);
    }
  };

  // Show loading screen while initializing
  if (!isInitialized || isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading Aupairly...</p>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  // Main navigation component
  const Navigation = () => (
    <>
      {/* Top Navigation - Desktop */}
      <nav className="nav-header hidden-mobile">
        <div className="nav-container">
          <div className="nav-logo">
            <span onClick={() => navigate('home')}>aupairly</span>
          </div>
          <div className="nav-menu">
            <a href="#" className={`nav-link ${currentPage === 'home' ? 'active' : ''}`} 
               onClick={(e) => { e.preventDefault(); navigate('home'); }}>
              Home
            </a>
            <a href="#" className={`nav-link ${currentPage === 'chat' ? 'active' : ''}`}
               onClick={(e) => { e.preventDefault(); navigate('chat'); }}>
              Messages
            </a>
            <a href="#" className={`nav-link ${currentPage === 'meetings' ? 'active' : ''}`}
               onClick={(e) => { e.preventDefault(); navigate('meetings'); }}>
              Meetings
            </a>
            <div className="avatar avatar-sm">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Navigation - Mobile */}
      <nav className="bottom-nav hidden-desktop">
        <div className="bottom-nav-container">
          <a href="#" className={`bottom-nav-item ${currentPage === 'home' ? 'active' : ''}`}
             onClick={(e) => { e.preventDefault(); navigate('home'); }}>
            <span>🏠</span>
            <span>Home</span>
          </a>
          <a href="#" className={`bottom-nav-item ${currentPage === 'search' ? 'active' : ''}`}
             onClick={(e) => { e.preventDefault(); navigate('search'); }}>
            <span>🔍</span>
            <span>Search</span>
          </a>
          <a href="#" className={`bottom-nav-item ${currentPage === 'chat' ? 'active' : ''}`}
             onClick={(e) => { e.preventDefault(); navigate('chat'); }}>
            <span>💬</span>
            <span>Chat</span>
          </a>
          <a href="#" className={`bottom-nav-item ${currentPage === 'meetings' ? 'active' : ''}`}
             onClick={(e) => { e.preventDefault(); navigate('meetings'); }}>
            <span>📅</span>
            <span>Meetings</span>
          </a>
          <a href="#" className={`bottom-nav-item ${currentPage === 'profile' ? 'active' : ''}`}
             onClick={(e) => { e.preventDefault(); navigate('profile'); }}>
            <span>👤</span>
            <span>Profile</span>
          </a>
        </div>
      </nav>
    </>
  );

  // Page content renderer
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home navigate={navigate} />;
      case 'search':
        return <SearchPage navigate={navigate} />;
      case 'pairner':
        return <PairnerProfile pairner={selectedPairner} navigate={navigate} />;
      case 'chat':
        return <Chat navigate={navigate} selectedPairner={selectedPairner} />;
      case 'meetings':
        return <Meeting navigate={navigate} />;
      case 'profile':
        return <Profile navigate={navigate} />;
      default:
        return <Home navigate={navigate} />;
    }
  };

  return (
    <>
      <Navigation />
      <main className="main-content">
        {renderPage()}
      </main>
    </>
  );
}

// Search Page Component
function SearchPage({ navigate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    gender: 'any',
    min_age: '',
    max_age: '',
    skills: ''
  });
  const [pairners, setPairners] = useState([]);
  const [loading, setLoading] = useState(false);

  // Handle search
  const handleSearch = async () => {
    setLoading(true);
    try {
      // Implement search logic here using API service
      console.log('Searching with:', { searchQuery, filters });
      // Mock data for now
      setPairners([]);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="mt-lg">
        <h1>Find Your Perfect Au Pair</h1>
        <p className="text-secondary">Search through our trained and verified au pairs from affiliated orphanages.</p>
      </div>

      {/* Search Form */}
      <div className="card mt-lg">
        <div className="card-body">
          <div className="form-group">
            <input
              type="text"
              className="form-input"
              placeholder="Search by name, skills, or experience..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label">Preferred Gender</label>
              {editing ? (
                <select
                  className="form-select"
                  value={formData.preferred_gender}
                  onChange={(e) => setFormData({ ...formData, preferred_gender: e.target.value })}
                >
                  <option value="any">Any</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              ) : (
                <p className="text-primary">{user?.preferred_gender || 'Any'}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Preferred Age Range</label>
              {editing ? (
                <select
                  className="form-select"
                  value={formData.preferred_age_range}
                  onChange={(e) => setFormData({ ...formData, preferred_age_range: e.target.value })}
                >
                  <option value="16-20">16-20 years</option>
                  <option value="18-22">18-22 years</option>
                  <option value="20-25">20-25 years</option>
                  <option value="18-25">18-25 years</option>
                </select>
              ) : (
                <p className="text-primary">{user?.preferred_age_range || '18-25'} years</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Address</label>
              {editing ? (
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter your address"
                />
              ) : (
                <p className="text-primary">{user?.address || 'Not provided'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="card mt-lg">
        <div className="card-header">
          <h3 className="m-0">Account Actions</h3>
        </div>
        <div className="card-body">
          <div className="flex flex-col gap-md">
            <button className="btn btn-secondary">
              Change Password
            </button>
            <button className="btn btn-secondary">
              Download My Data
            </button>
            <button className="btn btn-accent" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;">Gender Preference</label>
              <select
                className="form-select"
                value={filters.gender}
                onChange={(e) => setFilters({ ...filters, gender: e.target.value })}
              >
                <option value="any">Any</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Age Range</label>
              <div className="flex gap-sm">
                <input
                  type="number"
                  className="form-input"
                  placeholder="Min"
                  value={filters.min_age}
                  onChange={(e) => setFilters({ ...filters, min_age: e.target.value })}
                />
                <input
                  type="number"
                  className="form-input"
                  placeholder="Max"
                  value={filters.max_age}
                  onChange={(e) => setFilters({ ...filters, max_age: e.target.value })}
                />
              </div>
            </div>
          </div>

          <button className="btn btn-primary btn-full" onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search Au Pairs'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="mt-lg">
        {loading ? (
          <div className="text-center">
            <div className="loading-spinner"></div>
            <p>Finding perfect matches...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2">
            {pairners.length === 0 ? (
              <div className="col-span-2 text-center p-lg">
                <p className="text-secondary">Start searching to find your perfect au pair match!</p>
              </div>
            ) : (
              pairners.map((pairner) => (
                <PairnerCard 
                  key={pairner.id} 
                  pairner={pairner} 
                  onClick={() => navigate('pairner', pairner)} 
                />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Profile Page Component
function Profile({ navigate }) {
  const { user, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    child_age: user?.child_age || '',
    preferred_gender: user?.preferred_gender || 'any',
    preferred_age_range: user?.preferred_age_range || '18-25',
    address: user?.address || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateProfile(formData);
      if (result.success) {
        setEditing(false);
      }
    } catch (error) {
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="fade-in">
      <div className="mt-lg">
        <h1>Profile Settings</h1>
        <p className="text-secondary">Manage your account and preferences</p>
      </div>

      <div className="card mt-lg">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h3 className="m-0">Personal Information</h3>
            {!editing ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                Edit
              </button>
            ) : (
              <div className="flex gap-sm">
                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              {editing ? (
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <p className="text-primary">{user?.name}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Email</label>
              <p className="text-secondary">{user?.email}</p>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              {editing ? (
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              ) : (
                <p className="text-primary">{user?.phone || 'Not provided'}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Child's Age</label>
              {editing ? (
                <input
                  type="number"
                  className="form-input"
                  value={formData.child_age}
                  onChange={(e) => setFormData({ ...formData, child_age: e.target.value })}
                />
              ) : (
                <p className="text-primary">{user?.child_age ? `${user.child_age} years old` : 'Not provided'}</p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label