#!/usr/bin/env python3
"""
ML Recommendation Service for Au Pair Matching System
Provides Python-based machine learning recommendations that can be called from Node.js
"""

import sys
import json
import pickle
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
import os
import warnings
warnings.filterwarnings('ignore')

class MLRecommendationService:
    def __init__(self, model_path='my_model.pkl'):
        self.model_path = model_path
        self.model_data = None
        self.aupair_df = None
        self.parent_df = None
        self.ratings_df = None
        self.tfidf_vectorizer = None
        self.cosine_sim = None
        self.svd_model = None
        self.is_loaded = False
        
    def load_model(self):
        """Load the trained model from pickle file"""
        try:
            if os.path.exists(self.model_path):
                with open(self.model_path, 'rb') as f:
                    self.model_data = pickle.load(f)
                
                # Extract components
                self.aupair_df = self.model_data.get('aupair_df')
                self.parent_df = self.model_data.get('parent_df')
                self.ratings_df = self.model_data.get('ratings_df')
                self.tfidf_vectorizer = self.model_data.get('tfidf_vectorizer')
                self.cosine_sim = self.model_data.get('cosine_sim')
                self.svd_model = self.model_data.get('svd_model')
                
                self.is_loaded = True
                return {"success": True, "message": "Model loaded successfully"}
            else:
                # Model doesn't exist, create sample data and train
                return self.create_and_train_model()
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def create_and_train_model(self):
        """Create sample data and train model if pickle file doesn't exist"""
        try:
            # Create sample data similar to the notebook
            self.create_sample_data()
            
            # Load and preprocess data
            self.load_data()
            self.preprocess_data()
            
            # Build models
            self.build_content_based_model()
            self.build_collaborative_filtering_model()
            
            # Save model
            self.save_model()
            
            self.is_loaded = True
            return {"success": True, "message": "Model created and trained successfully"}
            
        except Exception as e:
            return {"success": False, "error": f"Error creating model: {str(e)}"}
    
    def create_sample_data(self):
        """Create sample data for training"""
        # Sample au pair data
        aupair_data = {
            'id_au_pair': range(1, 21),
            'nama': [f'AuPair_{i}' for i in range(1, 21)],
            'usia': np.random.randint(18, 28, 20),
            'jenis_kelamin': np.random.choice(['Laki-laki', 'Perempuan'], 20),
            'provinsi': np.random.choice(['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'DI Yogyakarta'], 20),
            'status_availability': np.random.choice(['Available', 'Busy'], 20, p=[0.8, 0.2]),
            'rating_avg': np.round(np.random.normal(4.2, 0.6, 20), 1),
            'pengalaman_tahun': np.random.randint(0, 5, 20),
            'memasak': np.random.choice([0, 1], 20, p=[0.3, 0.7]),
            'first_aid': np.random.choice([0, 1], 20, p=[0.4, 0.6]),
            'mengemudi': np.random.choice([0, 1], 20, p=[0.5, 0.5]),
            'berenang': np.random.choice([0, 1], 20, p=[0.6, 0.4]),
            'komputer': np.random.choice([0, 1], 20, p=[0.4, 0.6]),
            'musik': np.random.choice([0, 1], 20, p=[0.7, 0.3]),
            'olahraga': np.random.choice([0, 1], 20, p=[0.6, 0.4])
        }
        
        self.aupair_df = pd.DataFrame(aupair_data)
        
        # Sample parent data
        parent_data = {
            'id_host': range(1, 16),
            'nama_keluarga': [f'Family_{i}' for i in range(1, 16)],
            'provinsi': np.random.choice(['DKI Jakarta', 'Jawa Barat', 'Jawa Tengah', 'Jawa Timur', 'DI Yogyakarta'], 15),
            'preferensi_keahlian': [self.generate_skill_preference() for _ in range(15)],
            'preferensi_gender_aupair': np.random.choice(['Laki-laki', 'Perempuan', 'Tidak-Ada-Preferensi'], 15),
            'budget_bulanan': np.random.randint(2000000, 5000000, 15)
        }
        
        self.parent_df = pd.DataFrame(parent_data)
        
        # Sample ratings data
        ratings_data = []
        np.random.seed(42)
        for parent_id in range(1, 16):
            n_ratings = np.random.randint(3, 8)
            rated_aupairs = np.random.choice(range(1, 21), n_ratings, replace=False)
            for aupair_id in rated_aupairs:
                rating = np.random.randint(1, 6)
                ratings_data.append([parent_id, aupair_id, rating])
        
        self.ratings_df = pd.DataFrame(ratings_data, columns=['parent_id', 'aupair_id', 'rating'])
    
    def generate_skill_preference(self):
        """Generate random skill preferences"""
        skills = ['Memasak', 'First-Aid', 'Mengemudi', 'Berenang', 'Komputer', 'Musik', 'Olahraga']
        n_skills = np.random.randint(1, 4)
        selected_skills = np.random.choice(skills, n_skills, replace=False)
        return ' '.join(selected_skills)
    
    def load_data(self):
        """Load data (already created in memory)"""
        if self.aupair_df is None:
            raise Exception("No data available")
    
    def preprocess_data(self):
        """Preprocess the data"""
        # Create combined skills string for au pairs
        skill_columns = ['memasak', 'first_aid', 'mengemudi', 'berenang', 'komputer', 'musik', 'olahraga']
        skill_names = ['Memasak', 'First-Aid', 'Mengemudi', 'Berenang', 'Komputer', 'Musik', 'Olahraga']
        
        def create_skills_string(row):
            skills = []
            for i, col in enumerate(skill_columns):
                if row[col] == 1:
                    skills.append(skill_names[i])
            return ' '.join(skills)
        
        self.aupair_df['skills_combined'] = self.aupair_df.apply(create_skills_string, axis=1)
    
    def build_content_based_model(self):
        """Build content-based filtering model"""
        # Initialize TF-IDF vectorizer
        self.tfidf_vectorizer = TfidfVectorizer(stop_words='english')
        
        # Use combined skills and other text features
        text_features = self.aupair_df['skills_combined'].fillna('')
        
        # Create TF-IDF matrix
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(text_features)
        
        # Calculate cosine similarity
        self.cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    
    def build_collaborative_filtering_model(self):
        """Build collaborative filtering model using basic matrix factorization"""
        try:
            from surprise import Dataset, Reader, SVD
            from surprise.model_selection import train_test_split
            
            # Prepare data for Surprise library
            reader = Reader(rating_scale=(1, 5))
            data = Dataset.load_from_df(self.ratings_df[['parent_id', 'aupair_id', 'rating']], reader)
            
            # Split data
            trainset, testset = train_test_split(data, test_size=0.25, random_state=42)
            
            # Train SVD model
            self.svd_model = SVD(n_factors=10, n_epochs=20, lr_all=0.005, reg_all=0.02)
            self.svd_model.fit(trainset)
            
        except ImportError:
            # Fallback to simple collaborative filtering without surprise
            self.svd_model = None
    
    def get_content_recommendations(self, parent_requirements, limit=10):
        """Get content-based recommendations"""
        if not self.is_loaded:
            return {"success": False, "error": "Model not loaded"}
        
        try:
            required_skills = parent_requirements.get('skills', [])
            location_pref = parent_requirements.get('location', '')
            gender_pref = parent_requirements.get('gender', '')
            
            scores = []
            for idx, aupair in self.aupair_df.iterrows():
                if aupair['status_availability'] != 'Available':
                    continue
                
                score = 0
                explanation = []
                
                # Skill matching
                aupair_skills = aupair['skills_combined'].split()
                if required_skills:
                    skill_match = len(set(required_skills) & set(aupair_skills)) / len(required_skills)
                    score += skill_match * 0.6
                    if skill_match > 0.5:
                        explanation.append(f"Good skill match ({skill_match*100:.0f}%)")
                
                # Location preference
                if location_pref and location_pref.lower() in aupair['provinsi'].lower():
                    score += 0.2
                    explanation.append("Same location")
                
                # Gender preference
                if not gender_pref or gender_pref == aupair['jenis_kelamin']:
                    score += 0.1
                    if gender_pref and gender_pref != 'Tidak-Ada-Preferensi':
                        explanation.append("Matches gender preference")
                
                # Rating bonus
                score += (aupair['rating_avg'] / 5.0) * 0.1
                
                scores.append({
                    'id': int(aupair['id_au_pair']),
                    'name': aupair['nama'],
                    'age': int(aupair['usia']),
                    'gender': aupair['jenis_kelamin'],
                    'location': aupair['provinsi'],
                    'skills': aupair['skills_combined'],
                    'rating': float(aupair['rating_avg']),
                    'experience': int(aupair['pengalaman_tahun']),
                    'compatibility_score': round(score * 100, 1),
                    'explanation': '; '.join(explanation) if explanation else 'Basic compatibility'
                })
            
            # Sort by score and return top recommendations
            scores.sort(key=lambda x: x['compatibility_score'], reverse=True)
            return {
                "success": True,
                "recommendations": scores[:limit],
                "algorithm": "content-based"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_collaborative_recommendations(self, parent_id, limit=10):
        """Get collaborative filtering recommendations"""
        if not self.is_loaded or self.svd_model is None:
            return {"success": False, "error": "Collaborative model not available"}
        
        try:
            # Get au pairs this parent hasn't rated
            rated_aupairs = self.ratings_df[self.ratings_df['parent_id'] == parent_id]['aupair_id'].tolist()
            unrated_aupairs = self.aupair_df[~self.aupair_df['id_au_pair'].isin(rated_aupairs)]
            
            predictions = []
            for _, aupair in unrated_aupairs.iterrows():
                if aupair['status_availability'] == 'Available':
                    pred = self.svd_model.predict(parent_id, aupair['id_au_pair'])
                    predictions.append({
                        'id': int(aupair['id_au_pair']),
                        'name': aupair['nama'],
                        'age': int(aupair['usia']),
                        'gender': aupair['jenis_kelamin'],
                        'location': aupair['provinsi'],
                        'skills': aupair['skills_combined'],
                        'rating': float(aupair['rating_avg']),
                        'experience': int(aupair['pengalaman_tahun']),
                        'compatibility_score': round(pred.est * 20, 1),
                        'explanation': 'Recommended by similar parents'
                    })
            
            # Sort by predicted rating
            predictions.sort(key=lambda x: x['compatibility_score'], reverse=True)
            return {
                "success": True,
                "recommendations": predictions[:limit],
                "algorithm": "collaborative"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_hybrid_recommendations(self, parent_id, parent_requirements, limit=10):
        """Get hybrid recommendations combining content and collaborative"""
        try:
            # Get both types of recommendations
            content_recs = self.get_content_recommendations(parent_requirements, limit * 2)
            collab_recs = self.get_collaborative_recommendations(parent_id, limit * 2)
            
            # Combine scores
            combined_scores = {}
            
            # Add content-based scores (weight: 0.6)
            if content_recs["success"]:
                for rec in content_recs["recommendations"]:
                    combined_scores[rec['id']] = {
                        **rec,
                        'score': rec['compatibility_score'] * 0.6,
                        'explanations': [rec['explanation']]
                    }
            
            # Add collaborative scores (weight: 0.4)
            if collab_recs["success"]:
                for rec in collab_recs["recommendations"]:
                    if rec['id'] in combined_scores:
                        combined_scores[rec['id']]['score'] += rec['compatibility_score'] * 0.4
                        combined_scores[rec['id']]['explanations'].append('Similar parents liked this au pair')
                    else:
                        combined_scores[rec['id']] = {
                            **rec,
                            'score': rec['compatibility_score'] * 0.4,
                            'explanations': [rec['explanation']]
                        }
            
            # Convert to list and sort
            hybrid_results = list(combined_scores.values())
            for result in hybrid_results:
                result['compatibility_score'] = round(result['score'], 1)
                result['explanation'] = '; '.join(result['explanations'])
                del result['score']
                del result['explanations']
            
            hybrid_results.sort(key=lambda x: x['compatibility_score'], reverse=True)
            
            return {
                "success": True,
                "recommendations": hybrid_results[:limit],
                "algorithm": "hybrid"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def save_model(self):
        """Save the trained model to pickle file"""
        try:
            model_data = {
                'aupair_df': self.aupair_df,
                'parent_df': self.parent_df,
                'ratings_df': self.ratings_df,
                'tfidf_vectorizer': self.tfidf_vectorizer,
                'cosine_sim': self.cosine_sim,
                'svd_model': self.svd_model
            }
            
            with open(self.model_path, 'wb') as f:
                pickle.dump(model_data, f)
            
            return {"success": True, "message": f"Model saved to {self.model_path}"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}

def main():
    """Main function to handle command line interface"""
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No command provided"}))
        return
    
    command = sys.argv[1]
    service = MLRecommendationService()
    
    try:
        if command == "load":
            result = service.load_model()
            print(json.dumps(result))
            
        elif command == "recommend":
            # Load model first
            load_result = service.load_model()
            if not load_result["success"]:
                print(json.dumps(load_result))
                return
            
            # Parse recommendation parameters
            if len(sys.argv) < 3:
                print(json.dumps({"success": False, "error": "No parameters provided"}))
                return
            
            params = json.loads(sys.argv[2])
            algorithm = params.get('algorithm', 'hybrid')
            limit = params.get('limit', 10)
            
            if algorithm == 'content':
                parent_requirements = params.get('parent_requirements', {})
                result = service.get_content_recommendations(parent_requirements, limit)
            elif algorithm == 'collaborative':
                parent_id = params.get('parent_id')
                if not parent_id:
                    print(json.dumps({"success": False, "error": "Parent ID required for collaborative filtering"}))
                    return
                result = service.get_collaborative_recommendations(parent_id, limit)
            elif algorithm == 'hybrid':
                parent_id = params.get('parent_id')
                parent_requirements = params.get('parent_requirements', {})
                if not parent_id:
                    print(json.dumps({"success": False, "error": "Parent ID required for hybrid recommendations"}))
                    return
                result = service.get_hybrid_recommendations(parent_id, parent_requirements, limit)
            else:
                result = {"success": False, "error": "Invalid algorithm"}
            
            print(json.dumps(result))
            
        elif command == "train":
            result = service.create_and_train_model()
            print(json.dumps(result))
            
        else:
            print(json.dumps({"success": False, "error": f"Unknown command: {command}"}))
            
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()