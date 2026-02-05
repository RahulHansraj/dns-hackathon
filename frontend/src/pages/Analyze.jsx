import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  BarChart3, 
  MapPin, 
  Truck, 
  AlertTriangle, 
  TrendingUp,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  ArrowLeft
} from 'lucide-react';
import { analyzeAPI, farmerAPI } from '../services/api';
import AddCropModal from '../components/AddCropModal';

export default function Analyze() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [farmerCrops, setFarmerCrops] = useState([]);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [opportunities, setOpportunities] = useState(null);
  const [showAddCrop, setShowAddCrop] = useState(false);
  const [confirmingId, setConfirmingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const cropsRes = await farmerAPI.getCrops();
      setFarmerCrops(cropsRes.data);
      
      // Auto-analyze if crops exist
      if (cropsRes.data.length > 0) {
        await runAnalysis(cropsRes.data);
      } else {
        // Show general opportunities
        const analysisRes = await analyzeAPI.analyze(null, null, []);
        setOpportunities(analysisRes.data.opportunities);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async (crops = farmerCrops) => {
    if (crops.length === 0) return;
    
    try {
      setAnalyzing(true);
      const cropData = crops.map(c => ({
        cropId: c.cropId,
        weightKg: c.weightKg
      }));
      
      const res = await analyzeAPI.analyze(null, null, cropData);
      setAnalysisResults(res.data);
    } catch (error) {
      console.error('Failed to analyze:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = async (market) => {
    try {
      setConfirmingId(market.marketId);
      
      await analyzeAPI.confirmMarket({
        marketId: market.marketId,
        cropId: market.cropId,
        weightKg: market.weightKg,
        expectedProfit: market.expectedProfit,
        transportCost: market.transportCost,
        spoilageRisk: market.spoilageRisk
      });
      
      // Remove from analysis results
      setAnalysisResults(prev => ({
        ...prev,
        analysis: prev.analysis.filter(a => 
          !(a.marketId === market.marketId && a.cropId === market.cropId)
        )
      }));
      
      // Navigate to confirmed markets
      navigate('/confirmed');
    } catch (error) {
      console.error('Failed to confirm:', error);
    } finally {
      setConfirmingId(null);
    }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="text-primary-600" />
            {t('analyze.title')}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => runAnalysis()}
            disabled={analyzing || farmerCrops.length === 0}
            className="btn-secondary p-2"
          >
            <RefreshCw size={20} className={analyzing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowAddCrop(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            {t('analyze.addCrop')}
          </button>
        </div>
      </div>

      {/* Your Crops */}
      {farmerCrops.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">{t('analyze.yourCrops')}</h2>
          <div className="flex flex-wrap gap-2">
            {farmerCrops.map((crop) => (
              <span
                key={crop.id}
                className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full text-sm"
              >
                {crop.cropName} - {crop.weightKg} kg
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysisResults && analysisResults.analysis.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            {t('analyze.bestMarkets')}
          </h2>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
              placeholder={t('analyze.searchPlaceholder')}
            />
          </div>
          
          {analysisResults.analysis
            .filter(m => m.marketName.toLowerCase().includes(searchQuery.toLowerCase()))
            .map((market, index) => (
            <div
              key={`${market.marketId}-${market.cropId}`}
              className="card"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg">{market.marketName}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin size={14} />
                        {market.locationName}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    ₹{market.expectedProfit.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">{t('common.expectedProfit')}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-500">{t('common.crop')}</p>
                  <p className="font-medium">{market.cropName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('common.weight')}</p>
                  <p className="font-medium">{market.weightKg} kg</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('common.distance')}</p>
                  <p className="font-medium flex items-center gap-1">
                    <Truck size={14} />
                    {market.distance} km
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">{t('common.transportCost')}</p>
                  <p className="font-medium">₹{market.transportCost}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getSpoilageColor(market.spoilageRisk)}`}>
                    <AlertTriangle size={14} />
                    {market.spoilageRisk} {t('common.risk')}
                  </span>
                  <span className="text-sm text-gray-500">
                    ₹{market.currentPricePerKg}{t('common.perKgPrice')}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/market/${market.marketId}`)}
                    className="btn-secondary py-2"
                  >
                    {t('common.viewDetails')}
                  </button>
                  <button
                    onClick={() => handleConfirm(market)}
                    disabled={confirmingId === market.marketId}
                    className="btn-primary py-2 flex items-center gap-1"
                  >
                    {confirmingId === market.marketId ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        {t('common.confirm')}
                        <ChevronRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : opportunities && opportunities.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="text-primary-600" />
            {t('analyze.marketOpportunities')}
          </h2>
          <p className="text-gray-500">
            {t('analyze.opportunitiesDesc')}
          </p>
          
          {opportunities.map((opp, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">{opp.marketName}</h3>
                  <p className="text-sm text-gray-500">{opp.locationName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">₹{opp.pricePerKg}/kg</p>
                  <p className="text-sm text-gray-500">{opp.cropName}</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500">
                  {opp.distance} {t('analyze.kmAway')} • {t('analyze.needs')} {opp.quantityNeeded} kg
                </span>
                <button
                  onClick={() => navigate(`/market/${opp.marketId}`)}
                  className="btn-secondary py-1.5 text-sm"
                >
                  {t('analyze.viewMarket')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <BarChart3 size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('analyze.noCropsTitle')}</h3>
          <p className="text-gray-500 mb-4">
            {t('analyze.noCropsDesc')}
          </p>
          <button
            onClick={() => setShowAddCrop(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus size={20} />
            {t('dashboard.addCropDetails')}
          </button>
        </div>
      )}

      {showAddCrop && (
        <AddCropModal
          onClose={() => setShowAddCrop(false)}
          onSuccess={() => {
            setShowAddCrop(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}
