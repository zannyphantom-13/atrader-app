import { useTheme } from "@/context/ThemeProvider";
import { useGetCableMutation } from "@/redux/bills/bills_api";
import { TokenManager } from "@/utils/secure-store-adapter";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import React from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { formatNumber } from "../../utils/formatamount";
import { ThemedText } from "../theme/themeText";
import { CustomModal } from "../ui/modal";


interface DepositModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  formData: any;
  setFormData: (data: any) => void;
  handleChangeCablePlan: (network: string, amt: string, planId: string, unique_identifier: string) => void;
}

const CablePackageModal = ({
  visible,
  formData,
  setFormData,
  handleChangeCablePlan,
  setVisible,
}: DepositModalProps) => {
  const { isDark } = useTheme();
  const [cablePackages, setCablePackages] = React.useState<any[]>([]);
  // const { atex } = useAuthToken();

  const [getCable, { isLoading }] = useGetCableMutation();

  React.useEffect(() => {
    if (visible && formData.cableNetwork) {
      fetchCablePackages();
    }
  }, [visible, formData.cableNetwork]);
  const fetchCablePackages = async () => {
    try {
      const atex = await TokenManager.getToken();

      const response: any = await getCable({
        data: {
          token: atex,
        },
      }).unwrap();


      if (response.status === "success") {
        console.log("Full Cable Response:", response.data);

        // Extract plans for the selected cable network
        const selectedCableData = response.data[formData.cableNetwork];

        if (selectedCableData && selectedCableData.plans) {
          console.log(
            `Plans for ${formData.cableNetwork}:`,
            selectedCableData.plans,
          );
          setCablePackages(selectedCableData.plans);
        } else {
          console.log(`No plans found for ${formData.cableNetwork}`);
          setCablePackages([]);
        }
      } else {
        console.error("Failed to fetch cable packages:", response);
        setCablePackages([]);
      }
    } catch (error) {
      console.error("Error fetching cable packages:", error);
      setCablePackages([]);
    }
  };

  const renderCablePackage = (item: any) => {
    return (
      <Pressable
        key={item.plan_id || item.id}
        onPress={() => {
          handleChangeCablePlan(
            item.plan_name || item.name,
            item.plan_price || item.price || item.amount,
            item.plan_id || item.id,
            item.unique_identifier || "",
          );
          setVisible(false);
        }}
        className={`p-4 mb-2 border border-light-150 flex rounded-3xl flex-row justify-between items-center dark:border-border-dark ${formData.cableplan === (item.plan_name || item.name)
          ? "dark:bg-[#0B2E02] dark:!border-primary-500 bg-[#E8FFE4] "
          : isDark
            ? "bg-[#111111] "
            : "bg-[#F5F5F5]"
          }`}
      >
        <View className="flex-1 mr-4">
          <ThemedText family="primary" weight="medium" className="text-b3">
            {item.plan_name || item.name}
          </ThemedText>
          {item.description && (
            <ThemedText
              family="primary"
              className="text-xs text-gray-500 mt-1"
              numberOfLines={2}
            >
              {item.description}
            </ThemedText>
          )}
        </View>
        <ThemedText
          family="primary"
          weight="semibold"
          className="text-b2 text-primary-500"
        >
          ₦{formatNumber(Number(item.plan_price || item.price || item.amount))}
        </ThemedText>
      </Pressable>
    );
  };

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      title={`${formData.cableNetwork} Packages`}
      height="70%"
      // padding={24}
      topOffset={80}
      bottomOffset={0}
      padding={0}
      renderScrollableContent={true}
      modalStyle={{
        borderRadius: 12,
        paddingTop: 20,
      }}
      containerStyle={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
      }}
      closebutton={true}
      showHandle={true}
      showHeader={true}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => setVisible(false)}
    >
      {/* Fixed Header */}
      <View className="px-6 pb-3">
        <View className="flex-row items-center justify-between mb-4">
          <ThemedText weight="semibold" className="text-xl flex-1 text-center">
            {formData.cableNetwork} Packages
          </ThemedText>
          <Pressable onPress={() => setVisible(false)} className="absolute right-0 p-2">
            <X size={24} color={isDark ? "white" : "black"} />
          </Pressable>
        </View>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        {isLoading ? (
          <View className="flex-1 mt-3 justify-center items-center">
            <ActivityIndicator size="small" color={isDark ? "#fff" : "#000"} />
          </View>
        ) : (
          <BottomSheetFlatList
            data={cablePackages}
            keyExtractor={(item, index) =>
              (item.plan_id || item.id || index).toString()
            }
            renderItem={({ item }) => renderCablePackage(item)}
            className="mt-4"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View className="flex-1 justify-center items-center py-10">
                <ThemedText
                  family="primary"
                  variant="primary"
                  weight="medium"
                  className="text-b2 text-center"
                >
                  {formData.cableNetwork
                    ? `No packages available for ${formData.cableNetwork}`
                    : "Please select a cable network first"}
                </ThemedText>
              </View>
            )}
          />
        )}
      </View>
    </CustomModal>
  );
};

export default CablePackageModal;
