// import React, { useEffect, useMemo, useState, useCallback } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TextInput,
//   FlatList,
//   Pressable,
//   Image,
//   Alert,
//   RefreshControl,
//   Platform,
// } from "react-native";
// import { useRouter, useFocusEffect } from "expo-router";
// import { Icon } from "@/src/components/Icon.native";
// // import http from "@/src/services/http";

// const COLORS = {
//   bg: "#F8F9FA",
//   card: "#FFFFFF",
//   text: "#111827",
//   sub: "#6B7280",
//   border: "#E5E7EB",
//   blue: "#007AFF",
//   green: "#22C55E",
//   amber: "#F59E0B",
//   red: "#EF4444",
//   zinc50: "#F9FAFB",
//   zinc100: "#F3F4F6",
// };

// const CATEGORIES = [
//   { key: "all", label: "Tất cả" },
//   { key: "electric", label: "Điện" },
//   { key: "water", label: "Nước" },
//   { key: "hvac", label: "Điều hoà" },
//   { key: "appliance", label: "Gia dụng" },
// ];

// const STATUS = [
//   { key: "all", label: "Tất cả" },
//   { key: "ok", label: "Tốt" },
//   { key: "need_check", label: "Cần kiểm tra" },
//   { key: "broken", label: "Hỏng" },
// ];

// const SORTS = [
//   { key: "updated_desc", label: "Cập nhật mới → cũ" },
//   { key: "updated_asc", label: "Cập nhật cũ → mới" },
//   { key: "name_asc", label: "Tên A → Z" },
// ];

// const mockFetch = async () => {
//   // Thay bằng:
//   // const { data } = await http.get('/devices/my');
//   await new Promise((r) => setTimeout(r, 300));
//   return [
//     {
//       id: "dv-1001",
//       name: "Máy lạnh Panasonic 1HP",
//       category: "hvac",
//       status: "ok",
//       serial: "AC-PA-1101",
//       location: "Phòng ngủ",
//       updatedAt: "2025-01-10T08:22:00Z",
//       photo:
//         "https://images.unsplash.com/photo-1627384113743-6df8fc14f1db?q=80&w=1200&auto=format&fit=crop",
//     },
//     {
//       id: "dv-1002",
//       name: "Máy bơm nước",
//       category: "water",
//       status: "need_check",
//       serial: "WP-0933",
//       location: "Ban công",
//       updatedAt: "2025-01-11T10:02:00Z",
//       photo:
//         "https://images.unsplash.com/photo-1509395176047-4a66953fd231?q=80&w=1169&auto=format&fit=crop",
//     },
//     {
//       id: "dv-1003",
//       name: "Bếp điện từ",
//       category: "appliance",
//       status: "broken",
//       serial: "IH-2205",
//       location: "Bếp",
//       updatedAt: "2025-01-09T19:44:00Z",
//       photo:
//         "https://images.unsplash.com/photo-1577640928141-681fe9a77295?q=80&w=1200&auto=format&fit=crop",
//     },
//   ];
// };

// export default function ResidentDevices() {
//   const router = useRouter();

//   // data
//   const [devices, setDevices] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);

//   // filters
//   const [q, setQ] = useState("");
//   const [cat, setCat] = useState("all");
//   const [st, setSt] = useState("all");
//   const [sort, setSort] = useState("updated_desc");

//   useEffect(() => {
//     (async () => {
//       try {
//         setLoading(true);
//         const data = await mockFetch();
//         setDevices(data);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   useFocusEffect(
//     useCallback(() => {
//       let mounted = true;
//       (async () => {
//         try {
//           setRefreshing(true);
//           const data = await mockFetch();
//           if (mounted) setDevices(data);
//         } finally {
//           setRefreshing(false);
//         }
//       })();
//       return () => {
//         mounted = false;
//       };
//     }, [])
//   );

//   const onRefresh = async () => {
//     setRefreshing(true);
//     try {
//       const data = await mockFetch();
//       setDevices(data);
//     } finally {
//       setRefreshing(false);
//     }
//   };

//   const filtered = useMemo(() => {
//     let list = [...devices];
//     if (q.trim()) {
//       const s = q.trim().toLowerCase();
//       list = list.filter(
//         (d) =>
//           d.name.toLowerCase().includes(s) ||
//           d.serial.toLowerCase().includes(s) ||
//           (d.location || "").toLowerCase().includes(s)
//       );
//     }
//     if (cat !== "all") list = list.filter((d) => d.category === cat);
//     if (st !== "all") list = list.filter((d) => d.status === st);

//     switch (sort) {
//       case "updated_asc":
//         list.sort(
//           (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
//         );
//         break;
//       case "name_asc":
//         list.sort((a, b) => a.name.localeCompare(b.name));
//         break;
//       default:
//         list.sort(
//           (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
//         );
//     }
//     return list;
//   }, [devices, q, cat, st, sort]);

