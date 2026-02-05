import { useState, useEffect } from 'react';
import { X, MapPin, Search, Loader2, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cropsAPI, farmerAPI } from '../services/api';

export default function AddCropModal({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const [crops, setCrops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [address, setAddress] = useState({ street: '', city: '', pincode: '' });
  const [location, setLocation] = useState({ name: '', latitude: null, longitude: null });
  const [loading, setLoading] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCrops();
    loadUserLocation();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      setFilteredCrops(
        crops.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else {
      setFilteredCrops(crops);
    }
  }, [searchQuery, crops]);

  const loadCrops = async () => {
    try {
      const res = await cropsAPI.getAll();
      setCrops(res.data);
      setFilteredCrops(res.data);
    } catch (error) {
      console.error('Failed to load crops:', error);
    }
  };

  const loadUserLocation = async () => {
    try {
      const res = await farmerAPI.getProfile();
      if (res.data.location) {
        setLocation(res.data.location);
        // If we have a location, try to get the address
        if (res.data.location.name) {
          const parts = res.data.location.name.split(',').map(p => p.trim());
          if (parts.length >= 1) setAddress(prev => ({ ...prev, city: parts[0] }));
        }
      }
    } catch (error) {
      console.error('Failed to load user location:', error);
    }
  };

  const geocodeAddress = async () => {
    if (!address.street && !address.city && !address.pincode) {
      setError(t('addCrop.errorCityPincode'));
      return;
    }

    setLoadingLocation(true);
    setError('');

    try {
      const query = [address.street, address.city, address.pincode].filter(Boolean).join(', ');
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await res.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setLocation({
          name: display_name,
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
        });
        
        // Update user location
        await farmerAPI.updateLocation(display_name, parseFloat(lat), parseFloat(lon));
      } else {
        setError(t('addCrop.errorLocationNotFound'));
      }
    } catch (err) {
      setError(t('addCrop.errorGeocodeFailed'));
    } finally {
      setLoadingLocation(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError(t('addCrop.errorGeolocationNotSupported'));
      return;
    }

    setLoadingLocation(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode using Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          
          // Extract address components
          const addressData = data.address || {};
          const locationName = addressData.village || addressData.town || 
                               addressData.city || addressData.county || 'Current Location';
          const street = addressData.road || addressData.neighbourhood || '';
          const city = addressData.city || addressData.town || addressData.village || addressData.county || '';
          const pincode = addressData.postcode || '';
          
          // Fill in the address fields
          setAddress({
            street: street,
            city: city,
            pincode: pincode
          });
          
          setLocation({ name: data.display_name || locationName, latitude, longitude });
          
          // Update user location in backend
          await farmerAPI.updateLocation(data.display_name || locationName, latitude, longitude);
        } catch (err) {
          setLocation({ name: 'Current Location', latitude, longitude });
        }
        setLoadingLocation(false);
      },
      (err) => {
        setError(t('addCrop.errorGetLocation') + ' ' + err.message);
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const addCrop = (crop) => {
    if (selectedCrops.find(c => c.cropId === crop.id)) return;
    
    setSelectedCrops([
      ...selectedCrops,
      {
        cropId: crop.id,
        cropName: crop.name,
        weightKg: '',
        harvestDate: new Date().toISOString().split('T')[0]
      }
    ]);
  };

  const removeCrop = (cropId) => {
    setSelectedCrops(selectedCrops.filter(c => c.cropId !== cropId));
  };

  const updateCrop = (cropId, field, value) => {
    setSelectedCrops(
      selectedCrops.map(c => 
        c.cropId === cropId ? { ...c, [field]: value } : c
      )
    );
  };

  const handleSubmit = async () => {
    if (!location.latitude || !location.longitude) {
      setError(t('addCrop.errorSetLocation'));
      return;
    }

    if (selectedCrops.length === 0) {
      setError(t('addCrop.errorAddCrop'));
      return;
    }

    const invalidCrop = selectedCrops.find(c => !c.weightKg || parseFloat(c.weightKg) <= 0);
    if (invalidCrop) {
      setError(t('addCrop.errorValidWeight'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Add each crop
      for (const crop of selectedCrops) {
        await farmerAPI.addCrop(crop.cropId, parseFloat(crop.weightKg), crop.harvestDate);
      }
      
      onSuccess();
    } catch (err) {
      setError(t('addCrop.errorSaveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      
      <div className="relative bg-white dark:bg-amoled-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold">{t('addCrop.title')}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Location - Address Based */}
          <div className="space-y-3">
            <label className="label flex items-center gap-2">
              <Home size={16} />
              {t('addCrop.farmAddress')}
            </label>
            
            <input
              type="text"
              value={address.street}
              onChange={(e) => setAddress({ ...address, street: e.target.value })}
              className="input"
              placeholder={t('addCrop.streetPlaceholder')}
            />
            
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                className="input"
                placeholder={t('addCrop.cityPlaceholder')}
              />
              <input
                type="text"
                value={address.pincode}
                onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                className="input"
                placeholder={t('addCrop.pincodePlaceholder')}
                maxLength={6}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={geocodeAddress}
                disabled={loadingLocation}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loadingLocation ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MapPin size={18} />
                )}
                {t('addCrop.setLocation')}
              </button>
              <button
                onClick={getCurrentLocation}
                disabled={loadingLocation}
                className="btn-secondary px-4 flex items-center gap-2"
                title={t('addCrop.useGps')}
              >
                {loadingLocation ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <MapPin size={18} />
                )}
                {t('addCrop.gps')}
              </button>
            </div>

            {location.latitude && (
              <p className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                {t('addCrop.locationSet')} {location.name?.substring(0, 50)}...
              </p>
            )}
          </div>

          {/* Search Crops */}
          <div>
            <label className="label">{t('addCrop.searchCrops')}</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
                placeholder={t('addCrop.searchPlaceholder')}
              />
            </div>
            
            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              {filteredCrops.map(crop => (
                <button
                  key={crop.id}
                  onClick={() => addCrop(crop)}
                  disabled={selectedCrops.find(c => c.cropId === crop.id)}
                  className={`w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 
                    ${selectedCrops.find(c => c.cropId === crop.id) ? 'opacity-50' : ''}`}
                >
                  <span className="font-medium">{crop.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({crop.category})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Crops */}
          {selectedCrops.length > 0 && (
            <div>
              <label className="label">{t('addCrop.selectedCrops')}</label>
              <div className="space-y-3">
                {selectedCrops.map((crop) => (
                  <div key={crop.cropId} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{crop.cropName}</span>
                      <button
                        onClick={() => removeCrop(crop.cropId)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500">{t('addCrop.weightKg')}</label>
                        <input
                          type="number"
                          value={crop.weightKg}
                          onChange={(e) => updateCrop(crop.cropId, 'weightKg', e.target.value)}
                          className="input py-2"
                          placeholder={t('addCrop.weightPlaceholder')}
                          min="0.1"
                          step="0.1"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">{t('addCrop.harvestDate')}</label>
                        <input
                          type="date"
                          value={crop.harvestDate}
                          onChange={(e) => updateCrop(crop.cropId, 'harvestDate', e.target.value)}
                          className="input py-2"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSubmit}
            disabled={loading || selectedCrops.length === 0}
            className="w-full btn-primary py-3 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                {t('addCrop.saving')}
              </>
            ) : (
              t('addCrop.saveAnalyze')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
