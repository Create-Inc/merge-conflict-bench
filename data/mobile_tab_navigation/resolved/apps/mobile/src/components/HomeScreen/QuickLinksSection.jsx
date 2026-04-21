import React from "react";
import { View, Pressable } from "react-native";
import { Panel, T, UI } from "../../ui/ui";
import { Icon } from "../../ui/icons";

function Tile({ label, iconName, onPress }) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      {({ pressed }) => (
        <Panel
          variant="inset"
          style={{
            paddingVertical: 14,
            paddingHorizontal: 14,
            opacity: pressed ? 0.92 : 1,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: UI.border1,
              backgroundColor: "rgba(194,162,74,0.10)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 10,
            }}
          >
            <Icon name={iconName} size={20} color={UI.brass} />
          </View>

          <T.Body style={{ fontWeight: "800", letterSpacing: 0.2 }}>
            {label}
          </T.Body>

          <T.Muted style={{ marginTop: 2 }}>Open</T.Muted>
        </Panel>
      )}
    </Pressable>
  );
}

export function QuickLinksSection({ role, router }) {
  const go = (path) => router.push(path);

  const items = [
    { key: "horses", label: "Horses", iconName: "horse", to: "/horses" },
    { key: "calendar", label: "Calendar", iconName: "calendar", to: "/calendar" },
    {
      key: "alerts",
      label: "Alerts",
      iconName: "alertTriangle",
      to: "/incidents",
    },
    { key: "chat", label: "Chat", iconName: "messageCircle", to: "/chat" },
  ];

  if (role === "MANAGER") {
    items.push({ key: "staff", label: "Staff", iconName: "users", to: "/staff" });
  }
  if (role === "OWNER") {
    items.push({ key: "tasks", label: "Tasks", iconName: "clipboardList", to: "/today" });
  }

  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));

  return (
    <View style={{ marginTop: 14 }}>
      <T.Label style={{ marginBottom: 10 }}>Quick links</T.Label>

      <View style={{ gap: 12 }}>
        {rows.map((pair, idx) => (
          <View key={idx} style={{ flexDirection: "row", gap: 12 }}>
            <Tile
              label={pair[0].label}
              iconName={pair[0].iconName}
              onPress={() => go(pair[0].to)}
            />
            {pair[1] ? (
              <Tile
                label={pair[1].label}
                iconName={pair[1].iconName}
                onPress={() => go(pair[1].to)}
              />
            ) : (
              <View style={{ flex: 1 }} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}