//   const StatusPill = ({ status }) => {
//     const map = {
//       ok: { bg: "#EAFBE7", color: COLORS.green, label: "Tốt" },
//       need_check: { bg: "#FFF7ED", color: COLORS.amber, label: "Cần kiểm tra" },
//       broken: { bg: "#FEF2F2", color: COLORS.red, label: "Hỏng" },
//     };
//     const s = map[status] || map.ok;
//     return (
//       <View style={[styles.pill, { backgroundColor: s.bg }]}>
//         <Text style={[styles.pillText, { color: s.color }]}>{s.label}</Text>
//       </View>
//     );
//   };

//   const CategoryChip = ({ item, value, onChange }) => (
//     <Pressable
//       onPress={() => onChange(item.key)}
//       style={[
//         styles.chip,
//         value === item.key && { backgroundColor: "#E8F3FF", borderColor: COLORS.blue },
//       ]}
//     >
//       <Text
//         style={[
//           styles.chipText,
//           value === item.key && { color: COLORS.blue, fontWeight: "700" },
//         ]}
//       >
//         {item.label}
//       </Text>
//     </Pressable>
//   );

//   const SmallSelect = ({ value, setValue, data, icon }) => (
//     <View style={styles.smallSelect}>
//       <Icon name={icon} size={16} color={COLORS.sub} />
//       <FlatList
//         data={data}
//         keyExtractor={(x) => x.key}
//         horizontal
//         showsHorizontalScrollIndicator={false}
//         renderItem={({ item }) => (
//           <Pressable
//             onPress={() => setValue(item.key)}
//             style={[
//               styles.smallOption,
//               value === item.key && { backgroundColor: COLORS.blue + "22" },
//             ]}
//           >
//             <Text
//               style={[
//                 styles.smallOptionText,
//                 value === item.key && { color: COLORS.blue, fontWeight: "700" },
//               ]}
//             >
//               {item.label}
//             </Text>
//           </Pressable>
//         )}
//       />
//     </View>
//   );

//   const renderItem = ({ item }) => (
//     <View style={styles.card}>
//       <View style={styles.cardImageWrap}>
//         {item.photo ? (
//           <Image source={{ uri: item.photo }} style={styles.cardImage} />
//         ) : (
//           <View style={styles.cardImagePlaceholder}>
//             <Icon name="photo" size={28} color={COLORS.sub} />
//           </View>
//         )}
//       </View>
//       <View style={{ flex: 1 }}>
//         <Text style={styles.cardTitle} numberOfLines={1}>
//           {item.name}
//         </Text>
//         <Text style={styles.cardSub} numberOfLines={1}>
//           {item.location || "Chưa đặt vị trí"} • {item.serial || "Không có serial"}
//         </Text>
//         <View style={styles.cardRow}>
//           <StatusPill status={item.status} />
//           <Text style={styles.timeText}>
//             Cập nhật:{" "}
//             {new Date(item.updatedAt).toLocaleString("vi-VN", {
//               hour: "2-digit",
//               minute: "2-digit",
//               day: "2-digit",
//               month: "2-digit",
//             })}
//           </Text>
//         </View>
//         <View style={styles.cardActions}>
//           <Pressable
//             style={styles.ghostBtn}
//             onPress={() => router.push(`/(resident)/device/${item.id}`)}
//           >
//             <Icon name="doc.text" size={16} color={COLORS.blue} />
//             <Text style={styles.ghostBtnText}>Chi tiết</Text>
//           </Pressable>
//           <Pressable
//             style={styles.ghostBtn}
//             onPress={() => Alert.alert("Bảo trì", "Tạo yêu cầu bảo trì cho thiết bị (todo)")}
//           >
//             <Icon name="wrench.and.screwdriver" size={16} color={COLORS.blue} />
//             <Text style={styles.ghostBtnText}>Bảo trì</Text>
//           </Pressable>
//         </View>
//       </View>
//     </View>
//   );

//   return (
//     <View style={[styles.container]}>
//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.title}>Thiết bị của tôi</Text>
//         <Text style={styles.subtitle}>Quản lý thiết bị, theo dõi tình trạng, tạo bảo trì</Text>
//       </View>

//       {/* Search + category */}
//       <View style={styles.searchWrap}>
//         <View style={styles.searchInput}>
//           <Icon name="magnifyingglass" size={18} color={COLORS.sub} />
//           <TextInput
//             value={q}
//             onChangeText={setQ}
//             placeholder="Tìm tên / serial / vị trí..."
//             placeholderTextColor={COLORS.sub}
//             style={styles.searchText}
//             autoCapitalize="none"
//           />
//           {!!q && (
//             <Pressable onPress={() => setQ("")} style={styles.clearBtn}>
//               <Icon name="xmark.circle.fill" size={16} color={COLORS.sub} />
//             </Pressable>
//           )}
//         </View>

