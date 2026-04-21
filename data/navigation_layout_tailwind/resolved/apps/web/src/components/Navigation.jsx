"use client";

import { useMemo, useRef, useState } from "react";
import useUser from "@/utils/useUser";
import { ReportModal } from "@/components/ReportModal";
import PressA2StartWordmark from "@/components/PressA2StartWordmark";
import { useNotifications } from "@/hooks/useNotifications";
import { useConversations } from "@/hooks/useConversations";
import { useNavigationHandlers } from "@/hooks/useNavigationHandlers";
import { useClickOutside } from "@/hooks/useClickOutside";
import { usePageSEO } from "@/hooks/usePageSEO";
import { calculateUnreadMessageCount } from "@/utils/unreadMessageCount";
import { BetaBanner } from "./Navigation/BetaBanner";
import { DesktopNav } from "./Navigation/DesktopNav";
import { MobileNav } from "./Navigation/MobileNav";
import { MobileNotificationsDropdown } from "./Navigation/MobileNotificationsDropdown";
import { MobileMenu } from "./Navigation/MobileMenu";

export default function Navigation({ currentPage = "" }) {
  const { data: user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBugReport, setShowBugReport] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const notificationsRef = useRef(null);
  const messagesRef = useRef(null);

  usePageSEO(currentPage);

  const {
    notifications,
    unreadCount,
    markAllAsReadMutation,
    markAsReadMutation,
  } = useNotifications(user?.id);

  const { shownConversations } = useConversations(user?.id, messagesOpen);

  const unreadMessageCount = useMemo(
    () => calculateUnreadMessageCount(notifications),
    [notifications],
  );

  const {
    handleFeatureClick,
    handleLogout,
    openConversation,
    openNotification,
  } = useNavigationHandlers(markAsReadMutation);

  useClickOutside(
    notificationsRef,
    messagesRef,
    notificationsOpen,
    messagesOpen,
    setNotificationsOpen,
    setMessagesOpen,
  );

  if (!user) return null;

  return (
    <>
      <BetaBanner onReportClick={() => setShowBugReport(true)} />

      <ReportModal
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
      />

      <nav className="bg-dungeon-stone/95 border-b-3 border-pixel-border sticky top-9 z-20 pixel-grid-bg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center gap-2 group">
              <div className="font-black text-lg sm:text-xl text-cream-white flex items-center gap-2 transition-transform duration-150 group-hover:scale-105">
                <PressA2StartWordmark
                  wordClassName="text-treasure-gold"
                  iconClassName="w-5 h-5"
                  iconAlt="A Button"
                />
              </div>
            </a>

            <DesktopNav
              unreadMessageCount={unreadMessageCount}
              unreadCount={unreadCount}
              messagesOpen={messagesOpen}
              setMessagesOpen={setMessagesOpen}
              notificationsOpen={notificationsOpen}
              setNotificationsOpen={setNotificationsOpen}
              shownConversations={shownConversations}
              notifications={notifications}
              onConversationClick={(id) => openConversation(id, setMessagesOpen)}
              onNotificationClick={(n) =>
                openNotification(n, setNotificationsOpen)
              }
              onMarkAllRead={() => markAllAsReadMutation.mutate()}
              isMarkingAllRead={markAllAsReadMutation.isPending}
              onFeatureClick={handleFeatureClick}
              onLogout={handleLogout}
              messagesRef={messagesRef}
              notificationsRef={notificationsRef}
            />

            <MobileNav
              unreadMessageCount={unreadMessageCount}
              unreadCount={unreadCount}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              setNotificationsOpen={setNotificationsOpen}
              onFeatureClick={handleFeatureClick}
            />
          </div>

          {notificationsOpen && (
            <MobileNotificationsDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={() => markAllAsReadMutation.mutate()}
              onNotificationClick={(n) =>
                openNotification(n, setNotificationsOpen)
              }
              isMarkingAllRead={markAllAsReadMutation.isPending}
            />
          )}

          {mobileMenuOpen && <MobileMenu onLogout={handleLogout} />}
        </div>
      </nav>
    </>
  );
}
