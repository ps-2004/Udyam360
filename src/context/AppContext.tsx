import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  BusinessProfile,
  Product,
  BundleRecommendation,
  Quote,
  Order,
  AppScreen
} from '../types';
import { api } from '../services/api';

interface AppContextType {
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  profile: BusinessProfile;
  setProfile: React.Dispatch<React.SetStateAction<BusinessProfile>>;
  saveProfile: (p: Partial<BusinessProfile>) => Promise<void>;
  products: Product[];
  currentRecommendation: BundleRecommendation | null;
  setCurrentRecommendation: (rec: BundleRecommendation | null) => void;
  currentQuote: Quote | null;
  setCurrentQuote: (q: Quote | null) => void;
  currentOrder: Order | null;
  setCurrentOrder: (o: Order | null) => void;
  userRole: 'customer' | 'admin';
  setUserRole: (role: 'customer' | 'admin') => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (v: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  handoffModalOpen: boolean;
  setHandoffModalOpen: (open: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const defaultProfile: BusinessProfile = {
  business_name: 'City Care Clinic',
  business_category: 'Professional Office',
  business_type: 'Service Business',
  city: 'Bengaluru',
  city_tier: 'Tier 1',
  number_of_employees: 5,
  number_of_locations: 1,
  existing_provider: 'Local Cable ISP',
  current_internet_spend: 1800,
  existing_tools: 'Gmail, WhatsApp, Billing software',
  required_products: 'Internet, Email, Security',
  monthly_budget: 3000,
  gstin_available: true,
  gstin_number: '29AABCU9603R1ZM',
  udyam_registered: true,
  udyam_number: 'UDYAM-KR-03-0012345'
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screen, setScreen] = useState<AppScreen>('landing');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [profile, setProfile] = useState<BusinessProfile>(defaultProfile);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentRecommendation, setCurrentRecommendation] = useState<BundleRecommendation | null>(null);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [userRole, setUserRole] = useState<'customer' | 'admin'>('customer');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [handoffModalOpen, setHandoffModalOpen] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    // Initial fetch of products and profile
    api.getProducts().then(data => {
      if (Array.isArray(data)) setProducts(data);
    }).catch(console.error);

    api.getProfile().then(prof => {
      if (prof && prof.business_name) setProfile(prof);
    }).catch(console.error);

    api.getOrder('ORD-2026-004517').then(ord => {
      if (ord) setCurrentOrder(ord);
    }).catch(console.error);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const saveProfile = async (p: Partial<BusinessProfile>) => {
    try {
      const updated = await api.updateProfile(p);
      setProfile(updated);
      showToast('Business profile updated successfully');
    } catch (e) {
      console.error(e);
      showToast('Failed to save profile');
    }
  };

  return (
    <AppContext.Provider
      value={{
        screen,
        setScreen,
        language,
        setLanguage,
        profile,
        setProfile,
        saveProfile,
        products,
        currentRecommendation,
        setCurrentRecommendation,
        currentQuote,
        setCurrentQuote,
        currentOrder,
        setCurrentOrder,
        userRole,
        setUserRole,
        isLoggedIn,
        setIsLoggedIn,
        toastMessage,
        showToast,
        handoffModalOpen,
        setHandoffModalOpen,
        mobileMenuOpen,
        setMobileMenuOpen
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
