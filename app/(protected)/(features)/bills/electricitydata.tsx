// import { bentypes } from "@/components/modals/beneficiarymodals";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Input } from "@/components/ui/form-fields";
import { useTheme } from "@/context/ThemeProvider";
// import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useGetBillPlanMutation } from "@/redux/bills/bills_api";
import { useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// type elect = {
//   id: string | number;
//   meternumber: string;
//   provider: string;
//   icons: React.FC<React.SVGProps<SVGSVGElement>>;
// };

const ElectricityData = () => {
  // const [selectedBeneficiary, setSelectedBeneficiary] =
  //   React.useState<bentypes>({
  //     id: "",
  //     meternumber: "",
  //     provider: "",
  //   });
  // const { isDark } = useTheme();
  const { selectedElectricity } = useAppSelector((state) => state.beneficiary);
  const router = useRouter();
  const toast = useToast();
  const [electricityDatas, setElectricityDatas] = React.useState<any>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const isMobile = Platform.OS === "ios" ? false : true;
  const { isDark } = useTheme();
  // const { atex } = useAuthToken();

  const getFirstChar = (text: string) => {
    return text.charAt(0).toUpperCase();
  };

  const [getBillPlan, { isLoading }] = useGetBillPlanMutation();

  const getElectricityData = React.useCallback(
    async (isRefresh = false) => {
      const atex = await TokenManager.getToken();
      if (!atex) {
        router.replace(paths.auth.login);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      }

      try {
        const response: any = await getBillPlan({
          data: {
            token: atex,
          },
        }).unwrap();
        if (response.status === "success") {
          console.log("Eletric Data Response:", response.data);
          setElectricityDatas(response.data);
        } else {
          toast.showToast(`${response.message}`, "error");
          console.error("Failed to fetch cable data:", response);
        }
      } catch (error) {
        toast.showToast(`An error occurred. Please try again.`, "error");
        console.error("Error fetching cable data:", error);
      } finally {
        if (isRefresh) {
          setRefreshing(false);
        }
      }
    },
    [getBillPlan],
  );

  React.useEffect(() => {
    getElectricityData();
  }, []);

  const onRefresh = React.useCallback(() => {
    getElectricityData(true);
  }, [getElectricityData]);

  const filteredCableData = React.useMemo(() => {
    if (!electricityDatas) return [];
    if (search === "") return electricityDatas;

    return electricityDatas.filter((elect: any) =>
      elect.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [electricityDatas, search]);

  const handleChangeSearch = (text: string) => {
    setSearch(text);
  };

  // const dummy = [
  //   {
  //     id: "1",
  //     meternumber: "1234567890",
  //     icons: icons.dstv,
  //     provider: "Ikeja Electricity",
  //   },
  //   {
  //     id: "2",
  //     meternumber: "0987654321",
  //     icons: icons.gotv,
  //     provider: "Jos Electricity",
  //   },
  //   {
  //     id: "3",
  //     meternumber: "1122334455",
  //     icons: icons.startimes,
  //     provider: "Abuja Electricity",
  //   },
  //   {
  //     id: "4",
  //     meternumber: "5566778899",
  //     icons: null,
  //     provider: "Ibadan Electricity",
  //   },
  //   {
  //     id: "5",
  //     meternumber: "9988776655",
  //     icons: null,
  //     provider: "Port Harcourt Electricity",
  //   },
  //   {
  //     id: "6",
  //     meternumber: "2233445566",
  //     icons: null,
  //     provider: "Enugu Electricity",
  //   },
  // ];

  const renderelectList = (elect: any) => (
    <Pressable
      onPress={() => {
        router.replace({
          pathname: paths.bills.electricity,
          params: {
            provider: elect.name,
            discoId: elect.unique_identifier,
          },
        });
      }}
      className={`flex-row items-center border-b-2 pb-5 pt-5 mt-2 rounded-xl px-3 border-light-150 dark:border-dark-700 justify-between  ${selectedElectricity?.id === elect?.unique_identifier ? "dark:bg-[#0B2E02] bg-[#E8F5E9]" : "bg-light-150 dark:bg-dark-700"}`}
    >
      <View className="flex-row items-center gap-2">
        {elect?.image ? (
          <>
            <Image
              source={{
                uri: elect?.image.startsWith("http") ? elect.image : ``,
              }}
              style={{ width: 32, height: 32 }}
              className="rounded-full"
            />
          </>
        ) : (
          <>
            <ThemedText className="bg-white dark:bg-dark-500 w-8 h-8 text-center leading-8 rounded-full text-xs">
              {getFirstChar(elect?.name || "C")}
            </ThemedText>
          </>
        )}
        <ThemedText
          family="primary"
          variant="primary"
          weight="medium"
          className="text-b2  text-center "
        >
          {elect?.name}
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <>
      <ThemedView
        className={`flex-1 ${Platform.OS === "ios" ? "" : "pt-12"}   px-[24px]`}
        style={{
          height: "100%",
        }}
      >
        {isMobile && (
          <View className="flex-row items-center  ">
            {/* Left - Back Button */}
            <Pressable
              onPress={() => router.back()}
            // style={{
            //   padding: 8,
            // }}
            >
              <Ionicons
                name="chevron-back"
                size={24}
                color={isDark ? "#ffffff" : "#000000"}
              />
            </Pressable>

            {/* Center - Title */}
            <View className="flex-1 items-center" style={{}}>
              <ThemedText className="text-md font-bold">Electricity</ThemedText>
            </View>

            {/* Right - Empty Space for Balance */}
            <View style={{ width: 40 }} />
          </View>
        )}
        <SafeAreaView className="flex-1" edges={["bottom"]}>
          {/*  search section */}
          <View className="pt-[25px]">
            <Input
              label="Choose Provider"
              placeholder="Search electricity provider"
              value={search}
              onChangeText={(text) => {
                handleChangeSearch(text);
              }}
              className=" rounded-xl px-4"
            />
          </View>
          <ThemedText
            family="primary"
            variant="primary"
            weight="bold"
            className="text-b2 mt-6"
          >
            Available Electricity Providers
          </ThemedText>
          <FlatList
            data={filteredCableData}
            keyExtractor={(item, index) =>
              `${item.unique_identifier}-${index}`
            }
            ListEmptyComponent={() => (
              <ThemedText
                family="primary"
                variant="primary"
                weight="medium"
                className="text-b2 text-center mt-16"
              >
                {search
                  ? "No Bill matches your search"
                  : "No Bill network found"}
              </ThemedText>
            )}
            renderItem={({ item }) => renderelectList(item as any)}
            className="mt-2 "
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </SafeAreaView>
      </ThemedView>
    </>
  );
};

export default ElectricityData;
