import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, 
  Plus, 
  ChevronDown,
  MapPin,
  Calendar,
  ArrowRight,
  Loader2,
  Search,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot, AreaChart, Area, BarChart, Bar } from 'recharts';
import { farmerAPI, marketsAPI, cropsAPI } from '../services/api';
import { format } from 'date-fns';
import AddCropModal from '../components/AddCropModal';

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

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profitPeriod, setProfitPeriod] = useState('max');
  const [profitData, setProfitData] = useState(null);
  const [topMarkets, setTopMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [priceHistory, setPriceHistory] = useState(null);
  const [pricePeriod, setPricePeriod] = useState('1m');
  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [expandedMarkets, setExpandedMarkets] = useState(false);
  const [marketSearch, setMarketSearch] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    loadProfitData();
  }, [profitPeriod]);

  useEffect(() => {
    if (selectedMarket) {
      loadPriceHistory();
    }
  }, [selectedMarket, pricePeriod, selectedCrop]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [profitRes, marketsRes, cropsRes] = await Promise.all([
        farmerAPI.getProfitSummary(profitPeriod),
        marketsAPI.getTop(),
        cropsAPI.getAll()
      ]);
      
      setProfitData(profitRes.data);
      setTopMarkets(marketsRes.data);
      setCrops(cropsRes.data);
      
      if (marketsRes.data.length > 0) {
        setSelectedMarket(marketsRes.data[0]);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfitData = async () => {
    try {
      const res = await farmerAPI.getProfitSummary(profitPeriod);
      setProfitData(res.data);
    } catch (error) {
      console.error('Failed to load profit data:', error);
    }
  };

  const loadPriceHistory = async () => {
    try {
      const res = await marketsAPI.getPriceHistory(
        selectedMarket.id, 
        selectedCrop?.id, 
        pricePeriod
      );
      setPriceHistory(res.data);
    } catch (error) {
      console.error('Failed to load price history:', error);
    }
  };

  const periodOptions = [
    { value: '1d', label: t('period.1day') },
    { value: '1m', label: t('period.1month') },
    { value: '5m', label: t('period.5months') },
    { value: '1y', label: t('period.1year') },
    { value: 'max', label: t('period.max') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 size={40} className="animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Grid Layout - Buttons Left, Top Market Right */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Side - Action Buttons */}
        <div className="space-y-4">
          {/* Add Crop Button */}
          <button
            onClick={() => setShowAddCrop(true)}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg"
          >
            <Plus size={24} />
            {t('dashboard.addCropDetails')}
          </button>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/confirmed')}
              className="card py-4 flex flex-col items-center justify-center gap-2 hover:ring-2 hover:ring-primary-500 transition-all"
            >
              <CheckCircle size={28} className="text-green-600" />
              <span className="font-medium">{t('dashboard.confirmedMarkets')}</span>
            </button>
            
            <button
              onClick={() => navigate('/analyze')}
              className="card py-4 flex flex-col items-center justify-center gap-2 hover:ring-2 hover:ring-primary-500 transition-all"
            >
              <BarChart3 size={28} className="text-blue-600" />
              <span className="font-medium">{t('dashboard.analyzeMarkets')}</span>
            </button>
          </div>

          {/* Profit Dashboard */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="text-primary-600" size={22} />
                {t('dashboard.profitDashboard')}
              </h2>
              <select
                value={profitPeriod}
                onChange={(e) => setProfitPeriod(e.target.value)}
                className="input w-auto py-1.5 px-3 text-sm"
              >
                {periodOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.netProfit')}</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{profitData?.netProfit?.toLocaleString() || 0}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.transactions')}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {profitData?.totalTransactions || 0}
                </p>
              </div>
            </div>

            {/* Profit Visualization */}
            {profitData?.history && profitData.history.length > 0 ? (
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={profitData.history} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(date) => format(new Date(date), 'd MMM')}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => `₹${(value/1000).toFixed(0)}k`}
                      width={45}
                    />
                    <Tooltip 
                      labelFormatter={(date) => format(new Date(date), 'PPP')}
                      formatter={(value) => [`₹${value.toLocaleString()}`, t('common.profit')]}
                    />
                    <Bar 
                      dataKey="profit" 
                      fill="#22c55e"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <p className="text-sm text-gray-500">{t('dashboard.profitTrends')}</p>
              </div>
            )}
          </div>

          {/* Top Markets with Search */}
          <div className="card">
            <button
              onClick={() => setExpandedMarkets(!expandedMarkets)}
              className="w-full flex items-center justify-between"
            >
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MapPin className="text-primary-600" size={22} />
                {t('dashboard.top10Markets')}
              </h2>
              <ChevronDown 
                size={22} 
                className={`transition-transform ${expandedMarkets ? 'rotate-180' : ''}`} 
              />
            </button>

            {expandedMarkets && (
              <div className="mt-4 space-y-3">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={marketSearch}
                    onChange={(e) => setMarketSearch(e.target.value)}
                    className="input pl-10"
                    placeholder={t('dashboard.searchMarketsPlaceholder')}
                  />
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {topMarkets
                    .filter(m => m.name.toLowerCase().includes(marketSearch.toLowerCase()))
                    .map((market) => (
                      <button
                        key={market.id}
                        onClick={() => setSelectedMarket(market)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedMarket?.id === market.id
                            ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                            : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="inline-block w-6 h-6 bg-primary-600 text-white rounded-full text-center text-sm mr-2">
                              {market.rank}
                            </span>
                            <span className="font-medium">{market.name}</span>
                          </div>
                          <ArrowRight size={18} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 mt-1 ml-8">{market.locationName}</p>
                      </button>
                    ))}
                </div>
              </div>
            )}

            {!expandedMarkets && selectedMarket && (
              <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
                <p className="font-medium">{selectedMarket.name}</p>
                <p className="text-sm text-gray-500">{selectedMarket.locationName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Top Market Price Visualization */}
        {selectedMarket && (
          <div className="card h-fit">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-bold">{selectedMarket.name}</h2>
                <p className="text-sm text-gray-500">{t('dashboard.topPerformingMarket')}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
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
                <select
                  value={pricePeriod}
                  onChange={(e) => setPricePeriod(e.target.value)}
                  className="input w-auto py-1.5 px-3 text-sm"
                >
                  {periodOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {priceHistory && priceHistory.history.length > 0 ? (
              <>
                <div className="overflow-x-auto pb-2">
                  <div style={{ minWidth: priceHistory.history.length > 15 ? `${priceHistory.history.length * 40}px` : '100%', height: '288px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={priceHistory.history}
                        margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                      >
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => {
                            const d = new Date(date);
                            return format(d, getDateFormat(pricePeriod));
                          }}
                          tick={{ fontSize: 11 }}
                          interval={getTickInterval(priceHistory.history.length, pricePeriod)}
                          angle={-45}
                          textAnchor="end"
                          height={50}
                        />
                        <YAxis 
                          tick={{ fontSize: 11 }}
                          tickFormatter={(value) => `₹${value}`}
                          width={60}
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
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        {/* Highlight highest and lowest */}
                        <ReferenceDot 
                          x={priceHistory.history.find(h => h.price === priceHistory.stats.highest)?.date}
                          y={priceHistory.stats.highest}
                          r={8}
                          fill="#22c55e"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                        <ReferenceDot 
                          x={priceHistory.history.find(h => h.price === priceHistory.stats.lowest)?.date}
                          y={priceHistory.stats.lowest}
                          r={8}
                          fill="#ef4444"
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-1">{t('dashboard.scrollHint')}</p>

                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">{t('common.highest')}</p>
                    <p className="text-lg font-bold text-green-600">₹{priceHistory.stats.highest}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">{t('common.lowest')}</p>
                    <p className="text-lg font-bold text-red-600">₹{priceHistory.stats.lowest}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">{t('common.average')}</p>
                    <p className="text-lg font-bold text-blue-600">₹{priceHistory.stats.average.toFixed(2)}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500">
                {t('dashboard.noPriceData')}
              </div>
            )}

            <button
              onClick={() => navigate(`/market/${selectedMarket.id}`)}
              className="w-full mt-4 btn-secondary flex items-center justify-center gap-2"
            >
              {t('dashboard.viewMarketDetails')}
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Add Crop Modal */}
      {showAddCrop && (
        <AddCropModal
          onClose={() => setShowAddCrop(false)}
          onSuccess={() => {
            setShowAddCrop(false);
            navigate('/analyze');
          }}
        />
      )}
    </div>
  );
}
