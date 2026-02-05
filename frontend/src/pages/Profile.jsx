import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  Sun, 
  Moon,
  LogOut,
  Loader2,
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { farmerAPI, authAPI } from '../services/api';
import { format } from 'date-fns';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState(null);
  const [crops, setCrops] = useState([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const [profileRes, cropsRes] = await Promise.all([
        farmerAPI.getProfile(),
        farmerAPI.getCrops()
      ]);
      
      setProfile(profileRes.data);
      setCrops(cropsRes.data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setTheme(newTheme);
    try {
      await authAPI.updateTheme(newTheme);
      updateUser({ themePreference: newTheme });
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };

  const handleDeleteCrop = async (id) => {
    try {
      await farmerAPI.deleteCrop(id);
      setCrops(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      console.error('Failed to delete crop:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <User className="text-primary-600" />
          {t('profile.title')}
        </h1>
      </div>

      {/* User Info */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">{t('profile.account')}</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500">{t('profile.name')}</label>
            <p className="font-medium">{profile?.fullName || user?.fullName}</p>
          </div>
          <div>
            <label className="text-sm text-gray-500">{t('profile.email')}</label>
            <p className="font-medium">{profile?.email || user?.email}</p>
          </div>
        </div>
      </div>

      {/* Theme */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">{t('profile.appearance')}</h2>
        <div className="flex gap-3">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              theme === 'light'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <Sun size={24} className="mx-auto mb-2" />
            <p className="font-medium text-center">{t('profile.light')}</p>
          </button>
          
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex-1 p-4 rounded-lg border-2 transition-colors ${
              theme === 'dark'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}
          >
            <Moon size={24} className="mx-auto mb-2" />
            <p className="font-medium text-center">{t('profile.amoledDark')}</p>
          </button>
        </div>
      </div>

      {/* Your Crops */}
      {crops.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">{t('profile.yourCrops')}</h2>
          <div className="space-y-2">
            {crops.map((crop) => (
              <div
                key={crop.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{crop.cropName}</p>
                  <p className="text-sm text-gray-500">
                    {crop.weightKg} kg • {t('common.harvested')} {format(new Date(crop.harvestDate), 'MMM d, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteCrop(crop.id)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full btn-secondary py-3 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
      >
        <LogOut size={20} />
        {t('nav.logout')}
      </button>
    </div>
  );
}
