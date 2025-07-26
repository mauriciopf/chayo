import DesktopNavigation from './DesktopNavigation'
import MobileHeader from './MobileHeader'
import MobileNavigation from './MobileNavigation'
import SubscriptionPlans from './SubscriptionPlans'
import ManageDocumentsModal from './ManageDocumentsModal'
import ClientQRCode from './ClientQRCode'
import React from 'react'

export default function AuthPromptView({
  activeView,
  setActiveView,
  handleLogout,
  handleManageBilling,
  auth,
  mobile,
  showHamburgerMenu,
  setShowHamburgerMenu,
  renderCurrentView,
  dashboardInit,
  showPlansModal,
  setShowPlansModal,
  targetPlan,
  setTargetPlan,
  showManageDocsModal,
  setShowManageDocsModal,
  handleManageDocsModalClose
}: any) {
  return (
    <div className="flex h-screen min-h-0 bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Desktop Navigation Sidebar */}
      <DesktopNavigation
        activeView={activeView}
        onViewChange={setActiveView}
        onLogout={handleLogout}
        onManageBilling={handleManageBilling}
        user={auth.user}
        subscription={auth.subscription}
        businessName={auth.currentOrganization?.name || ''}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        {/* Mobile Header */}
        <div className="md:hidden">
          <MobileHeader 
            activeView={activeView}
            onMenuToggle={() => setShowHamburgerMenu(true)}
            user={auth.user}
          />
        </div>

        {/* Mobile Navigation */}
        <MobileNavigation
          isOpen={showHamburgerMenu}
          onClose={() => setShowHamburgerMenu(false)}
          activeView={activeView}
          onViewChange={setActiveView}
          onLogout={handleLogout}
          onManageBilling={handleManageBilling}
          user={auth.user}
          subscription={auth.subscription}
        />

        <div className={`flex-1 flex flex-col items-center w-full min-h-0 ${
          activeView === 'chat' && mobile.isMobile
            ? 'px-0 py-0' 
            : 'px-4 sm:px-6 lg:px-8 py-4 md:px-8 md:py-8'
        }`}>
          {renderCurrentView()}
        </div>

        {/* Modals */}
        {showPlansModal && (
          <SubscriptionPlans
            currentSubscription={auth.subscription}
            targetPlan={targetPlan || undefined}
            onClose={() => {
              setShowPlansModal(false)
              setTargetPlan(null)
            }}
            onSubscriptionUpdate={() => {
              setShowPlansModal(false)
              setTargetPlan(null)
            }}
          />
        )}
        {showManageDocsModal && auth.currentOrganization && (
          <ManageDocumentsModal
            organizationId={auth.currentOrganization.id}
            organizationName={auth.currentOrganization.name}
            onClose={handleManageDocsModalClose}
          />
        )}
      </div>
    </div>
  )
} 