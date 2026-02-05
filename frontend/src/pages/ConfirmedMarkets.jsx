import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { 
  CheckCircle, 
  MapPin, 
  Truck, 
  AlertTriangle,
  ExternalLink,
  Loader2,
  Trash2,
  Check,
  Search,
  ArrowLeft,
  Eye,
  Map
} from 'lucide-react';
import { analyzeAPI } from '../services/api';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const farmerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const marketIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function ConfirmedMarkets() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [confirmedMarkets, setConfirmedMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadConfirmedMarkets();
  }, []);

  const loadConfirmedMarkets = async () => {
    try {
      setLoading(true);
      const res = await analyzeAPI.getConfirmed();
      setConfirmedMarkets(res.data);
      if (res.data.length > 0) {
        setSelectedMarket(res.data[0]);
      }
    } catch (error) {
      console.error('Failed to load confirmed markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      setCompletingId(id);
      await analyzeAPI.completeTransaction(id);
      setConfirmedMarkets(prev => 
        prev.map(m => m.id === id ? { ...m, status: 'completed' } : m)
      );
    } catch (error) {
      console.error('Failed to complete:', error);
    } finally {
      setCompletingId(null);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm(t('confirmed.cancelConfirmation'))) return;
    
    try {
      setCancellingId(id);
      await analyzeAPI.cancelConfirmed(id);
      setConfirmedMarkets(prev => prev.filter(m => m.id !== id));
      if (selectedMarket?.id === id) {
        setSelectedMarket(confirmedMarkets.find(m => m.id !== id) || null);
      }
    } catch (error) {
      console.error('Failed to cancel:', error);
    } finally {
      setCancellingId(null);
    }
  };

  const openInMaps = (market) => {
    const url = `https://www.google.com/maps/dir/?api=1&origin=${market.farmerLocation.latitude},${market.farmerLocation.longitude}&destination=${market.marketLatitude},${market.marketLongitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const getSpoilageColor = (risk) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (confirmedMarkets.length === 0) {
    return (
      <div className="card text-center py-12">
        <CheckCircle size={48} className="mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('confirmed.noConfirmedTitle')}</h3>
        <p className="text-gray-500 mb-4">
          {t('confirmed.noConfirmedDesc')}
        </p>
        <button
          onClick={() => navigate('/analyze')}
          className="btn-primary"
        >
          {t('dashboard.analyzeMarkets')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CheckCircle className="text-primary-600" />
          {t('confirmed.title')}
        </h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
          placeholder={t('confirmed.searchPlaceholder')}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Market List */}
        <div className="space-y-4">
          {confirmedMarkets
            .filter(m => m.marketName.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((market) => (
            <div
              key={market.id}
              onClick={() => setSelectedMarket(market)}
              className={`card cursor-pointer transition-all ${
                selectedMarket?.id === market.id 
                  ? 'ring-2 ring-primary-500' 
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold">{market.marketName}</h3>
                    {market.status === 'completed' && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 text-xs rounded-full">
                        {t('confirmed.completed')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin size={14} />
                    {market.marketLocation}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    ₹{market.expectedProfit.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{t('common.expectedProfit')}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500">{t('common.crop')}</p>
                  <p className="font-medium text-sm">{market.cropName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('common.weight')}</p>
                  <p className="font-medium text-sm">{market.weightKg} kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('common.transport')}</p>
                  <p className="font-medium text-sm">₹{market.transportCost}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getSpoilageColor(market.spoilageRisk)}`}>
                  <AlertTriangle size={12} />
                  {market.spoilageRisk} {t('common.risk')}
                </span>
                
                <div className="flex gap-2">
                  {/* View Maps Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openInMaps(market);
                    }}
                    className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1"
                  >
                    <Map size={14} />
                    {t('confirmed.viewMaps')}
                  </button>
                  
                  {/* View Details Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/market/${market.marketId}`);
                    }}
                    className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1"
                  >
                    <Eye size={14} />
                    {t('confirmed.viewDetails')}
                  </button>
                  
                  {market.status !== 'completed' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComplete(market.id);
                        }}
                        disabled={completingId === market.id}
                        className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1"
                      >
                        {completingId === market.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Check size={14} />
                        )}
                        {t('confirmed.complete')}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(market.id);
                        }}
                        disabled={cancellingId === market.id}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                      >
                        {cancellingId === market.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Map View */}
        {selectedMarket && (
          <div className="card p-0 overflow-hidden h-[500px] lg:sticky lg:top-20">
            <MapContainer
              center={[
                (selectedMarket.farmerLocation.latitude + selectedMarket.marketLatitude) / 2,
                (selectedMarket.farmerLocation.longitude + selectedMarket.marketLongitude) / 2
              ]}
              zoom={8}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Farmer marker */}
              <Marker 
                position={[selectedMarket.farmerLocation.latitude, selectedMarket.farmerLocation.longitude]}
                icon={farmerIcon}
              >
                <Popup>
                  <strong>{t('confirmed.yourLocation')}</strong><br />
                  {selectedMarket.farmerLocation.name}
                </Popup>
              </Marker>
              
              {/* Market marker */}
              <Marker 
                position={[selectedMarket.marketLatitude, selectedMarket.marketLongitude]}
                icon={marketIcon}
              >
                <Popup>
                  <strong>{selectedMarket.marketName}</strong><br />
                  {selectedMarket.marketLocation}
                </Popup>
              </Marker>
              
              {/* Route line */}
              <Polyline
                positions={[
                  [selectedMarket.farmerLocation.latitude, selectedMarket.farmerLocation.longitude],
                  [selectedMarket.marketLatitude, selectedMarket.marketLongitude]
                ]}
                color="#22c55e"
                weight={3}
                dashArray="10, 10"
              />
            </MapContainer>

            {/* Map overlay info */}
            <div className="absolute bottom-0 left-0 right-0 bg-white/90 dark:bg-black/90 p-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">{selectedMarket.marketName}</p>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Truck size={14} />
                    Transport: ₹{selectedMarket.transportCost}
                  </p>
                </div>
                <button
                  onClick={() => openInMaps(selectedMarket)}
                  className="btn-primary flex items-center gap-2"
                >
                  <ExternalLink size={18} />
                  {t('common.openInMaps')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
