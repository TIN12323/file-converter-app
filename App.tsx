import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar as NativeStatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type TabKey = 'home' | 'tools' | 'files' | 'scan' | 'settings';

type Tool = {
  title: string;
  subtitle: string;
  accent: string;
  status: 'ready' | 'soon';
};

const tabs: Array<{ key: TabKey; label: string; icon: string }> = [
  { key: 'home', label: 'Trang chủ', icon: '⌂' },
  { key: 'tools', label: 'Công cụ', icon: '▦' },
  { key: 'files', label: 'Tệp', icon: '□' },
  { key: 'scan', label: 'Quét', icon: '◇' },
  { key: 'settings', label: 'Cài đặt', icon: '⚙' },
];

const tools: Tool[] = [
  {
    title: 'Ảnh sang PDF',
    subtitle: 'Chọn nhiều ảnh và tạo PDF',
    accent: '#dc2626',
    status: 'ready',
  },
  {
    title: 'PDF sang ảnh',
    subtitle: 'Sắp có ở bản sau',
    accent: '#2563eb',
    status: 'soon',
  },
  {
    title: 'Nén PDF',
    subtitle: 'Giảm dung lượng file',
    accent: '#16a34a',
    status: 'soon',
  },
  {
    title: 'Nối PDF',
    subtitle: 'Gộp nhiều PDF thành một',
    accent: '#7c3aed',
    status: 'soon',
  },
  {
    title: 'Tách PDF',
    subtitle: 'Tách trang từ file PDF',
    accent: '#ea580c',
    status: 'soon',
  },
  {
    title: 'Xoay PDF',
    subtitle: 'Chỉnh hướng trang PDF',
    accent: '#0891b2',
    status: 'soon',
  },
];

const androidStatusBarHeight =
  Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0;
const bottomSystemGap = Platform.OS === 'android' ? 24 : 10;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const screenTitle = useMemo(() => {
    return tabs.find((tab) => tab.key === activeTab)?.label ?? 'TinPDF';
  }, [activeTab]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#f2f4f8" />
      <View style={styles.appShell}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>TinPDF</Text>
            <Text style={styles.headerSubtitle}>{screenTitle}</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} activeOpacity={0.8}>
            <Text style={styles.profileInitial}>T</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'home' && <HomeScreen onStart={() => setActiveTab('scan')} />}
          {activeTab === 'tools' && <ToolsScreen onStart={() => setActiveTab('scan')} />}
          {activeTab === 'files' && <FilesScreen />}
          {activeTab === 'scan' && <ScanScreen />}
          {activeTab === 'settings' && <SettingsScreen />}
        </ScrollView>

        <View style={styles.tabBar}>
          {tabs.map((tab) => {
            const isActive = tab.key === activeTab;

            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.tabItem}
                activeOpacity={0.8}
                onPress={() => setActiveTab(tab.key)}
              >
                <Text style={[styles.tabIcon, isActive && styles.tabIconActive]}>
                  {tab.icon}
                </Text>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.searchBox}>
        <Text style={styles.searchText}>Tìm kiếm công cụ hoặc file</Text>
      </View>

      <View style={styles.primaryPanel}>
        <View style={styles.primaryIcon}>
          <Text style={styles.primaryIconText}>PDF</Text>
        </View>
        <View style={styles.primaryCopy}>
          <Text style={styles.sectionEyebrow}>Tác vụ chính</Text>
          <Text style={styles.primaryTitle}>Tạo PDF từ ảnh</Text>
          <Text style={styles.primaryDescription}>
            Chọn ảnh giấy tờ, hóa đơn hoặc bài học và chuyển thành một file PDF gọn gàng.
          </Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={onStart}>
          <Text style={styles.primaryButtonIcon}>+</Text>
          <Text style={styles.primaryButtonText}>Chọn ảnh</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Tệp gần đây</Text>
        <Text style={styles.sectionAction}>Xem tất cả</Text>
      </View>

      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Chưa có PDF nào</Text>
        <Text style={styles.emptyDescription}>
          Sau khi tạo file đầu tiên, lịch sử sẽ xuất hiện ở đây để bạn mở lại nhanh.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Lối tắt</Text>
      <View style={styles.shortcutGrid}>
        <Shortcut title="Ảnh sang PDF" tone="#dc2626" onPress={onStart} />
        <Shortcut title="PDF sang ảnh" tone="#2563eb" disabled />
        <Shortcut title="Nén PDF" tone="#16a34a" disabled />
        <Shortcut title="Nối PDF" tone="#7c3aed" disabled />
      </View>
    </View>
  );
}

function ToolsScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.screen}>
      <Text style={styles.pageTitle}>Công cụ PDF</Text>
      <Text style={styles.pageDescription}>
        Bản đầu tập trung làm ảnh sang PDF thật ổn. Các công cụ còn lại sẽ được mở dần.
      </Text>

      <View style={styles.toolsGrid}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.title}
            style={styles.toolCard}
            activeOpacity={tool.status === 'ready' ? 0.85 : 1}
            onPress={tool.status === 'ready' ? onStart : undefined}
          >
            <View style={[styles.toolIcon, { backgroundColor: tool.accent }]}>
              <Text style={styles.toolIconText}>{tool.title.charAt(0)}</Text>
            </View>
            <Text style={styles.toolTitle}>{tool.title}</Text>
            <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
            {tool.status === 'soon' && <Text style={styles.soonBadge}>Sắp ra mắt</Text>}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function FilesScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.pageTitle}>Tệp của bạn</Text>
      <Text style={styles.pageDescription}>
        Những file PDF đã tạo sẽ được lưu trong lịch sử trên máy.
      </Text>

      <View style={styles.filePanel}>
        <Text style={styles.filePanelIcon}>□</Text>
        <Text style={styles.emptyTitle}>Chưa có file đã tạo</Text>
        <Text style={styles.emptyDescription}>
          Khi mốc tạo PDF hoàn thành, bạn sẽ xem, chia sẻ và xóa file ngay tại đây.
        </Text>
      </View>
    </View>
  );
}

function ScanScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.pageTitle}>Ảnh sang PDF</Text>
      <Text style={styles.pageDescription}>
        Luồng chính của TinPDF: chọn ảnh, sắp xếp, cấu hình A4 và tạo PDF.
      </Text>

      <View style={styles.workflowPanel}>
        <Step number="1" title="Chọn ảnh" detail="Lấy ảnh từ thư viện điện thoại." />
        <Step number="2" title="Sắp xếp" detail="Đổi thứ tự, xóa ảnh thừa, thêm ảnh mới." />
        <Step number="3" title="Tạo PDF" detail="Xuất file A4 dọc với margin nhỏ." />
      </View>

      <TouchableOpacity style={styles.primaryButtonWide} activeOpacity={0.85}>
        <Text style={styles.primaryButtonIcon}>+</Text>
        <Text style={styles.primaryButtonText}>Chọn ảnh từ thư viện</Text>
      </TouchableOpacity>

      <View style={styles.noteBox}>
        <Text style={styles.noteText}>
          Mốc này mới dựng giao diện nền. Tính năng chọn ảnh thật sẽ được thêm ở mốc 6.2.
        </Text>
      </View>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.pageTitle}>Cài đặt</Text>
      <Text style={styles.pageDescription}>
        Các lựa chọn mặc định cho bản MVP, tối ưu cho người dùng mới.
      </Text>

      <SettingRow label="Tên app" value="TinPDF" />
      <SettingRow label="Khổ giấy mặc định" value="A4" />
      <SettingRow label="Hướng giấy" value="Dọc" />
      <SettingRow label="Margin" value="Nhỏ" />
      <SettingRow label="Xử lý file" value="Offline trên máy" />
      <SettingRow label="Phiên bản" value="0.1.0" />
    </View>
  );
}

