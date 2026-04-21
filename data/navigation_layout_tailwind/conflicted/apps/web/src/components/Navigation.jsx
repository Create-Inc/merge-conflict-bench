"use client";

import { useRef, useState, useMemo } from "react";
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

  // Apply SEO for the current page
  usePageSEO(currentPage);

  // Fetch notifications and conversations
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

  // Navigation handlers
  const {
    handleFeatureClick,
    handleLogout,
    openConversation,
    openNotification,
  } = useNavigationHandlers(markAsReadMutation);

  // Click outside to close dropdowns
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
<<<<<<< ours
      <BetaBanner onReportClick={() => setShowBugReport(true)} />
=======
      {/* Beta Banner - keep strong red for visibility */}
      <div className="bg-dragon-blood border-b border-crimson-danger py-2 px-4 text-center sticky top-0 z-30">
        <button
          onClick={() => setShowBugReport(true)}
          className="text-cream-white text-xs md:text-sm hover:text-treasure-gold transition-colors font-semibold"
        >
          ⚠️ Beta - Click here to report bugs or issues
        </button>
      </div>
>>>>>>> theirs

      <ReportModal
        isOpen={showBugReport}
        onClose={() => setShowBugReport(false)}
      />

<<<<<<< ours
      <nav className="bg-dungeon-stone/95 border-b-3 border-pixel-border sticky top-9 z-20 pixel-grid-bg">
=======
      {/* Main Navigation - dungeon-ink + teal accents + gold brand */}
      <nav className="bg-[#0B1211]/92 backdrop-blur border-b-3 border-[#223330] sticky top-9 z-20 pixel-grid-bg">
>>>>>>> theirs
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2 group">
              <div className="font-black text-lg sm:text-xl text-cream-white flex items-center gap-2 transition-transform duration-150 group-hover:scale-105">
                <PressA2StartWordmark
<<<<<<< ours
                  wordClassName="text-treasure-gold"
=======
                  wordClassName="text-purple-200"
>>>>>>> theirs
                  iconClassName="w-5 h-5"
                  iconAlt="A Button"
                />
              </div>
            </a>

            {/* Desktop Navigation */}
<<<<<<< ours
            <DesktopNav
              unreadMessageCount={unreadMessageCount}
              unreadCount={unreadCount}
              messagesOpen={messagesOpen}
              setMessagesOpen={setMessagesOpen}
              notificationsOpen={notificationsOpen}
              setNotificationsOpen={setNotificationsOpen}
              shownConversations={shownConversations}
              notifications={notifications}
              onConversationClick={(id) =>
                openConversation(id, setMessagesOpen)
              }
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
=======
            <div className="hidden md:flex items-center gap-2">
              {/* Messenger */}
              <div className="relative" ref={messagesRef}>
                <button
                  onClick={() => {
                    setMessagesOpen((v) => !v);
                    setNotificationsOpen(false);
                  }}
                  className="relative w-10 h-10 rounded-lg bg-[#13201E] hover:bg-[#1A2B28] border-2 border-[#223330] hover:border-purple-500 flex items-center justify-center text-cream-white transition-all duration-150 active:scale-95"
                  aria-label="Messages"
                >
                  <MessageSquare size={18} />
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-purple-500 border-2 border-[#0B1211] text-[#05201D] text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-bold">
                      {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                    </span>
                  )}
                </button>
>>>>>>> theirs

<<<<<<< ours
            {/* Mobile Menu Button */}
            <MobileNav
              unreadMessageCount={unreadMessageCount}
              unreadCount={unreadCount}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              setNotificationsOpen={setNotificationsOpen}
              onFeatureClick={handleFeatureClick}
            />
