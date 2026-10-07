import { SettingsHeader } from "@/components/customs/settingsHeader";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { CustomModal } from "@/components/ui/modal";
import { img } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useAuth } from "@/guards/guard";
import { useDeleteBeneficiaryMutation } from "@/redux/settings/settings";
import { useAppSelector } from "@/redux/store";
import { getFirstChar } from "@/utils/bills";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronDown, ChevronRightIcon, Trash2 } from "lucide-react-native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export interface AccountItemProps {
  name: string;
  accountnumber: string;
  accountname: string;
  bankcode: string;
  bankurl: string;
  bankname: string;
}

interface DeleteConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  isLoading?: boolean;
  itemName?: string;
}

export const AccountItem = ({ item, onPress, onDelete }: any) => {
  const { isDark } = useTheme();

  return (
    <View key={item.id || item.accountnumber}
      className=" dark:bg-[#0C0C0C] bg-[#F9F9F9] mx-2 rounded-[20px] border-[0.5px] border-[#E8FFE4] p-2 dark:border-[#232323]  "
    >
      <Pressable
        onPress={() => onPress && onPress(item)}
        className="flex-row flex-1 items-center  justify-between "
      >
        <View className="flex-row items-center gap-2 ">
          {item.image ? (
            <Image
              source={{
                uri: item.image.startsWith("http") ? item.image : ``,
              }}
              style={{ width: 36, height: 36 }}
              className="rounded-[16px]"
            // onError={() => {
            //   console.log("Failed to load image for:", item.name);
            // }}
            />
          ) : (
            <ThemedText className="bg-white dark:bg-dark-500 w-8 h-8 text-center leading-8 rounded-[16px] text-xs">
              {getFirstChar(item.account_name || "B")}
            </ThemedText>
          )}

          {/* Content */}
          <View className="flex-col ">
            <ThemedText
              family="primary"
              variant="primary"
              weight="medium"
              className="text-b3"
            >
              {item?.account_name}
            </ThemedText>
            <ThemedText
              family="primary"
              variant="primary"
              weight="medium"
              className="text-[16px] pt-2"
            >
              {`${item?.account_number} | ${item?.bank_name}`}
            </ThemedText>
          </View>
        </View>
        {/* Right Icon */}

        <View className="">
          <ChevronRightIcon
            width={24}
            height={24}
            color={isDark ? "white" : "black"}
          />
        </View>
      </Pressable>
      {/* delete icon */}
      {/* <Pressable onPress={() => onDelete && onDelete(item)} className="">
        <Trash2 width={20} height={20} color={isDark ? "#FF3B30" : "#FF3B30"} />
      </Pressable> */}
    </View>
  );
};

interface BankDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  bankInfo: any;
  onDelete: (item: any) => void;
}

const BankDetailsModal: React.FC<BankDetailsModalProps> = ({
  visible,
  onClose,
  bankInfo,
  onDelete,
}) => {
  const { isDark } = useTheme();

  return (
    <CustomModal
      visible={visible}
      onClose={onClose}
      title="Bank details"
      height="auto"
      showHandle={true}
      showHeader={true}
      closebutton={true}
    >
      <View className="gap-6 mt-4">
        {/* Bank Name */}
        <View>
          <ThemedText family="primary" variant="primary" weight="medium" className="text-b2 mb-2">
            Bank name
          </ThemedText>
          <Pressable
            className="w-full h-12 flex-row items-center justify-between border border-border-light dark:border-border-dark rounded-[20px] px-4 bg-foreground-light dark:bg-foreground-dark"
          >
            <ThemedText family="primary" variant="primary" weight="medium" className="text-b2">
              {bankInfo?.bank_name || "Select bank"}
            </ThemedText>
            <ChevronDown size={20} color={isDark ? "#9CA3AF" : "#6B7280"} />
          </Pressable>
        </View>

        {/* Account Number */}
        <View>
          <ThemedText family="primary" variant="primary" weight="medium" className="text-b2 mb-2">
            Account number
          </ThemedText>
          <View
            className="w-full h-12 justify-center border border-border-light dark:border-border-dark rounded-[20px] px-4 bg-foreground-light dark:bg-foreground-dark"
          >
            <ThemedText family="primary" variant="primary" weight="medium" className="text-b2">
              {bankInfo?.account_number}
            </ThemedText>
          </View>
        </View>

        {/* Account Name */}
        <View>
          <ThemedText family="primary" variant="primary" weight="medium" className="text-b2 mb-2">
            Account name
          </ThemedText>
          <View
            className="w-full h-12 justify-center border border-border-light dark:border-border-dark rounded-[20px] px-4 bg-foreground-light dark:bg-foreground-dark"
          >
            <ThemedText family="primary" variant="primary" weight="medium" className="text-b2 uppercase">
              {bankInfo?.account_name}
            </ThemedText>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-4 mt-4">
          <Pressable
            onPress={() => {
              onClose();
              onDelete(bankInfo);
            }}
            className="flex-1 h-14 bg-danger-100 dark:bg-danger-900/20 rounded-full items-center justify-center"
          >
            <ThemedText
              family="primary"
              variant="primary"
              weight="semibold"
              className="text-b2 !text-danger-500"
            >
              Remove bank
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </CustomModal>
  );
};

