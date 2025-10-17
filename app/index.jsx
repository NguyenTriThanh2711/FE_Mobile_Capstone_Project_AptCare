import { Redirect } from "expo-router";

export default function Index() {
  // mục đích tạo file này là chuyển hướng người dùng vào role-gateway trong trường hợp vào ứng dụng lần đầu tiên
  return <Redirect href="/role-gateway" />;
}
