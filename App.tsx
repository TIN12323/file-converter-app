import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import {
  Alert,
  Image,
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
type ToolStatus = 'ready' | 'soon';

type TabItem = {
  key: TabKey;
  label: string;
  mark: string;
};

type Tool = {
  title: string;
  subtitle: string;
  mark: string;
  accent: string;
  status: ToolStatus;
};

type SelectedImage = {
  id: string;
  uri: string;
  width: number;
  height: number;
  fileName?: string | null;
};

const tabs: TabItem[] = [
  { key: 'home', label: 'Trang chủ', mark: 'H' },
  { key: 'tools', label: 'Công cụ', mark: 'T' },
  { key: 'files', label: 'Tệp', mark: 'F' },
  { key: 'scan', label: 'Quét', mark: '+' },
  { key: 'settings', label: 'Cài đặt', mark: 'S' },
];

const tools: Tool[] = [
  {
    title: 'Ảnh sang PDF',
    subtitle: 'Tạo PDF từ nhiều ảnh',
    mark: 'IMG',
    accent: '#e11d48',
    status: 'ready',
  },
  {
    title: 'PDF sang ảnh',
    subtitle: 'Xuất từng trang thành ảnh',
    mark: 'JPG',
    accent: '#2563eb',
    status: 'soon',
  },
  {
    title: 'Nén PDF',
    subtitle: 'Giảm dung lượng file',
    mark: 'ZIP',
    accent: '#059669',
    status: 'soon',
  },
  {
    title: 'Nối PDF',
    subtitle: 'Gộp nhiều file PDF',
    mark: 'ADD',
    accent: '#7c3aed',
    status: 'soon',
  },
  {
    title: 'Tách PDF',
    subtitle: 'Lấy trang cần dùng',
    mark: 'CUT',
    accent: '#ea580c',
    status: 'soon',
  },
  {
    title: 'Xoay PDF',
    subtitle: 'Chỉnh hướng trang',
    mark: '90',
    accent: '#0891b2',
    status: 'soon',
  },
];

const recentPlaceholders = [
  { title: 'Chưa có PDF', meta: 'File đã tạo sẽ xuất hiện tại đây' },
  { title: 'A4 dọc', meta: 'Thiết lập mặc định' },
];

const androidStatusBarHeight =
  Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0;
const bottomSystemGap = Platform.OS === 'android' ? 24 : 10;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);

  const screenTitle = useMemo(() => {
    return tabs.find((tab) => tab.key === activeTab)?.label ?? 'Trang chủ';
  }, [activeTab]);

  const pickImages = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Cần quyền truy cập ảnh',
        'TinPDF cần quyền mở thư viện ảnh để bạn chọn ảnh tạo PDF.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      orderedSelection: true,
      quality: 0.92,
      selectionLimit: 20,
    });

    if (result.canceled) {
      return;
    }

    const images = result.assets.map((asset, index) => ({
      id: `${asset.assetId ?? asset.uri}-${Date.now()}-${index}`,
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName,
    }));

    setSelectedImages(images);
    setActiveTab('scan');
  };

  const removeSelectedImage = (imageId: string) => {
    setSelectedImages((currentImages) =>
      currentImages.filter((image) => image.id !== imageId),
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" backgroundColor="#f7f3ef" />
      <View style={styles.appShell}>
        <View style={styles.header}>
          <View style={styles.brandGroup}>
            <View style={styles.brandMark}>
              <Text style={styles.brandMarkText}>TP</Text>
            </View>
            <View>
              <Text style={styles.logo}>TinPDF</Text>
              <Text style={styles.headerSubtitle}>{screenTitle}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.profileButton} activeOpacity={0.82}>
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
          {activeTab === 'scan' && (
            <ScanScreen
              images={selectedImages}
              onPickImages={pickImages}
              onRemoveImage={removeSelectedImage}
              onClearImages={() => setSelectedImages([])}
            />
          )}
          {activeTab === 'settings' && <SettingsScreen />}
        </ScrollView>

        <View style={styles.tabWrap}>
          <View style={styles.tabBar}>
            {tabs.map((tab) => {
              const isActive = tab.key === activeTab;

              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tabItem}
                  activeOpacity={0.82}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <View style={[styles.tabMark, isActive && styles.tabMarkActive]}>
                    <Text style={[styles.tabMarkText, isActive && styles.tabMarkTextActive]}>
                      {tab.mark}
                    </Text>
                  </View>
                  <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function HomeScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopLine}>
          <Text style={styles.heroKicker}>PDF Studio</Text>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>Offline</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>Biến ảnh thành PDF chỉ trong vài chạm</Text>
        <Text style={styles.heroText}>
          Tạo file gọn, đẹp và sẵn sàng chia sẻ cho học tập, công việc hoặc giấy tờ cá nhân.
        </Text>

        <TouchableOpacity style={styles.heroButton} activeOpacity={0.88} onPress={onStart}>
          <Text style={styles.heroButtonMark}>+</Text>
          <Text style={styles.heroButtonText}>Tạo PDF mới</Text>
        </TouchableOpacity>

        <View style={styles.heroDecorOne} />
        <View style={styles.heroDecorTwo} />
      </View>

      <View style={styles.metricRow}>
        <Metric label="File đã tạo" value="0" />
        <Metric label="Mặc định" value="A4" />
        <Metric label="Bảo mật" value="Local" />
      </View>

      <SectionHeader title="Tác vụ nhanh" action="Tất cả" />
      <View style={styles.quickGrid}>
        <QuickAction title="Ảnh sang PDF" mark="IMG" tone="#e11d48" onPress={onStart} />
        <QuickAction title="PDF sang ảnh" mark="JPG" tone="#2563eb" disabled />
        <QuickAction title="Nén PDF" mark="ZIP" tone="#059669" disabled />
        <QuickAction title="Nối PDF" mark="ADD" tone="#7c3aed" disabled />
      </View>

      <SectionHeader title="Tệp gần đây" action="Xem tất cả" />
      <View style={styles.recentList}>
        {recentPlaceholders.map((item) => (
          <View key={item.title} style={styles.recentItem}>
            <View style={styles.recentThumb}>
              <Text style={styles.recentThumbText}>PDF</Text>
            </View>
            <View style={styles.recentCopy}>
              <Text style={styles.recentTitle}>{item.title}</Text>
              <Text style={styles.recentMeta}>{item.meta}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function ToolsScreen({ onStart }: { onStart: () => void }) {
  return (
    <View style={styles.screen}>
      <PageIntro
        eyebrow="Bộ công cụ"
        title="Tập trung vào những thao tác PDF hay dùng nhất"
        description="TinPDF mở từng công cụ theo từng mốc để app luôn nhẹ, dễ dùng và ổn định."
      />

      <View style={styles.toolsGrid}>
        {tools.map((tool) => (
          <TouchableOpacity
            key={tool.title}
            style={styles.toolCard}
            activeOpacity={tool.status === 'ready' ? 0.86 : 1}
            onPress={tool.status === 'ready' ? onStart : undefined}
          >
            <View style={[styles.toolIcon, { backgroundColor: tool.accent }]}>
              <Text style={styles.toolIconText}>{tool.mark}</Text>
            </View>
            <Text style={styles.toolTitle}>{tool.title}</Text>
            <Text style={styles.toolSubtitle}>{tool.subtitle}</Text>
            {tool.status === 'soon' && (
              <View style={styles.soonBadge}>
                <Text style={styles.soonBadgeText}>Sắp có</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function FilesScreen() {
  return (
    <View style={styles.screen}>
      <PageIntro
        eyebrow="Kho file"
        title="Quản lý PDF đã tạo"
        description="Các file hoàn thành sẽ được gom lại để mở, chia sẻ hoặc xóa khỏi lịch sử."
      />

      <View style={styles.emptyPanel}>
        <View style={styles.emptyIcon}>
          <Text style={styles.emptyIconText}>PDF</Text>
        </View>
        <Text style={styles.emptyTitle}>Chưa có file nào</Text>
        <Text style={styles.emptyDescription}>
          Tệp đầu tiên sẽ xuất hiện ngay sau khi bạn tạo PDF từ ảnh.
        </Text>
      </View>
    </View>
  );
}

function ScanScreen({
  images,
  onPickImages,
  onRemoveImage,
  onClearImages,
}: {
  images: SelectedImage[];
  onPickImages: () => void;
  onRemoveImage: (imageId: string) => void;
  onClearImages: () => void;
}) {
  const hasImages = images.length > 0;

  return (
    <View style={styles.screen}>
      <PageIntro
        eyebrow="Quét"
        title="Tạo PDF từ ảnh"
        description="Luồng chính của TinPDF: chọn ảnh, kiểm tra thứ tự, đặt tên và xuất PDF."
      />

      <View style={styles.scanCard}>
        <View style={styles.scanVisual}>
          <View style={styles.scanSheetBack} />
          <View style={styles.scanSheetFront}>
            <Text style={styles.scanSheetTitle}>A4</Text>
            <View style={styles.scanLineLong} />
            <View style={styles.scanLine} />
            <View style={styles.scanLineShort} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.primaryButtonWide}
          activeOpacity={0.88}
          onPress={onPickImages}
        >
          <Text style={styles.heroButtonMark}>+</Text>
          <Text style={styles.primaryButtonText}>
            {hasImages ? 'Chọn lại ảnh' : 'Chọn ảnh từ thư viện'}
          </Text>
        </TouchableOpacity>
      </View>

      {hasImages && (
        <View style={styles.selectedPanel}>
          <View style={styles.selectedHeader}>
            <View>
              <Text style={styles.selectedTitle}>Ảnh đã chọn</Text>
              <Text style={styles.selectedMeta}>
                {images.length} ảnh sẵn sàng cho bước tạo PDF
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.82} onPress={onClearImages}>
              <Text style={styles.clearAction}>Xóa hết</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageGrid}>
            {images.map((image, index) => (
              <View key={image.id} style={styles.imageTile}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <View style={styles.imageIndex}>
                  <Text style={styles.imageIndexText}>{index + 1}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  activeOpacity={0.82}
                  onPress={() => onRemoveImage(image.id)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.workflowPanel}>
        <Step number="1" title="Chọn ảnh" detail="Lấy một hoặc nhiều ảnh từ thư viện." />
        <Step number="2" title="Kiểm tra" detail="Xem lại ảnh trước khi tạo file." />
        <Step number="3" title="Xuất PDF" detail="Tạo file A4 dọc và lưu vào lịch sử." />
      </View>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <PageIntro
        eyebrow="Thiết lập"
        title="Cấu hình mặc định"
        description="Các lựa chọn này giúp bản đầu hoạt động nhất quán và dễ hiểu."
      />

      <View style={styles.settingsList}>
        <SettingRow label="Tên app" value="TinPDF" />
        <SettingRow label="Khổ giấy" value="A4" />
        <SettingRow label="Hướng giấy" value="Dọc" />
        <SettingRow label="Margin" value="Nhỏ" />
        <SettingRow label="Xử lý file" value="Offline" />
        <SettingRow label="Phiên bản" value="0.1.0" />
      </View>
    </View>
  );
}

function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.pageIntro}>
      <Text style={styles.pageEyebrow}>{eyebrow}</Text>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.pageDescription}>{description}</Text>
    </View>
  );
}

function SectionHeader({ title, action }: { title: string; action: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionAction}>{action}</Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({
  title,
  mark,
  tone,
  disabled,
  onPress,
}: {
  title: string;
  mark: string;
  tone: string;
  disabled?: boolean;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickCard, disabled && styles.disabledCard]}
      activeOpacity={disabled ? 1 : 0.86}
      onPress={disabled ? undefined : onPress}
    >
      <View style={[styles.quickMark, { backgroundColor: tone }]}>
        <Text style={styles.quickMarkText}>{mark}</Text>
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      {disabled && <Text style={styles.quickMeta}>Sau</Text>}
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
    backgroundColor: '#f7f3ef',
    paddingTop: androidStatusBarHeight,
  },
  appShell: {
    flex: 1,
    backgroundColor: '#f7f3ef',
  },
  header: {
    paddingHorizontal: 22,
    paddingBottom: 14,
    paddingTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandMark: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#10131c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10131c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  brandMarkText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  logo: {
    color: '#10131c',
    fontSize: 27,
    fontWeight: '900',
  },
  headerSubtitle: {
    color: '#7d746f',
    fontSize: 13,
    marginTop: 1,
    fontWeight: '700',
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#eadfd8',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6b5f5a',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 9,
    elevation: 3,
  },
  profileInitial: {
    color: '#e11d48',
    fontSize: 18,
    fontWeight: '900',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 26,
  },
  screen: {
    gap: 18,
  },
  heroCard: {
    minHeight: 272,
    borderRadius: 8,
    backgroundColor: '#10131c',
    padding: 22,
    overflow: 'hidden',
    shadowColor: '#10131c',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    elevation: 7,
  },
  heroTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroKicker: {
    color: '#f9fafb',
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  heroBadge: {
    borderRadius: 8,
    backgroundColor: '#1f2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '900',
  },
  heroTitle: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '900',
    maxWidth: '88%',
  },
  heroText: {
    color: '#d6d3d1',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
    maxWidth: '88%',
  },
  heroButton: {
    height: 52,
    borderRadius: 8,
    backgroundColor: '#e11d48',
    marginTop: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  heroButtonMark: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  heroButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  heroDecorOne: {
    position: 'absolute',
    right: -22,
    top: 74,
    width: 92,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#fbbf24',
    opacity: 0.16,
    transform: [{ rotate: '14deg' }],
  },
  heroDecorTwo: {
    position: 'absolute',
    right: 24,
    bottom: -18,
    width: 76,
    height: 76,
    borderRadius: 8,
    backgroundColor: '#14b8a6',
    opacity: 0.18,
    transform: [{ rotate: '-10deg' }],
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#eadfd8',
    borderWidth: 1,
    padding: 14,
  },
  metricValue: {
    color: '#10131c',
    fontSize: 19,
    fontWeight: '900',
  },
  metricLabel: {
    color: '#7d746f',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#10131c',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionAction: {
    color: '#e11d48',
    fontSize: 13,
    fontWeight: '900',
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickCard: {
    width: '48.1%',
    minHeight: 118,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eadfd8',
    padding: 14,
    justifyContent: 'space-between',
    shadowColor: '#6b5f5a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  disabledCard: {
    opacity: 0.58,
  },
  quickMark: {
    width: 44,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickMarkText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  quickTitle: {
    color: '#10131c',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
  },
  quickMeta: {
    color: '#9a8f89',
    fontSize: 12,
    fontWeight: '800',
  },
  recentList: {
    gap: 10,
  },
  recentItem: {
    minHeight: 82,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eadfd8',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  recentThumb: {
    width: 48,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentThumbText: {
    color: '#be123c',
    fontSize: 12,
    fontWeight: '900',
  },
  recentCopy: {
    flex: 1,
    gap: 4,
  },
  recentTitle: {
    color: '#10131c',
    fontSize: 16,
    fontWeight: '900',
  },
  recentMeta: {
    color: '#7d746f',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  pageIntro: {
    gap: 8,
  },
  pageEyebrow: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pageTitle: {
    color: '#10131c',
    fontSize: 27,
    lineHeight: 33,
    fontWeight: '900',
  },
  pageDescription: {
    color: '#6f6762',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolCard: {
    width: '48.1%',
    minHeight: 160,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#eadfd8',
    borderWidth: 1,
    padding: 14,
    gap: 9,
    shadowColor: '#6b5f5a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  toolIcon: {
    width: 48,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolIconText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  toolTitle: {
    color: '#10131c',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '900',
  },
  toolSubtitle: {
    color: '#7d746f',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  soonBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  soonBadgeText: {
    color: '#9a3412',
    fontSize: 11,
    fontWeight: '900',
  },
  emptyPanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#eadfd8',
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyIcon: {
    width: 74,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconText: {
    color: '#be123c',
    fontSize: 16,
    fontWeight: '900',
  },
  emptyTitle: {
    color: '#10131c',
    fontSize: 18,
    fontWeight: '900',
  },
  emptyDescription: {
    color: '#7d746f',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    fontWeight: '600',
  },
  scanCard: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#eadfd8',
    borderWidth: 1,
    padding: 18,
    gap: 18,
    shadowColor: '#6b5f5a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  scanVisual: {
    minHeight: 170,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  scanSheetBack: {
    position: 'absolute',
    width: 112,
    height: 138,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    transform: [{ rotate: '-8deg' }],
  },
  scanSheetFront: {
    width: 118,
    height: 144,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    padding: 16,
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#10131c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  scanSheetTitle: {
    color: '#e11d48',
    fontSize: 20,
    fontWeight: '900',
  },
  scanLineLong: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#cbd5e1',
    width: '100%',
  },
  scanLine: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    width: '78%',
  },
  scanLineShort: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    width: '54%',
  },
  primaryButtonWide: {
    height: 54,
    borderRadius: 8,
    backgroundColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  selectedPanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#eadfd8',
    borderWidth: 1,
    padding: 14,
    gap: 14,
    shadowColor: '#6b5f5a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectedTitle: {
    color: '#10131c',
    fontSize: 18,
    fontWeight: '900',
  },
  selectedMeta: {
    color: '#7d746f',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
    fontWeight: '700',
  },
  clearAction: {
    color: '#e11d48',
    fontSize: 13,
    fontWeight: '900',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageTile: {
    width: '31.3%',
    aspectRatio: 0.76,
    borderRadius: 8,
    backgroundColor: '#f4eee9',
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageIndex: {
    position: 'absolute',
    left: 6,
    top: 6,
    minWidth: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#10131c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  imageIndexText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  removeImageButton: {
    position: 'absolute',
    right: 6,
    top: 6,
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#ffffff',
    fontSize: 18,
    lineHeight: 20,
    fontWeight: '900',
  },
  workflowPanel: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#eadfd8',
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#10131c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  stepCopy: {
    flex: 1,
    gap: 3,
  },
  stepTitle: {
    color: '#10131c',
    fontSize: 16,
    fontWeight: '900',
  },
  stepDetail: {
    color: '#7d746f',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  settingsList: {
    gap: 10,
  },
  settingRow: {
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#eadfd8',
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  settingLabel: {
    color: '#10131c',
    fontSize: 15,
    fontWeight: '800',
    flex: 1,
  },
  settingValue: {
    color: '#7d746f',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    flexShrink: 1,
  },
  tabWrap: {
    paddingHorizontal: 14,
    paddingBottom: bottomSystemGap,
    paddingTop: 8,
    backgroundColor: '#f7f3ef',
  },
  tabBar: {
    minHeight: 70,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#eadfd8',
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 6,
    paddingVertical: 7,
    shadowColor: '#6b5f5a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabMark: {
    width: 31,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f4eee9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabMarkActive: {
    backgroundColor: '#e11d48',
  },
  tabMarkText: {
    color: '#8b817a',
    fontSize: 12,
    fontWeight: '900',
  },
  tabMarkTextActive: {
    color: '#ffffff',
  },
  tabLabel: {
    color: '#8b817a',
    fontSize: 10,
    fontWeight: '800',
  },
  tabLabelActive: {
    color: '#e11d48',
  },
});
