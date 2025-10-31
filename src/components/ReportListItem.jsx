import { timeDayDate } from "@/src/utils/date";

export default function ReportListItem({ index, report, onPress, type }) {
  return (
    <Pressable style={styles.reportItem} onPress={onPress}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
        <Icon name="doc.text" size={18} color={appleBlue} />
        <Text style={styles.reportTitle} numberOfLines={1}>
          {`Báo cáo ${type == 'Inspection' ? 'Khảo sát ' : 'sửa chữa '} ${index}`}
        </Text>
      </View>
      <Text style={styles.reportTime}>{timeDayDate(report?.createdAt)}</Text>
    </Pressable>
  );
}
