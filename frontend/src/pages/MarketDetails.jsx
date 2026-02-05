import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { 
  MapPin, 
  TrendingUp, 
  Clock,
  ArrowLeft,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { marketsAPI, cropsAPI, farmerAPI } from '../services/api';
import { format } from 'date-fns';

// Helper function to format dates based on time period
const getDateFormat = (period) => {
  switch (period) {
    case '1d': return 'HH:mm';      // Hourly for 1 day
    case '1m': return 'd MMM';       // Day Month for 1 month
    case '5m': return 'd MMM';       // Day Month for 5 months
    case '1y': return 'MMM yyyy';    // Month Year for 1 year
    case 'max': return 'MMM yyyy';   // Month Year for max
    default: return 'd MMM';
  }
};

// Helper to calculate interval based on data length and period
const getTickInterval = (dataLength, period) => {
  switch (period) {
    case '1d': return Math.ceil(dataLength / 8);   // ~8 labels for 1 day
    case '1m': return Math.ceil(dataLength / 10);  // ~10 labels for 1 month
    case '5m': return Math.ceil(dataLength / 12);  // ~12 labels for 5 months
    case '1y': return Math.ceil(dataLength / 12);  // ~12 labels for 1 year
    case 'max': return Math.ceil(dataLength / 15); // ~15 labels for max
    default: return 0;
  }
};

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MarketDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState(null);
  const [priceHistory, setPriceHistory] = useState(null);
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [pricePeriod, setPricePeriod] = useState('1m');
  const [farmerLocation, setFarmerLocation] = useState(null);

  useEffect(() => {
    loadMarket();
    loadCrops();
    loadFarmerLocation();
  }, [id]);

  useEffect(() => {
    if (market) {
      loadPriceHistory();
    }
  }, [market, selectedCrop, pricePeriod]);

  const loadMarket = async () => {
    try {
      setLoading(true);
      const res = await marketsAPI.getDetails(id);
      setMarket(res.data);
    } catch (error) {
      console.error('Failed to load market:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCrops = async () => {
    try {
      const res = await cropsAPI.getAll();
      setCrops(res.data);
    } catch (error) {
      console.error('Failed to load crops:', error);
    }
  };

  const loadPriceHistory = async () => {
    try {
      const res = await marketsAPI.getPriceHistory(id, selectedCrop?.id, pricePeriod);
      setPriceHistory(res.data);
    } catch (error) {
      console.error('Failed to load price history:', error);
    }
  };

  const loadFarmerLocation = async () => {
    try {
      const res = await farmerAPI.getProfile();
      if (res.data?.latitude && res.data?.longitude) {
        setFarmerLocation({ latitude: res.data.latitude, longitude: res.data.longitude });
      }
    } catch (error) {
      console.error('Failed to load farmer location:', error);
    }
  };

  const openInMaps = () => {
    let url;
    if (farmerLocation) {
      // Open Google Maps with directions from farmer location to market
      url = `https://www.google.com/maps/dir/?api=1&origin=${farmerLocation.latitude},${farmerLocation.longitude}&destination=${market.latitude},${market.longitude}&travelmode=driving`;
    } else {
      // Fallback: just show market location
      url = `https://www.google.com/maps/search/?api=1&query=${market.latitude},${market.longitude}`;
    }
    window.open(url, '_blank');
  };

  const periodOptions = [
    { value: '1d', label: t('period.1d') },
    { value: '1m', label: t('period.1m') },
    { value: '5m', label: t('period.5m') },
    { value: '1y', label: t('period.1y') },
    { value: 'max', label: t('period.max') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  if (!market) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">{t('marketDetails.notFound')}</p>
        <button onClick={() => navigate(-1)} className="btn-primary mt-4">
          {t('marketDetails.goBack')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft size={20} />
        {t('marketDetails.back')}
      </button>

      {/* Market Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{market.name}</h1>
            <p className="text-gray-500 flex items-center gap-1 mt-1">
              <MapPin size={16} />
              {market.locationName}
            </p>
          </div>
          <button
            onClick={openInMaps}
            className="btn-secondary flex items-center gap-2"
          >
            <ExternalLink size={18} />
            {t('common.viewOnMap')}
          </button>
        </div>
      </div>

      {/* Map */}
      <div className="card p-0 overflow-hidden h-64">
        <MapContainer
          center={[market.latitude, market.longitude]}
          zoom={13}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[market.latitude, market.longitude]}>
            <Popup>
              <strong>{market.name}</strong><br />
              {market.locationName}
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Current Demands */}
      {market.demands && market.demands.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary-600" />
            {t('marketDetails.currentDemands')}
          </h2>
          <div className="space-y-3">
            {market.demands.map((demand) => (
              <div
                key={demand.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div>
                  <p className="font-medium">{demand.cropName}</p>
                  <p className="text-sm text-gray-500">
                    {t('common.needs')}: {demand.quantityNeeded} kg
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    ₹{demand.pricePerKg}/kg
                  </p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                    <Clock size={12} />
                    {t('common.validUntil')} {format(new Date(demand.validUntil), 'MMM d')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price History */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold">{t('marketDetails.priceHistory')}</h2>
          <div className="flex gap-2">
            <select
              value={selectedCrop?.id || ''}
              onChange={(e) => {
                const crop = crops.find(c => c.id === parseInt(e.target.value));
                setSelectedCrop(crop || null);
              }}
              className="input w-auto py-1.5 px-3 text-sm"
            >
              <option value="">{t('dashboard.allCrops')}</option>
              {crops.map(crop => (
                <option key={crop.id} value={crop.id}>{crop.name}</option>
              ))}
            </select>
            
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {periodOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPricePeriod(opt.value)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    pricePeriod === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {priceHistory && priceHistory.history.length > 0 ? (
          <>
            <div className="overflow-x-auto pb-2">
              <div style={{ minWidth: priceHistory.history.length > 15 ? `${priceHistory.history.length * 50}px` : '100%', height: '256px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistory.history} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(date) => format(new Date(date), getDateFormat(pricePeriod))}
                      tick={{ fontSize: 11 }}
                      interval={getTickInterval(priceHistory.history.length, pricePeriod)}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis 
                      tick={{ fontSize: 11 }}
                      tickFormatter={(value) => `₹${value}`}
                      width={50}
                    />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date), 'PPP')}
                      formatter={(value) => [`₹${value}`, t('common.price')]}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="price" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-1">← Scroll horizontally to see more →</p>

            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <p className="text-sm text-gray-500">{t('common.highest')}</p>
                <p className="text-xl font-bold text-green-600">₹{priceHistory.stats.highest}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">{t('common.lowest')}</p>
                <p className="text-xl font-bold text-red-600">₹{priceHistory.stats.lowest}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500">{t('common.average')}</p>
                <p className="text-xl font-bold text-blue-600">₹{priceHistory.stats.average.toFixed(2)}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            {t('dashboard.noPriceData')}
          </div>
        )}
      </div>
    </div>
  );
}
