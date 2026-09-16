import React, { useState, useCallback, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { ToastContainer } from './components/common/ToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
// Eager core layout
import { MobileShell } from './components/layout/MobileShell';
import { ProjectPausedScreen } from './components/common/ProjectPausedScreen';
import { modalStack, useModalBackRegistration } from './services/modalStack';
import { scheduleRtoExpiryAlerts } from './services/nativeInit';
import { getModalPortalRoot } from './lib/modalContainer';
import { SplashScreen } from '@capacitor/splash-screen';

// Code-Split Primary Views (Lazy loaded on demand for instant 2GB phone boot)
const HomeDashboard = lazy(() => import('./components/dashboard/HomeDashboard').then(m => ({ default: m.HomeDashboard })));
const BookingsList = lazy(() => import('./components/bookings/BookingsList').then(m => ({ default: m.BookingsList })));
const FleetManager = lazy(() => import('./components/fleet/FleetManager').then(m => ({ default: m.FleetManager })));
const MoneyDashboard = lazy(() => import('./components/money/MoneyDashboard').then(m => ({ default: m.MoneyDashboard })));
import { NewBookingWizard } from './components/bookings/NewBookingWizard';
const MoreMenu = lazy(() => import('./components/more/MoreMenu').then(m => ({ default: m.MoreMenu })));

const LandingPage = lazy(() => import('./components/landing/LandingPage').then(m => ({ default: m.LandingPage })));
const AuthModal = lazy(() => import('./components/auth/AuthModal').then(m => ({ default: m.AuthModal })));

// Driver Views (Only fetched over network if user is driver)
const DriverShell = lazy(() => import('./components/driver/DriverShell').then(m => ({ default: m.DriverShell })));
const DriverDashboard = lazy(() => import('./components/driver/DriverDashboard').then(m => ({ default: m.DriverDashboard })));
const DriverTripHistory = lazy(() => import('./components/driver/DriverTripHistory').then(m => ({ default: m.DriverTripHistory })));
const DriverCashWallet = lazy(() => import('./components/driver/DriverCashWallet').then(m => ({ default: m.DriverCashWallet })));
const DriverProfile = lazy(() => import('./components/driver/DriverProfile').then(m => ({ default: m.DriverProfile })));
const DriverTollModal = lazy(() => import('./components/driver/DriverTollModal').then(m => ({ default: m.DriverTollModal })));
const DriverUpiModal = lazy(() => import('./components/driver/DriverUpiModal').then(m => ({ default: m.DriverUpiModal })));

// Modals
const TripDetailModal = lazy(() => import('./components/bookings/TripDetailModal').then(m => ({ default: m.TripDetailModal })));
const TripSettlementModal = lazy(() => import('./components/bookings/TripSettlementModal').then(m => ({ default: m.TripSettlementModal })));
const InvoiceGenerator = lazy(() => import('./components/invoices/InvoiceGenerator').then(m => ({ default: m.InvoiceGenerator })));
const NotificationModal = lazy(() => import('./components/modals/NotificationModal').then(m => ({ default: m.NotificationModal })));
const WhatsAppModal = lazy(() => import('./components/modals/WhatsAppModal').then(m => ({ default: m.WhatsAppModal })));
const RenewalModal = lazy(() => import('./components/modals/RenewalModal').then(m => ({ default: m.RenewalModal })));
const CustomerDetailModal = lazy(() => import('./components/crm/CustomerDetailModal').then(m => ({ default: m.CustomerDetailModal })));
const DriverDetailModal = lazy(() => import('./components/crm/DriverDetailModal').then(m => ({ default: m.DriverDetailModal })));
const RateCardEditModal = lazy(() => import('./components/more/RateCardEditModal').then(m => ({ default: m.RateCardEditModal })));
const CustomerSettleModal = lazy(() => import('./components/modals/CustomerSettleModal').then(m => ({ default: m.CustomerSettleModal })));
const MembershipPlans = lazy(() => import('./components/membership/MembershipPlans').then(m => ({ default: m.MembershipPlans })));
const QuickQuoteModal = lazy(() => import('./components/quotes/QuickQuoteModal').then(m => ({ default: m.QuickQuoteModal })));
const CorporateInvoiceModal = lazy(() => import('./components/corporate/CorporateInvoiceModal').then(m => ({ default: m.CorporateInvoiceModal })));
const CAExportModal = lazy(() => import('./components/export/CAExportModal').then(m => ({ default: m.CAExportModal })));
const CustomerDuesRecoveryModal = lazy(() => import('./components/money/CustomerDuesRecoveryModal').then(m => ({ default: m.CustomerDuesRecoveryModal })));
const PublicMiniSiteModal = lazy(() => import('./components/publicsite/PublicMiniSiteModal').then(m => ({ default: m.PublicMiniSiteModal })));
const VehicleServiceModal = lazy(() => import('./components/fleet/VehicleServiceModal').then(m => ({ default: m.VehicleServiceModal })));
const VehicleDetailModal = lazy(() => import('./components/fleet/VehicleDetailModal').then(m => ({ default: m.VehicleDetailModal })));
const VehicleInspectionModal = lazy(() => import('./components/inspection/VehicleInspectionModal').then(m => ({ default: m.VehicleInspectionModal })));

const ModalLoadingFallback = () => createPortal(
  <div className="absolute inset-0 z-50 modal-center-backdrop">
    <div className="modal-card-center bg-white p-4 rounded-3xl shadow-xl flex items-center gap-3 border border-[#E5DFD3]">
      <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-black text-[#111827]">Loading...</span>
    </div>
  </div>,
  getModalPortalRoot()
);

const TabSkeletonFallback = () => (
  <div className="p-4 space-y-3 animate-pulse">
    <div className="h-28 bg-white/70 rounded-3xl border border-[#EFEAE1]" />
    <div className="h-44 bg-white/70 rounded-3xl border border-[#EFEAE1]" />
    <div className="h-24 bg-white/70 rounded-3xl border border-[#EFEAE1]" />
  </div>
);

const MainContent = () => {
  const {
    authUser,
    vehicles,
    activeTab,
    driverActiveTab,
    isNewBookingOpen,
    setIsNewBookingOpen,
    isNotificationsOpen,
    setIsNotificationsOpen,
    isMembershipOpen,
    setIsMembershipOpen,
    selectedInvoiceBooking,
    setSelectedInvoiceBooking,
    settlementBooking,
    setSettlementBooking,
    selectedTripDetailBooking,
    setSelectedTripDetailBooking,
    whatsAppData,
    setWhatsAppData,
    isQuickQuoteOpen,
    setIsQuickQuoteOpen,
    selectedCorporateCustomer,
    setSelectedCorporateCustomer,
    isCaExportOpen,
    setIsCaExportOpen,
    isDuesRecoveryOpen,
    setIsDuesRecoveryOpen,
    isPublicSiteOpen,
    setIsPublicSiteOpen,
    serviceModalVehicle,
    setServiceModalVehicle,
    selectedVehicleDetail,
    setSelectedVehicleDetail,
    inspectionModalBooking,
    setInspectionModalBooking,
    saveVehicleInspection,
    isAuthModalOpen,
    closeAuthModal,
    renewalModalData,
    setRenewalModalData,
    customerSettlementData,
    setCustomerSettlementData,
    driverTollModalBooking,
    setDriverTollModalBooking,
    driverUpiModalData,
    setDriverUpiModalData,
    isProjectPaused,
    projectPausedReason,
    checkProjectStatus
  } = useApp();

  const handleCloseNewBooking = useCallback(() => {
    setIsNewBookingOpen(false);
  }, [setIsNewBookingOpen]);

  // Hierarchical Android Back Button Registrations for All Global App Modals
  // (Note: new_booking_wizard is registered step-aware inside NewBookingWizard component)
  useModalBackRegistration(Boolean(selectedTripDetailBooking), () => setSelectedTripDetailBooking(null), 'trip_detail_modal');
  useModalBackRegistration(Boolean(settlementBooking), () => setSettlementBooking(null), 'trip_settlement_modal');
  useModalBackRegistration(Boolean(selectedInvoiceBooking), () => setSelectedInvoiceBooking(null), 'invoice_generator');
  useModalBackRegistration(Boolean(whatsAppData), () => setWhatsAppData(null), 'whatsapp_modal');
  useModalBackRegistration(isNotificationsOpen, () => setIsNotificationsOpen(false), 'notification_modal');
  useModalBackRegistration(isMembershipOpen, () => setIsMembershipOpen(false), 'membership_plans_modal');
  useModalBackRegistration(isQuickQuoteOpen, () => setIsQuickQuoteOpen(false), 'quick_quote_modal');
  useModalBackRegistration(Boolean(selectedCorporateCustomer), () => setSelectedCorporateCustomer(null), 'corporate_invoice_modal');
  useModalBackRegistration(isCaExportOpen, () => setIsCaExportOpen(false), 'ca_export_modal');
  useModalBackRegistration(isDuesRecoveryOpen, () => setIsDuesRecoveryOpen(false), 'dues_recovery_modal');
  useModalBackRegistration(isPublicSiteOpen, () => setIsPublicSiteOpen(false), 'public_site_modal');
  useModalBackRegistration(Boolean(serviceModalVehicle), () => setServiceModalVehicle(null), 'vehicle_service_modal');
  useModalBackRegistration(Boolean(selectedVehicleDetail), () => setSelectedVehicleDetail(null), 'vehicle_detail_modal');
  useModalBackRegistration(Boolean(inspectionModalBooking), () => setInspectionModalBooking(null), 'vehicle_inspection_modal');
  useModalBackRegistration(Boolean(renewalModalData), () => setRenewalModalData(null), 'renewal_modal');
  useModalBackRegistration(Boolean(customerSettlementData), () => setCustomerSettlementData(null), 'customer_settle_modal');
  useModalBackRegistration(isAuthModalOpen, closeAuthModal, 'auth_modal');
  useModalBackRegistration(Boolean(driverTollModalBooking), () => setDriverTollModalBooking(null), 'driver_toll_modal');
  useModalBackRegistration(Boolean(driverUpiModalData), () => setDriverUpiModalData(null), 'driver_upi_modal');

  // Global Android Back Button Exit Toast (Double-tap confirmation on root screen)
  const { showToast } = useToast();
  React.useEffect(() => {
    modalStack.setExitToastCallback(() => {
      showToast('Press back again to exit GaadiDesk', 'info');
    });
  }, [showToast]);

  // Schedule native background RTO document expiry alarms
  React.useEffect(() => {
    if (vehicles && vehicles.length) {
      scheduleRtoExpiryAlerts(vehicles);
    }
  }, [vehicles]);

  // Smoothly dismiss native Android splash screen on initial mount
  React.useEffect(() => {
    try {
      SplashScreen.hide({ fadeOutDuration: 300 });
    } catch {}
  }, []);

  // If Supabase project is paused, LOCK DOWN the entire application immediately!
  // No Landing page, no login, no register, no dashboard, no driver views.
  if (isProjectPaused) {
    return (
      <ProjectPausedScreen
        onRetry={checkProjectStatus}
        errorReason={projectPausedReason}
      />
    );
  }

  return (
    <>
      {/* If user is not logged in, show the Public Landing / Home Page */}
      {!authUser ? (
        <Suspense fallback={<TabSkeletonFallback />}>
          <LandingPage />
          <AuthModal />
          {isMembershipOpen && (
            <Suspense fallback={<ModalLoadingFallback />}>
              <MembershipPlans onClose={() => setIsMembershipOpen(false)} />
            </Suspense>
          )}
        </Suspense>
      ) : authUser.role === 'driver' ? (
        /* If user is a Driver, show dedicated DriverShell & Driver Views */
        <Suspense fallback={<TabSkeletonFallback />}>
          <DriverShell>
            {driverActiveTab === 'duty' && <DriverDashboard />}
            {driverActiveTab === 'trips' && <DriverTripHistory />}
            {driverActiveTab === 'wallet' && <DriverCashWallet />}
            {driverActiveTab === 'profile' && <DriverProfile />}

            {/* Driver On-Road Toll & UPI Modals */}
            <DriverTollModal />
            <DriverUpiModal />

            {/* Driver Notifications */}
            {isNotificationsOpen && (
              <Suspense fallback={<ModalLoadingFallback />}>
                <NotificationModal
                  onClose={() => setIsNotificationsOpen(false)}
                />
              </Suspense>
            )}
          </DriverShell>
        </Suspense>
      ) : (
        /* If user is Fleet Owner / Staff, show full GaadiDesk App Shell & Dashboard */
        <MobileShell>
          {/* Tab Router */}
          <Suspense fallback={<TabSkeletonFallback />}>
            {activeTab === 'home' && <HomeDashboard />}
            {activeTab === 'trips' && <BookingsList />}
            {activeTab === 'fleet' && <FleetManager />}
            {activeTab === 'money' && <MoneyDashboard />}
            {activeTab === 'more' && <MoreMenu />}
          </Suspense>

          {/* Primary Quick Booking Wizard (Eagerly mounted for instant 0ms launch) */}
          {isNewBookingOpen && (
            <NewBookingWizard onClose={handleCloseNewBooking} />
          )}

          <Suspense fallback={<ModalLoadingFallback />}>
            {selectedTripDetailBooking && (
              <TripDetailModal
                booking={selectedTripDetailBooking}
                onClose={() => setSelectedTripDetailBooking(null)}
              />
            )}

            {settlementBooking && (
              <TripSettlementModal
                booking={settlementBooking}
                onClose={() => setSettlementBooking(null)}
              />
            )}

            {selectedInvoiceBooking && (
              <InvoiceGenerator
                booking={selectedInvoiceBooking}
                onClose={() => setSelectedInvoiceBooking(null)}
              />
            )}

            {whatsAppData && (
              <WhatsAppModal
                data={whatsAppData}
                onClose={() => setWhatsAppData(null)}
              />
            )}

            {isNotificationsOpen && (
              <NotificationModal
                onClose={() => setIsNotificationsOpen(false)}
              />
            )}

            {isMembershipOpen && (
              <MembershipPlans
                onClose={() => setIsMembershipOpen(false)}
              />
            )}

            {/* RTO Document Renewal Modal */}
            <RenewalModal />

            {/* Customer Dues Settlement Modal */}
            <CustomerSettleModal />

            {/* 10-Second Instant Quotation Modal */}
            {isQuickQuoteOpen && (
              <QuickQuoteModal onClose={() => setIsQuickQuoteOpen(false)} />
            )}

            {/* Corporate B2B Monthly Invoicing Modal */}
            {selectedCorporateCustomer && (
              <CorporateInvoiceModal
                customer={selectedCorporateCustomer}
                onClose={() => setSelectedCorporateCustomer(null)}
              />
            )}

            {/* CA & Tally Export Modal */}
            {isCaExportOpen && (
              <CAExportModal onClose={() => setIsCaExportOpen(false)} />
            )}

            {/* Fast Cash: Customer Dues Recovery Tool */}
            {isDuesRecoveryOpen && (
              <CustomerDuesRecoveryModal onClose={() => setIsDuesRecoveryOpen(false)} />
            )}

            {/* Operator Branded Public Mini-Website Modal */}
            {isPublicSiteOpen && (
              <PublicMiniSiteModal onClose={() => setIsPublicSiteOpen(false)} />
            )}

            {/* Odometer Vehicle Maintenance & Service Modal */}
            {serviceModalVehicle && (
              <VehicleServiceModal
                vehicle={serviceModalVehicle}
                onClose={() => setServiceModalVehicle(null)}
              />
            )}

            {/* 360° Vehicle Passport & Detail Modal */}
            {selectedVehicleDetail && (
              <VehicleDetailModal
                vehicle={selectedVehicleDetail}
                onClose={() => setSelectedVehicleDetail(null)}
              />
            )}

            {/* 6-Point Vehicle Rental Inspection Modal */}
            {inspectionModalBooking && (
              <VehicleInspectionModal
                booking={inspectionModalBooking}
                onSave={(data) => saveVehicleInspection(inspectionModalBooking.id, data)}
                onClose={() => setInspectionModalBooking(null)}
              />
            )}
          </Suspense>

          {/* Global Auth Modal */}
          <Suspense fallback={null}>
            <AuthModal />
          </Suspense>
        </MobileShell>
      )}
    </>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppProvider>
          <ToastContainer />
          <MainContent />
        </AppProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