//         <FlatList
//           horizontal
//           showsHorizontalScrollIndicator={false}
//           data={CATEGORIES}
//           keyExtractor={(x) => x.key}
//           contentContainerStyle={{ gap: 8 }}
//           renderItem={({ item }) => (
//             <CategoryChip item={item} value={cat} onChange={setCat} />
//           )}
//           style={{ marginTop: 10 }}
//         />
//       </View>

//       {/* Status + sort row */}
//       <View style={styles.filterRow}>
//         <SmallSelect value={st} setValue={setSt} data={STATUS} icon="hazardsign" />
//         <SmallSelect value={sort} setValue={setSort} data={SORTS} icon="arrow.up.arrow.down" />
//       </View>

//       {/* List */}
//       <FlatList
//         contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
//         data={filtered}
//         keyExtractor={(x) => x.id}
//         renderItem={renderItem}
//         ListEmptyComponent={
//           !loading && (
//             <View style={styles.empty}>
//               <Icon name="tray" size={36} color={COLORS.sub} />
//               <Text style={styles.emptyText}>Chưa có thiết bị nào</Text>
//             </View>
//           )
//         }
//         refreshControl={
//           <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.blue} />
//         }
//       />

//       {/* FAB */}
//       <Pressable style={styles.fab} onPress={() => router.push("/(resident)/device/new")}>
//         <Icon name="plus" size={20} color="#fff" />
//         <Text style={styles.fabText}>Thêm thiết bị</Text>
//       </Pressable>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: COLORS.bg },
//   header: {
//     paddingHorizontal: 16,
//     paddingTop: 8,
//     paddingBottom: 12,
//     backgroundColor: COLORS.bg,
//   },
//   title: { fontSize: 22, fontWeight: "800", color: COLORS.text },
//   subtitle: { fontSize: 13, color: COLORS.sub, marginTop: 4 },

//   searchWrap: { paddingHorizontal: 16, paddingTop: 5, paddingBottom: 10, gap: 5 },
//   searchInput: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 5,
//     backgroundColor: COLORS.card,
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     paddingHorizontal: 12,
//     paddingVertical: Platform.select({ ios: 7, android: 5 }),
//   },
//   searchText: { flex: 1, color: COLORS.text, fontSize: 15 },
//   clearBtn: { padding: 4 },

//   filterRow: { paddingHorizontal: 16, paddingBottom: 4, gap: 10 },

//   chip: {
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     backgroundColor: COLORS.zinc100,
//     borderRadius: 999,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   chipText: { fontSize: 13, color: COLORS.text },

//   smallSelect: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     backgroundColor: COLORS.card,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     borderRadius: 12,
//     paddingHorizontal: 10,
//     paddingVertical: 8,
//   },
//   smallOption: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
//   smallOptionText: { color: COLORS.sub, fontSize: 12 },

//   card: {
//     flexDirection: "row",
//     gap: 12,
//     padding: 12,
//     borderRadius: 14,
//     backgroundColor: COLORS.card,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     marginBottom: 12,
//   },
//   cardImageWrap: {
//     width: 84,
//     height: 84,
//     borderRadius: 10,
//     overflow: "hidden",
//     backgroundColor: COLORS.zinc100,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//   },
//   cardImage: { width: "100%", height: "100%" },
//   cardImagePlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
//   cardTitle: { fontSize: 16, fontWeight: "800", color: COLORS.text },
//   cardSub: { fontSize: 12, color: COLORS.sub, marginTop: 2 },
//   cardRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 },
//   timeText: { color: COLORS.sub, fontSize: 11, marginLeft: "auto" },

//   pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
//   pillText: { fontSize: 12, fontWeight: "700" },

//   cardActions: { flexDirection: "row", gap: 10, marginTop: 12 },
//   ghostBtn: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     borderRadius: 10,
//     borderWidth: 1,
//     borderColor: COLORS.border,
//     backgroundColor: COLORS.zinc50,
//   },
//   ghostBtnText: { color: COLORS.blue, fontWeight: "700", fontSize: 13 },

//   fab: {
//     position: "absolute",
//     right: 16,
//     bottom: 28,
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 8,
//     backgroundColor: COLORS.blue,
//     borderRadius: 999,
//     paddingHorizontal: 16,
//     paddingVertical: 14,
//     shadowColor: "#000",
//     shadowOpacity: 0.2,
//     shadowRadius: 6,
//     elevation: 4,
//   },
//   fabText: { color: "#fff", fontWeight: "800" },

//   empty: { alignItems: "center", justifyContent: "center", paddingVertical: 60, gap: 8 },
//   emptyText: { color: COLORS.sub, fontSize: 13 },
// });
