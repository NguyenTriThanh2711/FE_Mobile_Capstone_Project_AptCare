
import { Pressable, View, Text ,StyleSheet} from "react-native";
import { Icon } from "./Icon.native";
import { appleBlue, zincColors } from "../utils/colors";
import { Colors } from "@/src/utils/colors";
import { timeDate } from "../utils/date";

const THEME = Colors.light;

export default function ReportListItem({ index, report, onPress, type }) {
  const approved = report?.status === 'Approved';
  return (
    <Pressable style={styles.reportItem} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        {approved ? <Icon name="checkmark.circle.fill" size={18} color="#16A34A" /> : <Icon name="circle.fill" size={18} color="#DC2626" />}
        <Icon name="doc.text" size={18} color={appleBlue} />
        <Text style={styles.reportTitle} numberOfLines={1}>
          {`Báo cáo ${type == 'Inspection' ? 'Khảo sát ' : 'sửa chữa '} ${index}`}
        </Text>
      </View>
      <Text style={styles.reportTime}>{timeDate(report?.createdAt)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  reportItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: zincColors[100],
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  reportTitle: { fontSize: 15, fontWeight: '700', color: THEME.text, flex: 1 },
  reportTime: { fontSize: 12, color: zincColors[600], marginLeft: 8 },
});