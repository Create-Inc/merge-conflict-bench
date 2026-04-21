import { Tabs } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useBadgeCounts } from "../../hooks/useBadgeCounts";
import { UI } from "../../ui/ui";
import { Icon } from "../../ui/icons";

function TabIconWrap({ focused, children }) {
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
          backgroundColor: UI.brass,
          opacity: glowOpacity,
        }}
      />
      {children}
    </Animated.View>
  );
}

export default function TabLayout() {
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

  return (
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
        }}
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

        <Tabs.Screen name="home" options={{ href: null }} />
        <Tabs.Screen name="welcome" options={{ href: null }} />
        <Tabs.Screen name="today" options={{ href: null }} />
        <Tabs.Screen name="incidents" options={{ href: null }} />
        <Tabs.Screen name="shifts" options={{ href: null }} />
      </Tabs>
    </>
  );
}
