export function extractRooms(user) {
  const out = new Set();

  const pushRoom = (x) => {
    const rn = x?.roomNumber;
    if (typeof rn === 'string' && rn.trim()) out.add(rn.trim());
  };

  const scan = (node) => {
    if (!node || typeof node !== 'object') return;

    // Trường hợp phổ biến: { apartments: { $values: [ {...roomNumber} ] } }
    if (Array.isArray(node.$values)) node.$values.forEach(scan);

    // Nếu là mảng thuần
    if (Array.isArray(node)) {
      node.forEach(scan);
      return;
    }

    // Nếu là object, push nếu có roomNumber
    pushRoom(node);

    // Duyệt đệ quy các value con
    for (const v of Object.values(node)) scan(v);
  };

  // Bắt đầu từ user
  scan(user?.apartments ?? user);

  return Array.from(out);
}

// Tạo label hiển thị: lấy tối đa max, nếu dư thêm "..."
export function getRoomsLabel(user, max = 3, fallback = 'Unknown Apartment') {
  const rooms = extractRooms(user);
  if (rooms.length === 0) return fallback;
  const head = rooms.slice(0, max).join(', ');
  return rooms.length > max ? `${head}, ...` : head;
}