function Shortcut({
  title,
  tone,
  disabled,
  onPress,
}: {
  title: string;
  tone: string;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.shortcutCard, disabled && styles.disabledCard]}
      activeOpacity={disabled ? 1 : 0.85}
      onPress={disabled ? undefined : onPress}
    >
      <View style={[styles.shortcutMark, { backgroundColor: tone }]} />
      <Text style={styles.shortcutTitle}>{title}</Text>
      {disabled && <Text style={styles.shortcutMeta}>Sau</Text>}
    </TouchableOpacity>
  );
}

function Step({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNumber}>
        <Text style={styles.stepNumberText}>{number}</Text>
      </View>
      <View style={styles.stepCopy}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Text style={styles.settingValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f2f4f8',
    paddingTop: androidStatusBarHeight,
  },
  appShell: {
    flex: 1,
    backgroundColor: '#f2f4f8',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f2f4f8',
  },
  logo: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#6b7280',
    fontSize: 14,
    marginTop: 2,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ffffff',
    borderColor: '#d8dee9',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#dc2626',
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  screen: {
    gap: 16,
  },
  searchBox: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#d8dee9',
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  searchText: {
    color: '#9ca3af',
    fontSize: 16,
  },
  primaryPanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#e1e6ef',
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  primaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryIconText: {
    color: '#b91c1c',
    fontSize: 16,
    fontWeight: '900',
  },
  primaryCopy: {
    gap: 5,
  },
  sectionEyebrow: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  primaryTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
  },
  primaryDescription: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 22,
  },
  primaryButton: {
    height: 48,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonWide: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonIcon: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '700',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '800',
  },
  sectionAction: {
    color: '#dc2626',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e6ef',
    borderStyle: 'dashed',
    backgroundColor: '#ffffff',
    padding: 18,
    gap: 7,
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 17,
    fontWeight: '800',
  },
  emptyDescription: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 21,
  },
  shortcutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  shortcutCard: {
    width: '47.8%',
    minHeight: 86,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e6ef',
    padding: 14,
    justifyContent: 'space-between',
  },
  disabledCard: {
    opacity: 0.62,
  },
  shortcutMark: {
    width: 22,
    height: 6,
    borderRadius: 3,
  },
  shortcutTitle: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '800',
    lineHeight: 20,
  },
  shortcutMeta: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '700',
  },
  pageTitle: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '900',
  },
  pageDescription: {
    color: '#5b6472',
    fontSize: 15,
    lineHeight: 22,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolCard: {
    width: '30.9%',
    minHeight: 142,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#e1e6ef',
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  toolIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  toolTitle: {
    color: '#111827',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  toolSubtitle: {
    color: '#6b7280',
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
  },
  soonBadge: {
    color: '#9a3412',
    backgroundColor: '#ffedd5',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 10,
    fontWeight: '800',
    overflow: 'hidden',
  },
  filePanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#e1e6ef',
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  filePanelIcon: {
    color: '#dc2626',
    fontSize: 44,
    fontWeight: '600',
  },
  workflowPanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#e1e6ef',
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fee2e2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '900',
  },
  stepCopy: {
    flex: 1,
    gap: 3,
  },
  stepTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '800',
  },
  stepDetail: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 19,
  },
  noteBox: {
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    padding: 14,
  },
  noteText: {
    color: '#1e3a8a',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  settingRow: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#e1e6ef',
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingLabel: {
    color: '#111827',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  settingValue: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flexShrink: 1,
  },
  tabBar: {
    minHeight: 84 + bottomSystemGap,
    paddingTop: 10,
    paddingBottom: bottomSystemGap,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
    borderTopColor: '#d8dee9',
    borderTopWidth: 1,
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
  },
  tabIcon: {
    color: '#9ca3af',
    fontSize: 20,
    fontWeight: '900',
  },
  tabIconActive: {
    color: '#dc2626',
  },
  tabLabel: {
    color: '#8a93a3',
    fontSize: 11,
    fontWeight: '700',
  },
  tabLabelActive: {
    color: '#dc2626',
  },
});
