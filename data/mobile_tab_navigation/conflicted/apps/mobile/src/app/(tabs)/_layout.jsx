import { Tabs } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";
<<<<<<< ours
import { StatusBar } from "expo-status-bar";
import { useBadgeCounts } from "../../hooks/useBadgeCounts";
import { UI } from "../../ui/ui";
import { Icon } from "../../ui/icons";
=======
import { useBadgeCounts } from "../../hooks/useBadgeCounts";
import { useTheme } from "../../theme/ThemeProvider";
>>>>>>> theirs

<<<<<<< ours
function TabIconWrap({ focused, children }) {
=======
// ✅ UI kit + Icon wrapper
import { UI } from "../../ui/ui";
import { Icon } from "../../ui/icons";

function TabIconWrap({ focused, children }) {
>>>>>>> theirs
  const anim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: focused ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
  }, [focused, anim]);

  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const glowOpacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.15],
  });

  return (
    <Animated.View
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        transform: [{ scale }],
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          borderRadius: 22,
<<<<<<< ours
          backgroundColor: UI.brass,
          opacity: glowOpacity,
=======
          backgroundColor: "rgba(194,162,74,0.15)", // brass glow
          opacity: anim,
>>>>>>> theirs
        }}
      />
      {children}
    </Animated.View>
  );
}

export default function TabLayout() {
<<<<<<< ours

=======
  // keep theme only for badges/etc if you need it later
  useTheme();

>>>>>>> theirs
  const [userRole, setUserRole] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.user?.role);
          setUserProfile(data.user);
        }
      } catch (err) {
        console.error("Error fetching role:", err);
      }
    };
    fetchRole();
  }, []);

  const { counts } = useBadgeCounts(userProfile);

<<<<<<< ours

=======
  const activeColor = UI.brass;
  const inactiveColor = UI.textSecondary;

>>>>>>> theirs
  return (
<<<<<<< ours
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: UI.bg,
            borderTopWidth: 1,
            borderTopColor: UI.border1,
            paddingTop: 6,
          },
          tabBarActiveTintColor: UI.brass,
          tabBarInactiveTintColor: UI.muted,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            color: undefined,
          },
=======
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: UI.surface0,
          borderTopWidth: 1,
          borderTopColor: UI.border1,
          paddingTop: 6,
        },
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarShowLabel: true,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrap focused={focused}>
              <Icon name="layoutGrid" color={color} size={24} />
            </TabIconWrap>
          ),
          tabBarBadge:
            counts.ownerUpdates + counts.timeExceptions + counts.incidents > 0
              ? counts.ownerUpdates + counts.timeExceptions + counts.incidents
              : undefined,
>>>>>>> theirs
        }}
<<<<<<< ours
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: "Dashboard",
            tabBarIcon: ({ focused }) => (
              <TabIconWrap focused={focused}>
                <Icon name="layoutGrid" size={24} color={UI.brass} />
              </TabIconWrap>
            ),
            tabBarBadge:
              counts.ownerUpdates + counts.timeExceptions + counts.incidents > 0
                ? counts.ownerUpdates + counts.timeExceptions + counts.incidents
                : undefined,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ focused }) => (
              <TabIconWrap focused={focused}>
                <Icon name="calendar" size={24} color={UI.brass} />
              </TabIconWrap>
            ),
          }}
        />
        <Tabs.Screen
          name="horses"
          options={{
            title: "Horses",
            tabBarIcon: ({ focused }) => (
              <TabIconWrap focused={focused}>
                <Icon name="horse" size={20} color={UI.brass} />
              </TabIconWrap>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: "Chat",
            tabBarIcon: ({ focused }) => (
              <TabIconWrap focused={focused}>
                <Icon name="messageCircle" size={24} color={UI.brass} />
              </TabIconWrap>
            ),
            tabBarBadge: counts.messages > 0 ? counts.messages : undefined,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ focused }) => (
              <TabIconWrap focused={focused}>
                <Icon name="user" size={24} color={UI.brass} />
              </TabIconWrap>
            ),
            tabBarBadge:
              userRole === "OWNER" && counts.charges > 0
                ? counts.charges
                : undefined,
          }}
        />
=======
      />

      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrap focused={focused}>
              <Icon name="calendar" color={color} size={24} />
            </TabIconWrap>
          ),
        }}
      />

      <Tabs.Screen
        name="horses"
        options={{
          title: "Horses",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrap focused={focused}>
              <Icon name="horse" color={color} size={24} />
            </TabIconWrap>
          ),
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrap focused={focused}>
              <Icon name="messageCircle" color={color} size={24} />
            </TabIconWrap>
          ),
          tabBarBadge: counts.messages > 0 ? counts.messages : undefined,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIconWrap focused={focused}>
              <Icon name="user" color={color} size={24} />
            </TabIconWrap>
          ),
          tabBarBadge:
            userRole === "OWNER" && counts.charges > 0
              ? counts.charges
              : undefined,
        }}
      />
>>>>>>> theirs

        {/* Hide old tabs */}
        <Tabs.Screen name="home" options={{ href: null }} />
        <Tabs.Screen name="welcome" options={{ href: null }} />
        <Tabs.Screen name="today" options={{ href: null }} />
        <Tabs.Screen name="incidents" options={{ href: null }} />
        <Tabs.Screen name="shifts" options={{ href: null }} />
      </Tabs>
    </>
  );
}
