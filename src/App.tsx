import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { SkipLink } from './components/SkipLink';
import { CookieConsent } from './components/CookieConsent';
import { AuthGuard } from './components/AuthGuard';
import { Loader2 } from 'lucide-react';
import './index.css';

import { HomePage } from './pages/HomePage';

// Code-split routes for performance
const WatchPage = lazy(() => import('./pages/WatchPage').then(module => ({ default: module.WatchPage })));
const MissionControlPage = lazy(() => import('./pages/MissionControlPage').then(module => ({ default: module.MissionControlPage })));
const GearPage = lazy(() => import('./pages/GearPage').then(module => ({ default: module.GearPage })));
const StoriesPage = lazy(() => import('./pages/StoriesPage').then(module => ({ default: module.StoriesPage })));
const CommunityPage = lazy(() => import('./pages/CommunityPage').then(module => ({ default: module.CommunityPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(module => ({ default: module.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(module => ({ default: module.ContactPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage').then(module => ({ default: module.PrivacyPolicyPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(module => ({ default: module.TermsPage })));
const DropsPage = lazy(() => import('./pages/DropsPage').then(module => ({ default: module.DropsPage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then(module => ({ default: module.ShopPage })));
const ShopSuccessPage = lazy(() => import('./pages/ShopSuccessPage').then(module => ({ default: module.ShopSuccessPage })));
const ShopCancelPage = lazy(() => import('./pages/ShopCancelPage').then(module => ({ default: module.ShopCancelPage })));
const PostPage = lazy(() => import('./pages/PostPage').then(module => ({ default: module.PostPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));

// Auth pages
const LoginPage = lazy(() => import('./pages/LoginPage').then(module => ({ default: module.LoginPage })));
const SignupPage = lazy(() => import('./pages/SignupPage').then(module => ({ default: module.SignupPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(module => ({ default: module.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage').then(module => ({ default: module.ResetPasswordPage })));

// Account pages (protected)
const AccountPage = lazy(() => import('./pages/AccountPage').then(module => ({ default: module.AccountPage })));
const OrdersPage = lazy(() => import('./pages/OrdersPage').then(module => ({ default: module.OrdersPage })));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage').then(module => ({ default: module.OrderDetailPage })));

import { PageLoader } from './components/PageLoader';

function App() {
  return (
      <Router>
        <AuthProvider>
          <div className="min-h-screen bg-black">
            <SkipLink />
            <Navigation />
            <main id="main-content" className="relative" role="main" aria-label="Main content">
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/watch" element={<WatchPage />} />
                  <Route path="/prole-control" element={<MissionControlPage />} />
                  <Route path="/gear" element={<GearPage />} />
                  <Route path="/stories" element={<StoriesPage />} />
                  <Route path="/community" element={<CommunityPage />} />
                  <Route path="/about" element={<AboutPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/drops" element={<DropsPage />} />
                  <Route path="/shop" element={<ShopPage />} />
                  <Route path="/shop/success" element={<ShopSuccessPage />} />
                  <Route path="/shop/cancel" element={<ShopCancelPage />} />
                  <Route path="/read/:slug" element={<PostPage />} />
                  <Route path="/admin" element={<AuthGuard><AdminPage /></AuthGuard>} />

                  {/* Auth routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Protected account routes */}
                  <Route path="/account" element={<AuthGuard><AccountPage /></AuthGuard>} />
                  <Route path="/account/orders" element={<AuthGuard><OrdersPage /></AuthGuard>} />
                  <Route path="/account/orders/:orderId" element={<AuthGuard><OrderDetailPage /></AuthGuard>} />
                </Routes>
              </Suspense>
            </main>
            <Footer />
            <CookieConsent />
          </div>
        </AuthProvider>
      </Router>
  );
}

export default App;
