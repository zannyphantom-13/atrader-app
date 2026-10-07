import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Input } from "@/components/ui/form-fields";
import { CustomModal } from "@/components/ui/modal";
import { AVATARS, getAvatarById } from "@/constant/icon";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { setSelectedAvatarId } from "@/redux/auth/auth_slice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { Camera, Check } from "lucide-react-native";
import React, { useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const logoDark = require("@/assets/images/logo_white.svg");

interface PhoneInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onChangeCountry?: (country: CountryCode) => void;
  placeholder?: string;
  label?: string;
  defaultCountry?: string;
  editable?: boolean;
  disabled?: boolean;
}

interface CountryCode {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

const countryCodes: CountryCode[] = [
  { code: "NG", dialCode: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "US", dialCode: "+1", flag: "🇺🇸", name: "United States" },
  { code: "GB", dialCode: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "CA", dialCode: "+1", flag: "🇨🇦", name: "Canada" },
  { code: "GH", dialCode: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "KE", dialCode: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "ZA", dialCode: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "IN", dialCode: "+91", flag: "🇮🇳", name: "India" },
  { code: "FR", dialCode: "+33", flag: "🇫🇷", name: "France" },
  { code: "DE", dialCode: "+49", flag: "🇩🇪", name: "Germany" },
];

const AccountInformation = () => {
  const { isDark } = useTheme();
  const { user, selectedAvatarId } = useAppSelector((state) => state.auth);
  const { user: userInfo } = user || {};
  const router = useRouter();

  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const selectedAvatar = selectedAvatarId
    ? getAvatarById(selectedAvatarId)
    // : null;
    : AVATARS[9];



  return (
    <>
      <ThemedView className="flex-1">
        <SettingsHeader title="Account Information" />

        <ScrollView
          className="flex-1 pt-2 px-[24px]"
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          <View className="flex items-start mb-8">
            <Pressable
              onPress={() => setShowAvatarModal(true)}
              className="relative"
            >
              {/* Avatar Display */}
              <View className="w-24 h-24 rounded-full overflow-hidden bg-light-150 dark:bg-dark-700 items-center justify-center">
                {selectedAvatar ? (
                  selectedAvatar.type === "svg" ? (
                    <selectedAvatar.image width={96} height={96} />
                  ) : (
                    <Image
                      source={selectedAvatar.image}
                      style={{ width: 96, height: 96 }}
                      resizeMode="cover"
                    />
                  )
                ) : (
                  <View
                    className="w-full h-full items-center justify-center flex">
                    {/* teuning the dark inverted image */}
                    <Image
                      source={isDark ? img.logoDarkPng : img.logolightPng}
                      style={{ width: 80, height: 40 }}
                      resizeMode="contain"
                    />
                  </View>
                )}
              </View>

              {/* Edit Button Overlay */}
              <View className="absolute bottom-0 right-0 bg-primary-500 rounded-full p-2">
                <Camera width={16} height={16} color="white" />
              </View>
            </Pressable>

            <ThemedText
              family="primary"
              variant="secondary"
              weight="regular"
              className="text-b3 mt-2"
            >
              Tap to change avatar
            </ThemedText>
          </View>

          <Input
            label="Full Name"
            placeholder="Aremu"
            className="mb-6"
            value={userInfo?.name || "Atrader"}
            onChangeText={() => { }}
            disabled={true}
          />

          <Input
            label="Username"
            placeholder=""
            className="mb-4"
            value={userInfo?.username || "atrader"}
            onChangeText={() => { }}
            disabled={true}
          />

          <Input
            label="Email"
            placeholder=""
            className="pb-4"
            value={userInfo?.email || ""}
            onChangeText={() => { }}
            disabled={true}
          />

          <PhoneInputComponent
            value={userInfo?.phone || ""}
            // onChangeText={(text) => console.log(text)}
            // onChangeCountry={(country) => console.log(country)}
            placeholder=""
            label="Phone number"
            defaultCountry="NG"
            editable={false}
          />

          {/* <Button
            className="mt-10"
            variant="primary"
            onPress={() => console.log("Save Changes")}
          >
            Save Changes
          </Button> */}
        </ScrollView>
        {/* </SafeAreaView> */}
      </ThemedView>

      <AvatarSelectionModal
        visible={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
      />
    </>
  );
};

export default AccountInformation;

const PhoneInputComponent: React.FC<PhoneInputProps> = ({
  value = "",
  onChangeText,
  onChangeCountry,
  placeholder = "",
  label = "Phone number",
  defaultCountry = "NG",
  editable = true,
}) => {
  const { isDark } = useTheme();
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(
    countryCodes.find((country) => country.code === defaultCountry) ||
    countryCodes[0]
  );
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");

  const filteredCountries = countryCodes.filter(
    (country) =>
      country.name.toLowerCase().includes(searchText.toLowerCase()) ||
      country.dialCode.includes(searchText)
  );

  const handleCountrySelect = (country: CountryCode) => {
    setSelectedCountry(country);
    setIsCountryModalVisible(false);
    setSearchText("");
    onChangeCountry?.(country);
  };

  const renderCountryItem = ({ item }: { item: CountryCode }) => (
    <Pressable
      className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-700"
      onPress={() => handleCountrySelect(item)}
    >
      <Text className="text-2xl mr-3">{item.flag}</Text>
      <View className="flex-1">
        <ThemedText variant="primary" className="font-medium">
          {item.name}
        </ThemedText>
        <ThemedText variant="secondary" className="text-sm">
          {item.dialCode}
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <View className="my-3">
      {/* Label */}
      <ThemedText
        variant="primary"
        weight="medium"
        className="text-b2 mb-2 font-primary-medium text-text-primary-light dark:text-text-primary-dark"
      >
        {label}
      </ThemedText>

      {/* Phone Input Container */}
      <View className="flex-row  gap-3 rounded-lg overflow-hidden">
        {/* Country Code Selector */}
        <Pressable
          className={`flex-row items-center px-3 py-3 border border-[#EFEFEF] rounded-[20px] bg-[#FCFCFC] dark:bg-[#111111] dark:border-[#232323]`}
          onPress={() => setIsCountryModalVisible(true)}
          disabled={!editable}
        >
          {/* <Text className={`text-b1 font-primary-medium pt-2 mr-2 ${!editable ? "text-gray-500 dark:text-gray-400" : ""}`}>
            {selectedCountry.flag}
          </Text> */}
          <ThemedText variant="primary" weight="medium" className={`text-sm ${!editable ? "!text-gray-500 dark:!text-[#B5B5B5]" : ""}`}>
            {selectedCountry.dialCode}
          </ThemedText>
        </Pressable>

        {/* Phone Number Input */}
        <TextInput
          className={`flex-1 px-4 pb-3 border border-[#EFEFEF] font-primary-medium rounded-[20px] bg-[#FCFCFC] dark:bg-[#111111] dark:border-border-dark text-base`}
          placeholder={placeholder}
          placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
          value={value}
          onChangeText={onChangeText}
          keyboardType="phone-pad"
          editable={editable}
          style={{
            fontSize: 14,
            color: !editable ? (isDark ? "#B5B5B5" : "#6B7280") : (isDark ? "#FFFFFF" : "#000000"),
          }}
        />
      </View>

      {/* Country Selection Modal */}
      <CustomModal
        visible={isCountryModalVisible}
        onClose={() => setIsCountryModalVisible(false)}
        title="Select Country"
        height="70%"
        showHandle={true}
        showHeader={true}
        padding={0}
      >
        <View className="flex-1">
          {/* Search Input */}
          <View className="p-4 border-b border-gray-200 dark:border-gray-700">
            <TextInput
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-[15px] bg-gray-50 dark:bg-[#111111] text-black dark:text-white font-primary-medium"
              placeholder="Search country or dial code..."
              placeholderTextColor={isDark ? "#9CA3AF" : "#6B7280"}
              value={searchText}
              onChangeText={setSearchText}
              style={{ fontSize: 16 }}
            />
          </View>

          {/* Countries List */}
          <FlatList
            data={filteredCountries}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.code}
            showsVerticalScrollIndicator={false}
            className="flex-1 px-2"
          />
        </View>
      </CustomModal>
    </View>
  );
};
const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AVATAR_SIZE = (SCREEN_WIDTH - 80) / 3;

export const AvatarSelectionModal: React.FC<any> = ({ visible, onClose }) => {
  const { isDark } = useTheme();
  const dispatch = useAppDispatch();
  const { selectedAvatarId } = useAppSelector((state) => state.auth);
  const insets = useSafeAreaInsets();

  const [previewAvatarId, setPreviewAvatarId] = useState<string | null>(
    selectedAvatarId
  );
  const [filter, setFilter] = useState<"all" | "male" | "female">("all");

  const filteredAvatars = AVATARS.filter((avatar) => {
    if (filter === "all") return true;
    return avatar.gender === filter;
  });

  const handleAvatarSelect = (avatarId: string) => {
    setPreviewAvatarId(avatarId);
  };

  const handleConfirm = () => {
    if (previewAvatarId) {
      dispatch(setSelectedAvatarId(previewAvatarId));
    }
    onClose();
  };

  const handleCancel = () => {
    setPreviewAvatarId(selectedAvatarId); // Reset to current selection
    onClose();
  };

  const previewAvatar = previewAvatarId ? getAvatarById(previewAvatarId) : null;

  return (
    <CustomModal
      visible={visible}
      onClose={handleCancel}
      title="Choose Avatar"
      height="85%"
      showHandle={true}
      showHeader={true}
      padding={0}
      renderScrollableContent={true}
    >
      <View className="flex-1">
        {/* Preview Section */}
        <View className="items-center py-6 bg-light-50 dark:bg-dark-800">
          <View className="w-24 h-24 rounded-full bg-light-150 dark:bg-dark-700 items-center justify-center mb-3 overflow-hidden border-2 border-primary-500">
            {previewAvatar ? (
              previewAvatar.type === "svg" ? (
                <previewAvatar.image width={96} height={96} />
              ) : (
                <Image
                  source={previewAvatar.image}
                  style={{ width: 96, height: 96 }}
                  resizeMode="cover"
                />
              )
            ) : (
              <ThemedText
                family="primary"
                variant="secondary"
                weight="regular"
                className="text-b3"
              >
                No selection
              </ThemedText>
            )}
          </View>
          <ThemedText
            family="primary"
            variant="primary"
            weight="semibold"
            className="text-b2"
          >
            {previewAvatar ? '' : "Select an avatar"}
          </ThemedText>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row px-6 py-4 gap-2">
          {["all", "male", "female"].map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setFilter(tab as any)}
              className={`flex-1 py-3 rounded-2xl border-[0.5px] ${filter === tab
                ? "bg-primary-500 border-primary-500"
                : "bg-[#F9F9F9] dark:bg-[#0C0C0C] border-border-light dark:border-border-dark"
                }`}
            >
              <ThemedText
                family="primary"
                variant="primary"
                weight="medium"
                className={`text-b2 text-center capitalize ${filter === tab ? "!text-white" : ""
                  }`}
              >
                {tab}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* Avatar Grid */}
        <BottomSheetScrollView
          className="flex-1 px-6"
          contentContainerStyle={{ paddingBottom: 160 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row flex-wrap gap-4 justify-between">
            {filteredAvatars.map((avatar: any) => (
              <Pressable
                key={avatar.id}
                onPress={() => handleAvatarSelect(avatar.id)}
                className={`rounded-[25px] overflow-hidden items-center justify-center p-2 border-[1px] ${previewAvatarId === avatar.id
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10"
                  : "border-border-light dark:border-border-dark bg-[#F9F9F9] dark:bg-[#0C0C0C]"
                  }`}
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                }}
              >
                {avatar.type === "svg" ? (
                  <avatar.image width={AVATAR_SIZE - 20} height={AVATAR_SIZE - 20} />
                ) : (
                  <Image
                    source={avatar.image}
                    style={{ width: "100%", height: "100%" }}
                    className="rounded-[18px]"
                    resizeMode="cover"
                  />
                )}

                {/* Selected Indicator */}
                {previewAvatarId === avatar.id && (
                  <View className="absolute top-2 right-2 bg-primary-500 rounded-full p-1">
                    <Check width={12} height={12} color="white" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </BottomSheetScrollView>

        {/* Bottom Buttons */}
        <View
          className="absolute bottom-0 left-0 right-0 px-6 pt-4 bg-white dark:bg-[#111111] border-t border-border-light dark:border-border-dark flex-row gap-3"
          style={{ paddingBottom: Math.max(insets.bottom, 20) + (Platform.OS === 'android' ? 20 : 0) }}
        >
          <Pressable
            onPress={handleCancel}
            className="flex-1 py-4 rounded-full border border-border-light dark:border-border-dark bg-white dark:bg-[#111111]"
          >
            <ThemedText
              family="primary"
              variant="primary"
              weight="semibold"
              className="text-b2 text-center"
            >
              Cancel
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            disabled={!previewAvatarId}
            className={`flex-1 py-4 rounded-full ${previewAvatarId
              ? "bg-primary-500"
              : "bg-light-200 dark:bg-dark-600"
              }`}
          >
            <ThemedText
              family="primary"
              variant="primary"
              weight="semibold"
              className={`text-b2 text-center ${previewAvatarId ? "!text-white" : "!text-light-500"
                }`}
            >
              Confirm
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </CustomModal>
  );
};
