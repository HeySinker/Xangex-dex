// ================================================
// XANGEX - Real-time Price Service
// Uses CoinGecko API for live cryptocurrency prices
// ================================================

// CoinGecko API base URL (free tier, no auth required)
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// Coin IDs mapping for CoinGecko
const COIN_IDS: Record<string, string> = {
    XMR: 'monero',
    USDT: 'tether',
    XTM: 'minotari', // MinoTari - may need adjustment if not found
};

// Price data interface
export interface PriceData {
    id: string;
    symbol: string;
    current_price: number;
    price_change_24h: number;
    price_change_percentage_24h: number;
    last_updated: string;
}

// Price cache
interface PriceCache {
    data: Record<string, PriceData>;
    lastFetch: number;
}

let priceCache: PriceCache = {
    data: {},
    lastFetch: 0,
};

// Cache duration in milliseconds (30 seconds)
const CACHE_DURATION = 30000;

// Fetch prices from CoinGecko
export const fetchPrices = async (): Promise<Record<string, PriceData>> => {
    // Check cache
    if (Date.now() - priceCache.lastFetch < CACHE_DURATION && Object.keys(priceCache.data).length > 0) {
        return priceCache.data;
    }

    try {
        const coinIds = Object.values(COIN_IDS).join(',');
        const response = await fetch(
            `${COINGECKO_API}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`
        );

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();

        // Map response to our format
        const prices: Record<string, PriceData> = {};

        for (const [symbol, coinId] of Object.entries(COIN_IDS)) {
            const coinData = data.find((c: { id: string }) => c.id === coinId);
            if (coinData) {
                prices[symbol] = {
                    id: coinData.id,
                    symbol: symbol,
                    current_price: coinData.current_price || 0,
                    price_change_24h: coinData.price_change_24h || 0,
                    price_change_percentage_24h: coinData.price_change_percentage_24h || 0,
                    last_updated: coinData.last_updated || new Date().toISOString(),
                };
            }
        }

        // Update cache
        priceCache = {
            data: prices,
            lastFetch: Date.now(),
        };

        return prices;
    } catch (error) {
        console.error('Error fetching prices:', error);

        // Return cached data if available, otherwise return defaults
        if (Object.keys(priceCache.data).length > 0) {
            return priceCache.data;
        }

        // Fallback prices
        return {
            XMR: { id: 'monero', symbol: 'XMR', current_price: 165, price_change_24h: 0, price_change_percentage_24h: 0, last_updated: new Date().toISOString() },
            USDT: { id: 'tether', symbol: 'USDT', current_price: 1, price_change_24h: 0, price_change_percentage_24h: 0, last_updated: new Date().toISOString() },
            XTM: { id: 'minotari', symbol: 'XTM', current_price: 0.05, price_change_24h: 0, price_change_percentage_24h: 0, last_updated: new Date().toISOString() },
        };
    }
};

// Get single coin price
export const getPrice = async (symbol: string): Promise<number> => {
    const prices = await fetchPrices();
    return prices[symbol]?.current_price || 0;
};

// Calculate exchange rate between two cryptos
export const calculateExchangeRate = async (from: string, to: string): Promise<number> => {
    const prices = await fetchPrices();
    const fromPrice = prices[from]?.current_price || 1;
    const toPrice = prices[to]?.current_price || 1;
    return fromPrice / toPrice;
};

// Commission rate (0.05%)
export const COMMISSION_RATE = 0.0005;

// Calculate amount after commission
export const calculateAfterCommission = (amount: number): number => {
    return amount * (1 - COMMISSION_RATE);
};

// Format price with proper decimals
export const formatPrice = (price: number, decimals: number = 2): string => {
    if (price >= 1) {
        return price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }
    // For small prices, show more decimals
    return price.toLocaleString('en-US', { minimumFractionDigits: 6, maximumFractionDigits: 8 });
};

// Format percentage change
export const formatPercentage = (percentage: number): string => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
};

// Price subscription for real-time updates
type PriceCallback = (prices: Record<string, PriceData>) => void;
const subscribers: Set<PriceCallback> = new Set();
let intervalId: ReturnType<typeof setInterval> | null = null;

export const subscribeToPrices = (callback: PriceCallback): (() => void) => {
    subscribers.add(callback);

    // Start polling if this is the first subscriber
    if (subscribers.size === 1 && !intervalId) {
        // Initial fetch
        fetchPrices().then(callback);

        // Poll every 30 seconds
        intervalId = setInterval(async () => {
            const prices = await fetchPrices();
            subscribers.forEach(cb => cb(prices));
        }, CACHE_DURATION);
    } else {
        // Immediately send cached data to new subscriber
        if (Object.keys(priceCache.data).length > 0) {
            callback(priceCache.data);
        } else {
            fetchPrices().then(callback);
        }
    }

    // Return unsubscribe function
    return () => {
        subscribers.delete(callback);
        if (subscribers.size === 0 && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };
};

// Get cached prices synchronously (may be stale)
export const getCachedPrices = (): Record<string, PriceData> => {
    return priceCache.data;
};

export default {
    fetchPrices,
    getPrice,
    calculateExchangeRate,
    calculateAfterCommission,
    subscribeToPrices,
    getCachedPrices,
    formatPrice,
    formatPercentage,
    COMMISSION_RATE,
};
