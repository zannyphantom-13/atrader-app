import { useTheme } from "@/context/ThemeProvider";
import {
  removeBettingBeneficiary,
  removeCableBeneficiary,
  removeElectricityBeneficiary,
  removePhoneBeneficiary,
} from "@/redux/beneficiary/bene_slice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { getIconsForBeneficiary } from "@/utils/bills";
import { Trash2 } from "lucide-react-native";
import React from "react";
import { Pressable, ScrollView, View } from "react-native";
import { ThemedText } from "../theme/themeText";
import { CustomModal } from "../ui/modal";

export type benetype = "phone" | "cable" | "electricity" | "betting";

export interface bentypes {
  id: string;
  number?: string;
  name?: string;
  network?: string;
  cableNetwork?: string;
  cablenumber?: string;
  meternumber?: string;
  provider?: string;
}

interface BenModalProps {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  beneficiaryType: benetype;
  selectedBeneficiary: bentypes;
  setSelectedBeneficiary: (beneficiary: bentypes) => void;
  handleSelectBeneficiary: (beneficiary: bentypes) => void;
  formData: {
    number?: string;
    cablenumber?: string;
    meternumber?: string;
    id?: string;
    provider?: string;
  };
}

const BeneficiaryModal = ({
  visible,
  setVisible,
  beneficiaryType,
  selectedBeneficiary,
  setSelectedBeneficiary,
  formData,
  handleSelectBeneficiary,
}: BenModalProps) => {
  const { isDark } = useTheme();
  const { phoneBeneficiaries, cableBeneficiaries, electricityBeneficiaries, bettingBeneficiaries } =
    useAppSelector((state) => state.beneficiary);
  const dispatch = useAppDispatch();

  const removeBeneficairy = (data: bentypes) => {
    if (beneficiaryType === "cable") {
      dispatch(
        removeCableBeneficiary({
          id: data.id,
          cablenumber: data.cablenumber || "",
          cableNetwork: data.network || "",
          name: data.name || "",
        })
      );
    } else if (beneficiaryType === "phone") {
      dispatch(
        removePhoneBeneficiary({
          id: data.id,
          number: data.number || "",
          name: data.name || "",
          network: data.network || "",
        })
      );
    } else if (beneficiaryType === "electricity") {
      dispatch(
        removeElectricityBeneficiary({
          id: data.id,
          meternumber: data.meternumber || "",
          provider: data.provider || "",
          name: data.name || "",
        })
      );
    } else if (beneficiaryType === "betting") {
      dispatch(
        removeBettingBeneficiary({
          id: data.id,
          provider: data.provider || "",
        })
      );
    }
  };

  return (
    <CustomModal
      visible={visible}
      onClose={() => setVisible(false)}
      title="Beneficiaries"
      closebutton={false}
      height="60%"
      padding={24}
      topOffset={80}
      bottomOffset={0}
      modalStyle={{
        borderRadius: 12,
        paddingTop: 20,
        paddingBottom: 20,
      }}
      containerStyle={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderRadius: 10,
      }}
      showHandle={true}
      showHeader={false}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => { }}
      className="font-primary-bold  bg-red-500 text-[2px]"
    >
      <ThemedText
        family="secondary"
        weight="medium"
        className="text-b1 pb-4 text-left"
      >
        {" Saved Beneficiary"}
      </ThemedText>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 44,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* phone beneficairy section */}
        {beneficiaryType === "phone" && (
          <>
            {phoneBeneficiaries?.map((phone, i) => {
              const TheIconss = getIconsForBeneficiary(phone as any);
              const isActive = formData.number === phone.id;
              return (
                <View
                  key={i}
                  className={`flex-row items-center mb-2 border py-3 rounded-[20px] px-3 border-border-light dark:border-border-dark justify-between ${isActive ? "dark:bg-[#0B2E02] !border-primary-500 bg-[#E8FFE4]" : "bg-[#F5F5F5] dark:bg-dark-700"}`}
                >
                  <Pressable
                    onPress={() => handleSelectBeneficiary(phone)}
                    className="flex-row items-center gap-4 flex-1"
                  >
                    <View className="w-8 h-8 justify-center items-center">
                      {TheIconss ? (
                        <TheIconss width={32} height={32} />
                      ) : (
                        <ThemedText className="bg-light-150 dark:bg-dark-700 w-8 h-8 text-center leading-8 rounded-full text-xs">
                          {phone?.network?.charAt(0)?.toUpperCase() || "C"}
                        </ThemedText>
                      )}
                    </View>
                    <View className="flex-1">
                      <ThemedText
                        family="primary"
                        weight="medium"
                        className={`text-b2 ${isActive ? "dark:text-white" : "text-text-primary-light dark:text-text-primary-dark"}`}
                      >
                        {phone.number}
                      </ThemedText>
                      <ThemedText
                        family="secondary"
                        weight="regular"
                        className={`text-b3 pt-2 uppercase ${isActive ? "dark:text-white" : ""}`}
                        numberOfLines={1}
                      >
                        {phone?.network || "Provider"}
                      </ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => removeBeneficairy(phone)}>
                    <Trash2
                      width={15}
                      height={15}
                      color={isDark || isActive ? "#fff" : "#000"}
                      strokeWidth={2}
                    />
                  </Pressable>
                </View>
              );
            })}
            {(!phoneBeneficiaries || phoneBeneficiaries.length === 0) && (
              <View className="flex-1 justify-center items-center py-10">
                <ThemedText family="secondary" weight="medium" className="text-b3 text-center">
                  No phone beneficiaries found
                </ThemedText>
              </View>
            )}
          </>
        )}

        {/* cable beneficairy section */}
        {beneficiaryType === "cable" && (
          <>
            {cableBeneficiaries?.map((cable, i) => {
              const TheIconss = getIconsForBeneficiary(cable as any);
              const isActive = formData.cablenumber === cable.cablenumber;
              return (
                <View
                  key={i}
                  className={`flex-row items-center mb-2 border py-3 rounded-[20px] px-3 border-border-light dark:border-border-dark justify-between ${isActive ? "dark:bg-[#0B2E02] !border-primary-500 bg-[#E8FFE4]" : "bg-[#F5F5F5] dark:bg-dark-700"}`}
                >
                  <Pressable
                    onPress={() => handleSelectBeneficiary(cable as any)}
                    className="flex-row items-center gap-4 flex-1"
                  >
                    <View className="w-8 h-8 justify-center items-center">
                      {TheIconss ? (
                        <TheIconss width={32} height={32} />
                      ) : (
                        <ThemedText className="bg-light-150 dark:bg-dark-700 w-8 h-8 text-center leading-8 rounded-full text-xs">
                          {cable?.cableNetwork?.charAt(0)?.toUpperCase() || "C"}
                        </ThemedText>
                      )}
                    </View>
                    <View className="flex-1">
                      <ThemedText
                        family="primary"
                        weight="bold"
                        className={`text-b2 ${isActive ? "dark:text-white" : ""}`}
                      >
                        {cable.cablenumber}
                      </ThemedText>
                      <ThemedText
                        family="secondary"
                        weight="medium"
                        className={`text-b3 pt-2 ${isActive ? "dark:text-white" : ""}`}
                        numberOfLines={1}
                      >
                        {cable?.cableNetwork || "Cable Provider"}
                      </ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => removeBeneficairy(cable as any)}>
                    <Trash2
                      width={15}
                      height={15}
                      color={isDark || isActive ? "#fff" : "#000"}
                      strokeWidth={2}
                    />
                  </Pressable>
                </View>
              );
            })}
            {(!cableBeneficiaries || cableBeneficiaries.length === 0) && (
              <View className="flex-1 justify-center items-center py-10">
                <ThemedText family="secondary" weight="medium" className="text-b3 text-center">
                  No cable beneficiaries found
                </ThemedText>
              </View>
            )}
          </>
        )}

        {/* electricity beneficairy section */}
        {beneficiaryType === "electricity" && (
          <>
            {electricityBeneficiaries?.map((electric, i) => {
              const TheIconss = getIconsForBeneficiary(electric as any);
              const isActive = formData.meternumber === electric.meternumber;
              return (
                <View
                  key={i}
                  className={`flex-row items-center mb-2 border py-3 rounded-[20px] px-3 border-border-light dark:border-border-dark justify-between ${isActive ? "dark:bg-[#0B2E02] !border-primary-500 bg-[#E8FFE4]" : "bg-[#F5F5F5] dark:bg-dark-700"}`}
                >
                  <Pressable
                    onPress={() => handleSelectBeneficiary(electric as any)}
                    className="flex-row items-center gap-4 flex-1"
                  >
                    <View className="w-8 h-8 justify-center items-center">
                      {TheIconss ? (
                        <TheIconss width={32} height={32} />
                      ) : (
                        <ThemedText className="bg-light-150 dark:bg-dark-700 w-8 h-8 text-center leading-8 rounded-full text-xs">
                          {electric?.provider?.charAt(0)?.toUpperCase() || "C"}
                        </ThemedText>
                      )}
                    </View>
                    <View className="flex-1">
                      <ThemedText
                        family="primary"
                        weight="medium"
                        className={`text-b2 ${isActive ? "dark:text-white" : ""}`}
                      >
                        {electric.meternumber}
                      </ThemedText>
                      <ThemedText
                        family="secondary"
                        weight="regular"
                        className={`text-b3 pt-2 ${isActive ? "dark:text-white" : ""}`}
                        numberOfLines={1}
                      >
                        {`${electric?.name || "Unknown"} | ${electric?.provider || "Electricity Provider"}`}
                      </ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => removeBeneficairy(electric as any)}>
                    <Trash2
                      width={15}
                      height={15}
                      color={isDark || isActive ? "#fff" : "#000"}
                      strokeWidth={2}
                    />
                  </Pressable>
                </View>
              );
            })}
            {(!electricityBeneficiaries || electricityBeneficiaries.length === 0) && (
              <View className="flex-1 justify-center items-center py-10">
                <ThemedText family="secondary" weight="medium" className="text-b3 text-center">
                  No electricity beneficiaries found
                </ThemedText>
              </View>
            )}
          </>
        )}

        {/* betting beneficairy section */}
        {beneficiaryType === "betting" && (
          <>
            {bettingBeneficiaries?.map((bet, i) => {
              const isActive = formData.id === bet.id && formData.provider === bet.provider;
              return (
                <View
                  key={i}
                  className={`flex-row items-center mb-2 border py-3 rounded-[20px] px-3 border-border-light dark:border-border-dark justify-between ${isActive ? "dark:bg-[#0B2E02] !border-primary-500 bg-[#E8FFE4]" : "bg-[#F5F5F5] dark:bg-dark-700"}`}
                >
                  <Pressable
                    onPress={() => handleSelectBeneficiary(bet as any)}
                    className="flex-row items-center gap-4 flex-1"
                  >
                    <View className="w-8 h-8 justify-center items-center">
                      <ThemedText className="bg-light-150 dark:bg-dark-700 w-8 h-8 text-center leading-8 rounded-full text-xs">
                        {bet?.provider?.charAt(0)?.toUpperCase() || "B"}
                      </ThemedText>
                    </View>
                    <View className="flex-1">
                      <ThemedText
                        family="primary"
                        weight="bold"
                        className={`text-b2 ${isActive ? "dark:text-white" : ""}`}
                      >
                        {bet.id}
                      </ThemedText>
                      <ThemedText
                        family="secondary"
                        weight="regular"
                        className={`text-b3 pt-2 ${isActive ? "dark:text-white" : ""}`}
                        numberOfLines={1}
                      >
                        {bet.provider}
                      </ThemedText>
                    </View>
                  </Pressable>
                  <Pressable onPress={() => removeBeneficairy(bet as any)}>
                    <Trash2
                      width={15}
                      height={15}
                      color={isDark || isActive ? "#fff" : "#000"}
                      strokeWidth={2}
                    />
                  </Pressable>
                </View>
              );
            })}
            {(!bettingBeneficiaries || bettingBeneficiaries.length === 0) && (
              <View className="flex-1 justify-center items-center py-10">
                <ThemedText family="secondary" weight="medium" className="text-b3 text-center">
                  No betting beneficiaries found
                </ThemedText>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </CustomModal>
  );
};

export default BeneficiaryModal;
