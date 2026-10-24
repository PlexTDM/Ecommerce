import { useState } from "react";
import type { Order, Profile, PublicUser } from "../../types";
import ProfileOverview from "./ProfileOverview";
import SettingsForm from "./SettingsForm";
import AddressBook from "./AddressBook";
import OrderHistory from "./OrderHistory";

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
        className="flex shrink-0 gap-2 overflow-x-auto rounded-xl bg-white p-2 shadow-sm md:w-56 md:flex-col md:gap-1"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? "page" : undefined}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap cursor-pointer rounded-lg px-4 py-2 text-left text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0 flex-1 rounded-xl bg-white p-5 shadow-sm sm:p-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default ProfileTabs;
