// import { View, Text, TouchableOpacity } from "react-native";
// import { useLocalSearchParams } from "expo-router";
// import { useDispatch, useSelector } from "react-redux";
// import { assignTech, updateStatus } from "@/src/store/slices/requestSlice";

// export default function RequestDetail() {
//   const { id } = useLocalSearchParams();
//   const req = useSelector((s) => s.requests.items.find((x) => x.id === id));
//   const role = useSelector((s) => s.auth.user?.role);
//   const dispatch = useDispatch();

//   if (!req) return <View className="p-6"><Text>Không tìm thấy yêu cầu.</Text></View>;

//   return (
//     <View className="flex-1 bg-white p-6 gap-3">
//       <Text className="text-lg font-bold">{req.title}</Text>
//       <Text className="text-gray-600">{req.description}</Text>
//       <Text className="mt-2">Trạng thái: <Text className="font-semibold">{req.status}</Text></Text>
//       {role === "manager" && (
//         <TouchableOpacity className="bg-warn rounded p-3 mt-4" onPress={() => dispatch(assignTech({ id, techId: "tech-1" }))}>
//           <Text className="text-white text-center">Phân công kỹ thuật viên</Text>
//         </TouchableOpacity>
//       )}
//       {role === "technician" && req.status !== "done" && (
//         <TouchableOpacity className="bg-accent rounded p-3 mt-4" onPress={() => dispatch(updateStatus({ id, status: "in_progress" }))}>
//           <Text className="text-white text-center">Nhận việc / Đang xử lý</Text>
//         </TouchableOpacity>
//       )}
//       {role !== "manager" && req.status === "in_progress" && (
//         <TouchableOpacity className="bg-primary rounded p-3 mt-4" onPress={() => dispatch(updateStatus({ id, status: "done" }))}>
//           <Text className="text-white text-center">Đánh dấu hoàn tất</Text>
//         </TouchableOpacity>
//       )}
//     </View>
//   );
// }