=======
                {messagesOpen && (
                  <div className="absolute right-0 mt-2 w-[360px] bg-[#0B1211] border-3 border-[#223330] rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#223330] bg-[#13201E]">
                      <div className="text-cream-white font-bold">Chats</div>
                      <a
                        href="/messages"
                        className="text-xs font-semibold text-purple-300 hover:text-purple-200"
                      >
                        Open Messenger
                      </a>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                      {shownConversations.length === 0 ? (
                        <div className="px-4 py-10 text-center text-[#B9B0A0] text-sm">
                          You're all caught up.
                          <div className="text-[#7C7468] text-xs mt-1">
                            Open Messenger to see all chats.
                          </div>
                        </div>
                      ) : (
                        shownConversations.map((c) => {
                          const name =
                            c.other_display_name ||
                            c.other_user_name ||
                            "Adventurer";
                          const last = c.last_message || "";
                          const time = formatConversationTime(
                            c.last_message_at,
                          );
                          const initial = name.charAt(0).toUpperCase();

                          return (
                            <button
                              key={c.id}
                              onClick={() => openConversation(c.id)}
                              className="w-full text-left px-4 py-3 hover:bg-[#17312D] transition-colors border-b border-[#142321]"
                            >
                              <div className="flex items-center gap-3">
                                {c.other_avatar_url ? (
                                  <img
                                    src={c.other_avatar_url}
                                    alt={name}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-[#223330]"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#13201E] border-2 border-[#223330] flex items-center justify-center text-purple-300 font-bold flex-shrink-0">
                                    {initial}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="text-cream-white text-sm font-semibold truncate">
                                      {name}
                                    </div>
                                    <div className="text-[#B9B0A0] text-xs whitespace-nowrap">
                                      {time}
                                    </div>
                                  </div>
                                  <div className="text-[#D6CCBA] text-sm mt-0.5 truncate">
                                    {last || "Say hi"}
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <a
                      href="/messages"
                      className="block px-4 py-3 border-t-2 border-[#223330] text-sm text-purple-300 hover:text-purple-200 hover:bg-[#13201E] transition-colors"
                    >
                      See all
                    </a>
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => {
                    setNotificationsOpen((v) => !v);
                    setMessagesOpen(false);
                  }}
                  className="relative w-10 h-10 rounded-lg bg-[#13201E] hover:bg-[#1A2B28] border-2 border-[#223330] hover:border-purple-500 flex items-center justify-center text-cream-white transition-all duration-150 active:scale-95"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-ancient-gold border-2 border-[#0B1211] text-[#05201D] text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-bold">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-[360px] bg-[#0B1211] border-3 border-[#223330] rounded-xl shadow-2xl overflow-hidden z-50">
                    <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#223330] bg-[#13201E]">
                      <div className="text-cream-white font-bold">
                        Notifications
                      </div>
                      <button
                        onClick={() => markAllAsReadMutation.mutate()}
                        disabled={
                          unreadCount === 0 || markAllAsReadMutation.isPending
                        }
                        className="text-xs font-semibold text-purple-300 hover:text-purple-200 disabled:opacity-50"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div className="max-h-[420px] overflow-y-auto">
                      {shownNotifications.length === 0 ? (
                        <div className="px-4 py-10 text-center text-[#B9B0A0] text-sm">
                          You're all caught up.
                        </div>
                      ) : (
                        shownNotifications.map((n) => {
                          const unread = !n.read;
                          const bg = unread ? "bg-[#10201D]" : "bg-transparent";

                          return (
                            <button
                              key={n.id}
                              onClick={() => openNotification(n)}
                              className={`w-full text-left px-4 py-3 hover:bg-[#17312D] transition-colors border-b border-[#142321] ${bg}`}
                            >
                              <div className="flex items-start gap-3">
                                {n.from_user_avatar_url ? (
                                  <img
                                    src={n.from_user_avatar_url}
                                    alt={n.from_user_display_name}
                                    className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-[#223330]"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded-full bg-[#13201E] border-2 border-[#223330] flex-shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="text-cream-white text-sm font-semibold truncate">
                                      {n.title || "Notification"}
                                    </div>
                                    <div className="text-[#B9B0A0] text-xs whitespace-nowrap">
                                      {formatTime(n.created_at)}
                                    </div>
                                  </div>
                                  <div className="text-[#D6CCBA] text-sm mt-0.5 leading-snug">
                                    <span className="font-semibold text-cream-white">
                                      {n.from_user_display_name}
                                    </span>{" "}
                                    <span>{n.message}</span>
                                  </div>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <a
                      href="/profile?tab=allies"
                      className="block px-4 py-3 border-t-2 border-[#223330] text-sm text-purple-300 hover:text-purple-200 hover:bg-[#13201E] transition-colors"
                    >
                      See all
                    </a>
                  </div>
                )}
              </div>

              {/* Feature Requests Button */}
              <div className="relative">
                <button
                  onClick={handleFeatureClick}
                  onMouseEnter={() => setShowFeatureTooltip(true)}
                  onMouseLeave={() => setShowFeatureTooltip(false)}
                  className="w-10 h-10 rounded-lg bg-[#13201E] hover:bg-[#1A2B28] border-2 border-[#223330] hover:border-purple-500 flex items-center justify-center text-cream-white transition-all duration-150 active:scale-95"
                  aria-label="Feature requests"
                >
                  <Wrench size={18} />
                </button>

                {showFeatureTooltip && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-[#13201E] border-2 border-purple-500 text-cream-white text-xs rounded-lg p-3 shadow-teal-glow z-50">
                    <div className="font-semibold mb-1 text-purple-200">
                      Feature Requests
                    </div>
                    <div className="text-[#D6CCBA]">
                      Request new features or vote on ideas from other users!
                    </div>
                    <div className="absolute -top-1 right-3 w-2 h-2 bg-[#13201E] border-t-2 border-l-2 border-purple-500 transform rotate-45"></div>
                  </div>
                )}
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-lg border-2 border-[#223330] hover:border-purple-500 text-sm font-semibold text-[#D6CCBA] hover:text-cream-white hover:bg-[#13201E] transition-all duration-150 active:scale-95"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-2 md:hidden">
              <a
                href="/messages"
                className="relative w-10 h-10 rounded-lg bg-[#13201E] hover:bg-[#1A2B28] border-2 border-[#223330] hover:border-purple-500 flex items-center justify-center text-cream-white transition-colors"
                aria-label="Messages"
              >
                <MessageSquare size={18} />
                {unreadMessageCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-500 border-2 border-[#0B1211] text-[#05201D] text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-bold">
                    {unreadMessageCount > 9 ? "9+" : unreadMessageCount}
                  </span>
                )}
              </a>
              <button
                onClick={() => setNotificationsOpen((v) => !v)}
                className="relative w-10 h-10 rounded-lg bg-[#13201E] hover:bg-[#1A2B28] border-2 border-[#223330] hover:border-purple-500 flex items-center justify-center text-cream-white transition-colors"
                aria-label="Notifications"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-ancient-gold border-2 border-[#0B1211] text-[#05201D] text-[10px] min-w-5 h-5 px-1 rounded-full flex items-center justify-center font-bold">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleFeatureClick}
                className="w-10 h-10 rounded-lg bg-[#13201E] hover:bg-[#1A2B28] border-2 border-[#223330] hover:border-purple-500 flex items-center justify-center text-cream-white transition-colors"
                aria-label="Feature requests"
              >
                <Wrench size={18} />
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-10 h-10 rounded-lg bg-[#13201E] hover:bg-[#1A2B28] border-2 border-[#223330] hover:border-purple-500 flex items-center justify-center text-cream-white transition-colors"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
>>>>>>> theirs
          </div>

          {/* Mobile Notifications Dropdown */}
          {notificationsOpen && (
<<<<<<< ours
            <MobileNotificationsDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAllRead={() => markAllAsReadMutation.mutate()}
              onNotificationClick={(n) =>
                openNotification(n, setNotificationsOpen)
              }
              isMarkingAllRead={markAllAsReadMutation.isPending}
            />
=======
            <div className="md:hidden pb-4">
              <div className="mt-2 bg-[#0B1211] border-2 border-[#223330] rounded-xl overflow-hidden shadow-2xl">
                <div className="flex items-center justify-between px-4 py-3 border-b-2 border-[#223330] bg-[#13201E]">
                  <div className="text-cream-white font-bold">
                    Notifications
                  </div>
                  <button
                    onClick={() => markAllAsReadMutation.mutate()}
                    disabled={
                      unreadCount === 0 || markAllAsReadMutation.isPending
                    }
                    className="text-xs font-semibold text-purple-300 hover:text-purple-200 disabled:opacity-50"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="max-h-[360px] overflow-y-auto">
                  {shownNotifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-[#B9B0A0] text-sm">
                      You're all caught up.
                    </div>
                  ) : (
                    shownNotifications.map((n) => {
                      const unread = !n.read;
                      const bg = unread ? "bg-[#10201D]" : "bg-transparent";

                      return (
                        <button
                          key={n.id}
                          onClick={() => openNotification(n)}
                          className={`w-full text-left px-4 py-3 hover:bg-[#17312D] transition-colors border-b border-[#142321] ${bg}`}
                        >
                          <div className="flex items-start gap-3">
                            {n.from_user_avatar_url ? (
                              <img
                                src={n.from_user_avatar_url}
                                alt={n.from_user_display_name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0 border-2 border-[#223330]"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#13201E] border-2 border-[#223330] flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="text-cream-white text-sm font-semibold truncate">
                                  {n.title || "Notification"}
                                </div>
                                <div className="text-[#B9B0A0] text-xs whitespace-nowrap">
                                  {formatTime(n.created_at)}
                                </div>
                              </div>
                              <div className="text-[#D6CCBA] text-sm mt-0.5 leading-snug">
                                <span className="font-semibold text-cream-white">
                                  {n.from_user_display_name}
                                </span>{" "}
                                <span>{n.message}</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <a
                  href="/profile?tab=allies"
                  className="block px-4 py-3 border-t-2 border-[#223330] text-sm text-purple-300 hover:text-purple-200 hover:bg-[#13201E] transition-colors"
                >
                  See all
                </a>
              </div>
            </div>
>>>>>>> theirs
          )}

<<<<<<< ours
          {/* Mobile Menu */}
          {mobileMenuOpen && <MobileMenu onLogout={handleLogout} />}
=======
          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t-2 border-[#223330]">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-[#D6CCBA] hover:text-cream-white hover:bg-[#13201E] transition-colors w-full"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
>>>>>>> theirs
        </div>
      </nav>
    </>
  );
}