const Paymentbank = () => {
  const router = useRouter();
  const { user } = useAppSelector((state) => state.auth);
  const { refreshToken } = useAuth();

  const toast = useToast();
  const [showDeleteModal, setShowDeleteModal] = React.useState(false);
  const [selectedAccount, setSelectedAccount] = React.useState<any | null>(
    null,
  );
  const [isDetailsModalVisible, setIsDetailsModalVisible] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const { beneficiaries } = user || {};

  const [deleteBeneficiary, { isLoading: isDeleting }] =
    useDeleteBeneficiaryMutation();

  const onRefresh = useCallback(async () => {
    // console.log("Refreshing payment banks...");
    setIsRefreshing(true);
    try {
      await refreshToken();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshToken]);


  useFocusEffect(
    useCallback(() => {
      onRefresh();
    }, [])
  );


  const handleDeletePress = (item: AccountItemProps) => {
    setSelectedAccount(item);
    setShowDeleteModal(true);
  };

  console.log("Deleting account:", selectedAccount);

  const handleConfirmDelete = async () => {
    if (!selectedAccount) return;

    try {
      const atex = await TokenManager.getToken();
      const response: any = await deleteBeneficiary({
        data: {
          token: atex,
          account_number: selectedAccount.account_number,
          bank_code: selectedAccount.bank_code,
          bank_name: selectedAccount.bank_name,
        },
      }).unwrap();
      console.log("Delete response:", response);

      if (response?.status === "success") {
        toast.showToast("Beneficiary deleted successfully", "success");
        setShowDeleteModal(false);
        setSelectedAccount(null);

        // Refresh the list
        await refreshToken();
      } else {
        toast.showToast(
          response?.message || "Failed to delete beneficiary",
          "error",
        );
      }
    } catch (error: any) {
      toast.showToast(
        error?.data?.message ||
        error?.message ||
        "Failed to delete beneficiary",
        "error",
      );
      console.error("Error deleting beneficiary:", error);
    }
  };

  const handleCloseModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setSelectedAccount(null);
    }
  };

  const handlePress = (item: any) => {
    setSelectedAccount(item);
    setIsDetailsModalVisible(true);
  };

  const handleAddBankPress = () => {
    router.push(paths.setting.addBank);
  };

  return (
    <ThemedView className="flex-1">
      <SettingsHeader title="Payment Bank" />
      <View className="flex-1">
        <FlatList
          data={beneficiaries}
          keyExtractor={(item, index) => `${item.id || item.accountnumber}-${item.bankCode || index}`}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 100
          }}
          ListHeaderComponent={() => (
            beneficiaries && beneficiaries.length > 0 ? (
              <View
                className="bg-[#F9F9F9] dark:bg-[#111111] border-x-[0.5px] border-t-[0.5px] border-[#EFEFEF] dark:border-[#232323] rounded-t-full pt-2"
              />
            ) : null
          )}
          renderItem={({ item, index }) => (
            <View className="bg-[#F9F9F9] dark:bg-[#111111] border-x-[0.5px] border-[#EFEFEF] dark:border-[#232323] py-1">
              <AccountItem
                item={item}
                onPress={handlePress}
                onDelete={handleDeletePress}
              />
            </View>
          )}
          ListFooterComponent={() => (
            beneficiaries && beneficiaries.length > 0 ? (
              <View
                className="bg-[#F9F9F9] dark:bg-[#111111] border-x-[0.5px] border-b-[0.5px] border-[#EFEFEF] dark:border-[#232323] rounded-b-[30px] pb-2"
              />
            ) : null
          )}
          ItemSeparatorComponent={() => (
            <View className="bg-transparent dark:bg-transparent ">
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="mt-4 flex-col items-center pt-3 justify-center">
              <View
                className="w-12 h-12 bg-[#E8FFE4] mb-3 dark:bg-[#0B2E02] rounded-[12px] items-center justify-center"
              >
                {isDark ? <img.bankLight width={24} height={24} /> : <img.bankDark width={24} height={24} />}
              </View>
              <ThemedText
                family="primary"
                variant="primary"
                weight="medium"
                className="text-b2"
              >
                No payment bank yet
              </ThemedText>

              <ThemedText
                family="primary"
                variant="secondary"
                weight="medium"
                className="text-b2 pt-2 text-center"
              >
                Click the button below to add a new bank
              </ThemedText>
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? "white" : "black"}
            />
          }
        />

        <BankDetailsModal
          visible={isDetailsModalVisible}
          onClose={() => setIsDetailsModalVisible(false)}
          bankInfo={selectedAccount}
          onDelete={(item) => {
            setSelectedAccount(item);
            setShowDeleteModal(true);
          }}
        />
        <DeleteConfirmationModal
          visible={showDeleteModal}
          onClose={handleCloseModal}
          onConfirm={handleConfirmDelete}
          isLoading={isDeleting}
          title="Delete Bank Account"
          message="Are you sure you want to remove this bank account from your saved beneficiaries? This action cannot be undone."
          itemName={""}
        />
      </View>
      <View className="px-4" style={{ marginBottom: Math.max(insets.bottom, 16) }}>
        <Button
          variant="primary"
          onPress={handleAddBankPress}
        >
          <ThemedText
            family="primary"
            variant="primary"
            weight="semibold"
            className="text-[16px] !text-white"
          >
            Add New Bank
          </ThemedText>
        </Button>
      </View>
    </ThemedView>
  );
};

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title = "Delete Beneficiary",
  message = "Are you sure you want to delete this beneficiary? This action cannot be undone.",
  isLoading = false,
  itemName,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        className="flex-1 bg-black/60 justify-center items-center"
        onPress={onClose}
      >
        <Pressable
          className="bg-white dark:bg-dark-700 rounded-2xl w-[85%] max-w-md"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 pb-4">
            <View className="flex-1 justify-center items-center gap-3">
              <View className="bg-danger-100 p-2  rounded-full ">
                <Trash2 width={24} height={24} color="#FF3B30" />
              </View>
              <ThemedText
                family="primary"
                variant="primary"
                weight="bold"
                className="text-h6 text-center"
              >
                {title}
              </ThemedText>
            </View>
            {/* 
            <Pressable onPress={onClose} className="p-2" disabled={isLoading}>
              <X width={24} height={24} color="#6B7280" />
            </Pressable> */}
          </View>

          {/* Content */}
          <View className="px-6 pb-6">
            {itemName && (
              <View className="bg-light-100 dark:bg-dark-600 p-3 rounded-lg mb-4">
                <ThemedText
                  family="primary"
                  variant="primary"
                  weight="semibold"
                  className="text-b2 text-center"
                >
                  {itemName}
                </ThemedText>
              </View>
            )}

            <ThemedText
              family="primary"
              variant="secondary"
              weight="regular"
              className="text-b2 text-center"
            >
              {message}
            </ThemedText>

            {/* Buttons */}
            <View className="flex-row gap-3 mt-6">
              {/* Cancel Button */}
              <Pressable
                onPress={onClose}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-light-150 dark:bg-dark-600"
              >
                <ThemedText
                  family="primary"
                  variant="primary"
                  weight="semibold"
                  className="text-b2 text-center !text-white"
                >
                  Cancel
                </ThemedText>
              </Pressable>

              {/* Delete Button */}
              <Pressable
                onPress={onConfirm}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-danger-500"
              >
                {isLoading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <ThemedText
                    family="primary"
                    variant="primary"
                    weight="semibold"
                    className="text-b2 text-center !text-white"
                  >
                    Delete
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default Paymentbank;
