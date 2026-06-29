import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  StatusBar as NativeStatusBar,
  Text,
  TextInput,
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
  mimeType?: string | null;
};

type CreatedFile = {
  id: string;
  name: string;
  uri: string;
  pageCount?: number;
  createdAt: string;
};

type PdfImage = {
  dataUri: string;
  alt: string;
};

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const MAX_IMAGES = 20;
const ANDROID_GRANT_READ_URI_PERMISSION = 1;

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
  { title: 'A4 dọc', meta: 'Thiết lập mặc định cho file mới' },
];

const androidStatusBarHeight =
  Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0;
const bottomSystemGap = Platform.OS === 'android' ? 24 : 10;

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [createdFiles, setCreatedFiles] = useState<CreatedFile[]>([]);
  const [pdfName, setPdfName] = useState('');
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadStoredPdfs()
      .then((files) => {
        if (isMounted) {
          setCreatedFiles(files);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  const screenTitle = useMemo(() => {
    return tabs.find((tab) => tab.key === activeTab)?.label ?? 'Trang chủ';
  }, [activeTab]);

  const pickImages = async (mode: 'replace' | 'append' = 'replace') => {
    const currentCount = mode === 'append' ? selectedImages.length : 0;
    const remainingSlots = MAX_IMAGES - currentCount;

    if (remainingSlots <= 0) {
      Alert.alert('Đã đủ trang', `Mỗi PDF hỗ trợ tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Cần quyền truy cập ảnh',
        'TinPDF cần quyền mở thư viện ảnh để bạn chọn ảnh tạo PDF.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      orderedSelection: true,
      quality: 0.92,
      selectionLimit: remainingSlots,
    });

    if (result.canceled) {
      return;
    }

    const images = createSelectedImages(result.assets);

    setSelectedImages((currentImages) =>
      mode === 'append' ? [...currentImages, ...images].slice(0, MAX_IMAGES) : images,
    );
    setActiveTab('scan');
  };

  const captureImage = async () => {
    if (selectedImages.length >= MAX_IMAGES) {
      Alert.alert('Đã đủ trang', `Mỗi PDF hỗ trợ tối đa ${MAX_IMAGES} ảnh.`);
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Cần quyền camera',
        'TinPDF cần quyền mở camera để bạn chụp giấy tờ tạo PDF.',
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.92,
    });

    if (result.canceled) {
      return;
    }

    const images = createSelectedImages(result.assets);

    setSelectedImages((currentImages) =>
      [...currentImages, ...images].slice(0, MAX_IMAGES),
    );
    setActiveTab('scan');

    Alert.alert('Đã thêm trang', 'Ảnh vừa chụp đã được thêm vào PDF nháp.', [
      { text: 'Xong', style: 'cancel' },
      {
        text: 'Chụp tiếp',
        onPress: () => {
          void captureImage();
        },
      },
    ]);
  };

  const moveSelectedImage = (imageId: string, direction: -1 | 1) => {
    setSelectedImages((currentImages) => {
      const currentIndex = currentImages.findIndex((image) => image.id === imageId);
      const nextIndex = currentIndex + direction;

      if (
        currentIndex === -1 ||
        nextIndex < 0 ||
        nextIndex >= currentImages.length
      ) {
        return currentImages;
      }

      const reorderedImages = [...currentImages];
      const movingImage = reorderedImages[currentIndex];
      reorderedImages[currentIndex] = reorderedImages[nextIndex];
      reorderedImages[nextIndex] = movingImage;

      return reorderedImages;
    });
  };

  const removeSelectedImage = (imageId: string) => {
    setSelectedImages((currentImages) =>
      currentImages.filter((image) => image.id !== imageId),
    );
  };

  const sharePdf = async (file: CreatedFile) => {
    try {
      const canShare = await Sharing.isAvailableAsync();

      if (!canShare) {
        Alert.alert('Không hỗ trợ chia sẻ', `File đã được tạo tại:\n${file.uri}`);
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/pdf',
        dialogTitle: file.name,
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      Alert.alert('Chưa chia sẻ được', getErrorMessage(error));
    }
  };

  const openPdf = async (file: CreatedFile) => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(file.uri);

      if (!fileInfo.exists) {
        Alert.alert('Không tìm thấy PDF', 'File này có thể đã bị xóa khỏi bộ nhớ app.');
        setCreatedFiles((currentFiles) =>
          currentFiles.filter((currentFile) => currentFile.uri !== file.uri),
        );
        return;
      }

      if (Platform.OS === 'android') {
        const contentUri = await FileSystem.getContentUriAsync(file.uri);

        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          type: 'application/pdf',
          flags: ANDROID_GRANT_READ_URI_PERMISSION,
        });
        return;
      }

      await Linking.openURL(file.uri);
    } catch (error) {
      Alert.alert(
        'Chưa mở được PDF',
        `${getErrorMessage(error)}\n\nBạn có thể dùng nút Chia sẻ để mở bằng Drive, Gmail hoặc app đọc PDF khác.`,
        [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Chia sẻ', onPress: () => sharePdf(file) },
        ],
      );
    }
  };

  const deletePdf = (file: CreatedFile) => {
    Alert.alert('Xóa PDF?', `File ${file.name} sẽ bị xóa khỏi kho TinPDF.`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await FileSystem.deleteAsync(file.uri, { idempotent: true });
            setCreatedFiles((currentFiles) =>
              currentFiles.filter((currentFile) => currentFile.uri !== file.uri),
            );
          } catch (error) {
            Alert.alert('Chưa xóa được PDF', getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const createPdf = async () => {
    if (selectedImages.length === 0 || isCreatingPdf) {
      return;
    }

    setIsCreatingPdf(true);

    try {
      const file = await createPdfFromImages(selectedImages, pdfName);

      setCreatedFiles((currentFiles) => [file, ...currentFiles]);
      setActiveTab('files');

      Alert.alert('Đã tạo PDF', `${file.name}\n${formatPageCount(file)}`, [
        { text: 'Đóng', style: 'cancel' },
        { text: 'Xem', onPress: () => openPdf(file) },
        { text: 'Chia sẻ', onPress: () => sharePdf(file) },
      ]);
    } catch (error) {
      Alert.alert('Không tạo được PDF', getErrorMessage(error));
    } finally {
      setIsCreatingPdf(false);
    }
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
          {activeTab === 'home' && (
            <HomeScreen
              files={createdFiles}
              onStart={() => setActiveTab('scan')}
              onOpenFile={openPdf}
              onShareFile={sharePdf}
            />
          )}
          {activeTab === 'tools' && <ToolsScreen onStart={() => setActiveTab('scan')} />}
          {activeTab === 'files' && (
            <FilesScreen
              files={createdFiles}
              onNewFile={() => setActiveTab('scan')}
              onDeleteFile={deletePdf}
              onOpenFile={openPdf}
              onShareFile={sharePdf}
            />
          )}
          {activeTab === 'scan' && (
            <ScanScreen
              images={selectedImages}
              isCreatingPdf={isCreatingPdf}
              pdfName={pdfName}
              maxImages={MAX_IMAGES}
              onAppendImages={() => pickImages('append')}
              onCaptureImage={captureImage}
              onCreatePdf={createPdf}
              onMoveImage={moveSelectedImage}
              onPdfNameChange={setPdfName}
              onPickImages={() => pickImages('replace')}
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

function HomeScreen({
  files,
  onStart,
  onOpenFile,
  onShareFile,
}: {
  files: CreatedFile[];
  onStart: () => void;
  onOpenFile: (file: CreatedFile) => void;
  onShareFile: (file: CreatedFile) => void;
}) {
  const latestFiles = files.slice(0, 2);

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
          Tạo file gọn, đẹp và sẵn sàng chia sẻ cho học tập, công việc hoặc giấy tờ cá
          nhân.
        </Text>

        <TouchableOpacity style={styles.heroButton} activeOpacity={0.88} onPress={onStart}>
          <Text style={styles.heroButtonMark}>+</Text>
          <Text style={styles.heroButtonText}>Tạo PDF mới</Text>
        </TouchableOpacity>

        <View style={styles.heroDecorOne} />
        <View style={styles.heroDecorTwo} />
      </View>

      <View style={styles.metricRow}>
        <Metric label="File đã tạo" value={`${files.length}`} />
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
        {latestFiles.length > 0
          ? latestFiles.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                compact
                onOpen={() => onOpenFile(file)}
                onShare={() => onShareFile(file)}
              />
            ))
          : recentPlaceholders.map((item) => (
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

function FilesScreen({
  files,
  onNewFile,
  onDeleteFile,
  onOpenFile,
  onShareFile,
}: {
  files: CreatedFile[];
  onNewFile: () => void;
  onDeleteFile: (file: CreatedFile) => void;
  onOpenFile: (file: CreatedFile) => void;
  onShareFile: (file: CreatedFile) => void;
}) {
  return (
    <View style={styles.screen}>
      <PageIntro
        eyebrow="Kho file"
        title="Quản lý PDF đã tạo"
        description="Các file hoàn thành được gom lại để mở chia sẻ nhanh sau khi xuất từ ảnh."
      />

      {files.length === 0 ? (
        <View style={styles.emptyPanel}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>PDF</Text>
          </View>
          <Text style={styles.emptyTitle}>Chưa có file nào</Text>
          <Text style={styles.emptyDescription}>
            Tệp đầu tiên sẽ xuất hiện ngay sau khi bạn tạo PDF từ ảnh.
          </Text>
          <TouchableOpacity style={styles.emptyButton} activeOpacity={0.86} onPress={onNewFile}>
            <Text style={styles.emptyButtonText}>Tạo PDF mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.fileList}>
          {files.map((file) => (
            <FileRow
              key={file.id}
              file={file}
              onDelete={() => onDeleteFile(file)}
              onOpen={() => onOpenFile(file)}
              onShare={() => onShareFile(file)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function ScanScreen({
  images,
  isCreatingPdf,
  maxImages,
  pdfName,
  onAppendImages,
  onCaptureImage,
  onCreatePdf,
  onMoveImage,
  onPdfNameChange,
  onPickImages,
  onRemoveImage,
  onClearImages,
}: {
  images: SelectedImage[];
  isCreatingPdf: boolean;
  maxImages: number;
  pdfName: string;
  onAppendImages: () => void;
  onCaptureImage: () => void;
  onCreatePdf: () => void;
  onMoveImage: (imageId: string, direction: -1 | 1) => void;
  onPdfNameChange: (value: string) => void;
  onPickImages: () => void;
  onRemoveImage: (imageId: string) => void;
  onClearImages: () => void;
}) {
  const [previewImageId, setPreviewImageId] = useState<string | null>(null);
  const hasImages = images.length > 0;
  const previewImage = useMemo(
    () => images.find((image) => image.id === previewImageId) ?? null,
    [images, previewImageId],
  );
  const previewIndex = previewImage
    ? images.findIndex((image) => image.id === previewImage.id)
    : -1;

  return (
    <View style={styles.screen}>
      <PageIntro
        eyebrow="Quét"
        title="Tạo PDF từ ảnh"
        description="Chọn ảnh từ thư viện hoặc chụp giấy tờ, kiểm tra thứ tự rồi tạo file A4."
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

        <View style={styles.scanStatsRow}>
          <ScanStat label="Trang" value={`${images.length}/${maxImages}`} />
          <ScanStat label="Khổ giấy" value="A4" />
          <ScanStat label="Xử lý" value="Offline" />
        </View>

        <TouchableOpacity
          style={[styles.directScanButton, isCreatingPdf && styles.disabledButton]}
          activeOpacity={0.88}
          disabled={isCreatingPdf}
          onPress={onCaptureImage}
        >
          <View style={styles.directScanMark}>
            <Text style={styles.directScanMarkText}>CAM</Text>
          </View>
          <View style={styles.directScanCopy}>
            <Text style={styles.directScanTitle}>Quét / chụp trực tiếp</Text>
            <Text style={styles.directScanSubtitle}>Mở camera và thêm trang vào PDF</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.nameField}>
          <Text style={styles.fieldLabel}>Tên file</Text>
          <TextInput
            style={styles.nameInput}
            value={pdfName}
            editable={!isCreatingPdf}
            onChangeText={onPdfNameChange}
            placeholder={createDefaultPdfTitle()}
            placeholderTextColor="#a99f98"
            returnKeyType="done"
          />
        </View>

        <View style={styles.sourceGrid}>
          <SourceButton
            mark="IMG"
            title={hasImages ? 'Thêm từ thư viện' : 'Chọn từ thư viện'}
            subtitle={hasImages ? 'Nối vào PDF' : 'Chọn nhiều ảnh'}
            disabled={isCreatingPdf}
            onPress={hasImages ? onAppendImages : onPickImages}
          />
          {hasImages && (
            <SourceButton
              mark="NEW"
              title="Đổi bộ ảnh"
              subtitle="Chọn lại từ đầu"
              disabled={isCreatingPdf}
              onPress={onPickImages}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.createButton, (!hasImages || isCreatingPdf) && styles.disabledButton]}
          activeOpacity={0.88}
          disabled={!hasImages || isCreatingPdf}
          onPress={onCreatePdf}
        >
          {isCreatingPdf ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.createButtonMark}>PDF</Text>
          )}
          <Text style={styles.createButtonText}>
            {isCreatingPdf ? 'Đang tạo PDF' : 'Tạo PDF'}
          </Text>
        </TouchableOpacity>
      </View>

      {hasImages && (
        <View style={styles.selectedPanel}>
          <View style={styles.selectedHeader}>
            <View style={styles.selectedHeaderCopy}>
              <Text style={styles.selectedTitle}>Ảnh đã chọn</Text>
              <Text style={styles.selectedMeta}>
                {images.length} ảnh sẵn sàng cho bước tạo PDF
              </Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={onClearImages}
              disabled={isCreatingPdf}
            >
              <Text style={styles.clearAction}>Xóa hết</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imageGrid}>
            {images.map((image, index) => (
              <View key={image.id} style={styles.imageTile}>
                <TouchableOpacity
                  style={styles.imagePreviewButton}
                  activeOpacity={0.9}
                  onPress={() => setPreviewImageId(image.id)}
                >
                  <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                </TouchableOpacity>
                <View style={styles.imageIndex}>
                  <Text style={styles.imageIndexText}>{index + 1}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  activeOpacity={0.82}
                  disabled={isCreatingPdf}
                  onPress={() => onRemoveImage(image.id)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
                <View style={styles.reorderControls}>
                  <TouchableOpacity
                    style={[
                      styles.reorderButton,
                      (index === 0 || isCreatingPdf) && styles.reorderButtonDisabled,
                    ]}
                    activeOpacity={0.82}
                    disabled={index === 0 || isCreatingPdf}
                    onPress={() => onMoveImage(image.id, -1)}
                  >
                    <Text style={styles.reorderButtonText}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.reorderButton,
                      (index === images.length - 1 || isCreatingPdf) &&
                        styles.reorderButtonDisabled,
                    ]}
                    activeOpacity={0.82}
                    disabled={index === images.length - 1 || isCreatingPdf}
                    onPress={() => onMoveImage(image.id, 1)}
                  >
                    <Text style={styles.reorderButtonText}>↓</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.workflowPanel}>
        <Step number="1" title="Chụp hoặc chọn" detail="Lấy ảnh từ thư viện hoặc camera." />
        <Step number="2" title="Kiểm tra" detail="Xem ảnh lớn và chỉnh thứ tự trang." />
        <Step number="3" title="Xuất PDF" detail="Tạo file A4 dọc và lưu vào kho file." />
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={previewImage !== null}
        onRequestClose={() => setPreviewImageId(null)}
      >
        <View style={styles.previewBackdrop}>
          <View style={styles.previewSheet}>
            <View style={styles.previewHeader}>
              <View style={styles.previewTitleGroup}>
                <Text style={styles.previewTitle}>Trang {previewIndex + 1}</Text>
                <Text style={styles.previewMeta}>
                  {previewImage ? formatImageMeta(previewImage) : ''}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.previewCloseButton}
                activeOpacity={0.82}
                onPress={() => setPreviewImageId(null)}
              >
                <Text style={styles.previewCloseText}>×</Text>
              </TouchableOpacity>
            </View>

            {previewImage && (
              <Image source={{ uri: previewImage.uri }} style={styles.previewImage} />
            )}
          </View>
        </View>
      </Modal>
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
        <SettingRow label="Phiên bản" value="1.0.0" />
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

function SourceButton({
  mark,
  title,
  subtitle,
  disabled,
  onPress,
}: {
  mark: string;
  title: string;
  subtitle: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.sourceButton, disabled && styles.disabledButton]}
      activeOpacity={0.86}
      disabled={disabled}
      onPress={onPress}
    >
      <View style={styles.sourceMark}>
        <Text style={styles.sourceMarkText}>{mark}</Text>
      </View>
      <View style={styles.sourceCopy}>
        <Text style={styles.sourceTitle}>{title}</Text>
        <Text style={styles.sourceSubtitle}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

function ScanStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.scanStat}>
      <Text style={styles.scanStatValue}>{value}</Text>
      <Text style={styles.scanStatLabel}>{label}</Text>
    </View>
  );
}

function FileRow({
  file,
  compact,
  onDelete,
  onOpen,
  onShare,
}: {
  file: CreatedFile;
  compact?: boolean;
  onDelete?: () => void;
  onOpen: () => void;
  onShare: () => void;
}) {
  return (
    <View style={[styles.fileItem, compact && styles.fileItemCompact]}>
      <View style={styles.fileThumb}>
        <Text style={styles.fileThumbText}>PDF</Text>
      </View>
      <View style={styles.fileCopy}>
        <Text style={styles.fileTitle} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={styles.fileMeta}>
          {formatPageCount(file)} · {formatDateTime(file.createdAt)}
        </Text>
      </View>
      <View style={styles.fileActions}>
        <TouchableOpacity
          style={[styles.fileActionButton, styles.openButton]}
          activeOpacity={0.82}
          onPress={onOpen}
        >
          <Text style={styles.fileActionText}>Xem</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fileActionButton, styles.shareButton]}
          activeOpacity={0.82}
          onPress={onShare}
        >
          <Text style={styles.fileActionText}>Chia sẻ</Text>
        </TouchableOpacity>
        {!compact && onDelete && (
          <TouchableOpacity
            style={[styles.fileActionButton, styles.deleteButton]}
            activeOpacity={0.82}
            onPress={onDelete}
          >
            <Text style={[styles.fileActionText, styles.deleteButtonText]}>Xóa</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
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

function createSelectedImages(assets: ImagePicker.ImagePickerAsset[]): SelectedImage[] {
  const seed = Date.now();

  return assets.map((asset, index) => ({
    id: `${asset.assetId ?? asset.uri}-${seed}-${index}`,
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    fileName: asset.fileName,
    mimeType: asset.mimeType,
  }));
}

async function createPdfFromImages(
  images: SelectedImage[],
  requestedTitle: string,
): Promise<CreatedFile> {
  if (!FileSystem.documentDirectory) {
    throw new Error('Thiết bị không có thư mục lưu tài liệu cho app.');
  }

  const pdfImages = await Promise.all(
    images.map(async (image, index) => {
      const base64 = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const mimeType = image.mimeType ?? guessMimeType(image.fileName ?? image.uri);

      return {
        dataUri: `data:${mimeType};base64,${base64}`,
        alt: image.fileName ?? `Trang ${index + 1}`,
      };
    }),
  );

  const html = buildPdfHtml(pdfImages);
  const printedFile = await Print.printToFileAsync({
    html,
    width: A4_WIDTH,
    height: A4_HEIGHT,
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
  });

  const directoryUri = `${FileSystem.documentDirectory}TinPDF/`;
  await FileSystem.makeDirectoryAsync(directoryUri, { intermediates: true });

  const target = await getAvailablePdfTarget(
    directoryUri,
    createPdfFileName(requestedTitle),
  );

  await FileSystem.copyAsync({
    from: printedFile.uri,
    to: target.uri,
  });

  return {
    id: `${target.uri}-${Date.now()}`,
    name: target.fileName,
    uri: target.uri,
    pageCount: images.length,
    createdAt: new Date().toISOString(),
  };
}

async function loadStoredPdfs(): Promise<CreatedFile[]> {
  if (!FileSystem.documentDirectory) {
    return [];
  }

  const directoryUri = `${FileSystem.documentDirectory}TinPDF/`;
  const directoryInfo = await FileSystem.getInfoAsync(directoryUri);

  if (!directoryInfo.exists || !directoryInfo.isDirectory) {
    return [];
  }

  const names = await FileSystem.readDirectoryAsync(directoryUri);
  const pdfNames = names.filter((name) => name.toLowerCase().endsWith('.pdf'));

  const files = await Promise.all(
    pdfNames.map(async (name) => {
      const uri = `${directoryUri}${name}`;
      const info = await FileSystem.getInfoAsync(uri);
      const createdAt =
        info.exists && 'modificationTime' in info && info.modificationTime
          ? new Date(info.modificationTime * 1000).toISOString()
          : new Date().toISOString();

      return {
        id: uri,
        name,
        uri,
        createdAt,
      };
    }),
  );

  return files.sort(
    (firstFile, secondFile) =>
      new Date(secondFile.createdAt).getTime() - new Date(firstFile.createdAt).getTime(),
  );
}

function buildPdfHtml(images: PdfImage[]) {
  const pages = images
    .map(
      (image) => `
        <section class="page">
          <img src="${image.dataUri}" alt="${escapeHtml(image.alt)}" />
        </section>
      `,
    )
    .join('');

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @page {
            size: ${A4_WIDTH}px ${A4_HEIGHT}px;
            margin: 0;
          }

          * {
            box-sizing: border-box;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
          }

          .page {
            width: ${A4_WIDTH}px;
            height: ${A4_HEIGHT}px;
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-after: always;
            overflow: hidden;
            background: #ffffff;
          }

          .page:last-child {
            page-break-after: auto;
          }

          img {
            display: block;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>${pages}</body>
    </html>
  `;
}

function guessMimeType(value: string) {
  const normalized = value.toLowerCase();

  if (normalized.endsWith('.png')) {
    return 'image/png';
  }

  if (normalized.endsWith('.webp')) {
    return 'image/webp';
  }

  if (normalized.endsWith('.heic') || normalized.endsWith('.heif')) {
    return 'image/heic';
  }

  return 'image/jpeg';
}

async function getAvailablePdfTarget(directoryUri: string, fileName: string) {
  const extension = '.pdf';
  const baseName = fileName.toLowerCase().endsWith(extension)
    ? fileName.slice(0, -extension.length)
    : fileName;
  let candidateName = `${baseName}${extension}`;
  let suffix = 2;

  while ((await FileSystem.getInfoAsync(`${directoryUri}${candidateName}`)).exists) {
    candidateName = `${baseName}-${suffix}${extension}`;
    suffix += 1;
  }

  return {
    fileName: candidateName,
    uri: `${directoryUri}${candidateName}`,
  };
}

function createPdfFileName(requestedTitle?: string) {
  const sanitizedTitle = sanitizeFileTitle(requestedTitle ?? '');

  if (sanitizedTitle) {
    return sanitizedTitle.toLowerCase().endsWith('.pdf')
      ? sanitizedTitle
      : `${sanitizedTitle}.pdf`;
  }

  return `${createDefaultPdfTitle()}.pdf`;
}

function createDefaultPdfTitle() {
  const now = new Date();
  const date = `${now.getFullYear()}${padTwo(now.getMonth() + 1)}${padTwo(now.getDate())}`;
  const time = `${padTwo(now.getHours())}${padTwo(now.getMinutes())}${padTwo(now.getSeconds())}`;

  return `TinPDF-${date}-${time}`;
}

function sanitizeFileTitle(value: string) {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 80);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatPageCount(file: CreatedFile) {
  return file.pageCount ? `${file.pageCount} trang` : 'PDF đã lưu';
}

function formatImageMeta(image: SelectedImage) {
  const size =
    image.width > 0 && image.height > 0 ? `${image.width} × ${image.height}` : 'Ảnh';
  return image.fileName ? `${image.fileName} · ${size}` : size;
}

function padTwo(value: number) {
  return value.toString().padStart(2, '0');
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Có lỗi không xác định. Hãy thử lại sau.';
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
  emptyButton: {
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: '#10131c',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 4,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  fileList: {
    gap: 10,
  },
  fileItem: {
    minHeight: 118,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#eadfd8',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  fileItemCompact: {
    minHeight: 86,
  },
  fileThumb: {
    width: 48,
    height: 58,
    borderRadius: 8,
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileThumbText: {
    color: '#be123c',
    fontSize: 12,
    fontWeight: '900',
  },
  fileCopy: {
    flex: 1,
    gap: 4,
  },
  fileTitle: {
    color: '#10131c',
    fontSize: 15,
    fontWeight: '900',
  },
  fileMeta: {
    color: '#7d746f',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },
  fileActions: {
    width: 78,
    gap: 7,
  },
  fileActionButton: {
    minHeight: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  shareButton: {
    backgroundColor: '#10131c',
  },
  openButton: {
    backgroundColor: '#e11d48',
  },
  deleteButton: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderWidth: 1,
  },
  fileActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  deleteButtonText: {
    color: '#be123c',
  },
  scanCard: {
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderColor: '#eadfd8',
    borderWidth: 1,
    padding: 18,
    gap: 12,
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
    marginBottom: 6,
  },
  scanStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scanStat: {
    flex: 1,
    minHeight: 58,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  scanStatValue: {
    color: '#10131c',
    fontSize: 15,
    fontWeight: '900',
  },
  scanStatLabel: {
    color: '#7d746f',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 3,
  },
  nameField: {
    gap: 7,
  },
  fieldLabel: {
    color: '#10131c',
    fontSize: 13,
    fontWeight: '900',
  },
  nameInput: {
    minHeight: 50,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    color: '#10131c',
    fontSize: 15,
    fontWeight: '800',
    paddingHorizontal: 14,
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
  directScanButton: {
    minHeight: 82,
    borderRadius: 8,
    backgroundColor: '#e11d48',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#be123c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 4,
  },
  directScanMark: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directScanMarkText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '900',
  },
  directScanCopy: {
    flex: 1,
    gap: 3,
  },
  directScanTitle: {
    color: '#ffffff',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  directScanSubtitle: {
    color: '#ffe4e6',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
  },
  sourceGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  sourceButton: {
    flex: 1,
    minHeight: 76,
    borderRadius: 8,
    backgroundColor: '#10131c',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sourceMark: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#e11d48',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceMarkText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  sourceCopy: {
    flex: 1,
    gap: 2,
  },
  sourceTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
  },
  sourceSubtitle: {
    color: '#d6d3d1',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
  },
  createButton: {
    height: 54,
    borderRadius: 8,
    backgroundColor: '#10131c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  disabledButton: {
    opacity: 0.48,
  },
  createButtonMark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  createButtonText: {
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
  selectedHeaderCopy: {
    flex: 1,
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
  imagePreviewButton: {
    width: '100%',
    height: '100%',
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
  reorderControls: {
    position: 'absolute',
    left: 6,
    right: 6,
    bottom: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  reorderButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#10131c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reorderButtonDisabled: {
    opacity: 0.38,
  },
  reorderButtonText: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 18,
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
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(16, 19, 28, 0.82)',
    justifyContent: 'center',
    padding: 18,
  },
  previewSheet: {
    maxHeight: '88%',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 12,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  previewTitleGroup: {
    flex: 1,
  },
  previewTitle: {
    color: '#10131c',
    fontSize: 18,
    fontWeight: '900',
  },
  previewMeta: {
    color: '#7d746f',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 3,
  },
  previewCloseButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#10131c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewCloseText: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '900',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 0.72,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    resizeMode: 'contain',
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
