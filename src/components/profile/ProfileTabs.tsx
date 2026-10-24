import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Order, Profile, PublicUser } from "@/types";
import ProfileOverview from "@/components/profile/ProfileOverview";
import SettingsForm from "@/components/profile/SettingsForm";
import AddressBook from "@/components/profile/AddressBook";
import OrderHistory from "@/components/profile/OrderHistory";

export type ProfileTabId = "profile" | "settings" | "addresses" | "orders";

interface ProfileTabsProps {
  user: PublicUser | null;
  profile: Profile | null;
  orders: Order[];
  onUserUpdate: (user: PublicUser) => void;
  onProfileUpdate: (profile: Profile) => void;
}

const tabs: { id: ProfileTabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "settings", label: "Settings" },
  { id: "addresses", label: "Addresses" },
  { id: "orders", label: "Orders" },
];

const ProfileTabs = ({
  user,
  profile,
  orders,
  onUserUpdate,
  onProfileUpdate,
}: ProfileTabsProps) => {
  const [activeTab, setActiveTab] = useState<ProfileTabId>("profile");

  const renderContent = () => {
    switch (activeTab) {
      case "profile":
        return <ProfileOverview user={user} profile={profile} orders={orders} />;
      case "settings":
        return <SettingsForm user={user} onUserUpdate={onUserUpdate} />;
      case "addresses":
        return <AddressBook profile={profile} onProfileUpdate={onProfileUpdate} />;
      case "orders":
        return <OrderHistory orders={orders} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6 md:flex-row">
      <nav
        aria-label="Account sections"
        role="tablist"
        className="flex w-full shrink-0 gap-1 overflow-x-auto rounded-2xl border border-gray-100 bg-white p-1 shadow-sm md:w-56 md:flex-col md:p-1.5"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`profile-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`profile-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 shrink-0 cursor-pointer whitespace-nowrap rounded-xl px-2.5 py-2 text-center text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 sm:text-sm md:flex-none md:px-4 md:py-2.5 md:text-left"
            >
              {isActive && (
                <motion.span
                  layoutId="profile-active-tab"
                  className="absolute inset-0 rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/25"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span
                className={`relative z-10 whitespace-nowrap ${
                  isActive ? "text-white" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            id={`profile-panel-${activeTab}`}
            role="tabpanel"
            aria-labelledby={`profile-tab-${activeTab}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ProfileTabs;
