import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Input } from "@/components/ui/form-fields";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useGetCableMutation } from "@/redux/bills/bills_api";
import { useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CablePlan {
  plan_id: string;
  plan_name: string;
  amount: string;
}

interface CableProvider {
  name: string;
  image: string;
  plans: CablePlan[];
}

const CableData = () => {
  const { selectedCable } = useAppSelector((state) => state.beneficiary);
  const router = useRouter();
  const toast = useToast();
  const [cableDatas, setCableDatas] = React.useState<CableProvider[]>([]);
  const [refreshing, setRefreshing] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const { isDark } = useTheme();
  const isMobile = Platform.OS === "ios" ? false : true;
  // const { atex } = useAuthToken();

  const getFirstChar = (text: string) => {
    return text.charAt(0).toUpperCase();
  };

  const [getCable, { isLoading }] = useGetCableMutation();

  const getCableData = React.useCallback(
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
        const response: any = await getCable({
          data: {
            token: atex,
          },
        }).unwrap();

        if (response.status === "success") {
          console.log("Cable Data Response:", response);

          // Transform the object into an array
          const transformedData: CableProvider[] = Object.entries(
            response.data,
          ).map(([key, value]: [string, any]) => ({
            name: key,
            image: value.image,
            plans: value.plans || [],
          }));

          setCableDatas(transformedData);
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
    [getCable],
  );

  React.useEffect(() => {
    getCableData();
  }, []);

  const onRefresh = React.useCallback(() => {
    getCableData(true);
  }, [getCableData]);

  // Filter cable data based on search
  const filteredCableData = React.useMemo(() => {
    if (!cableDatas || cableDatas.length === 0) return [];
    if (search === "") return cableDatas;

    return cableDatas.filter((cable) =>
      cable.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [cableDatas, search]);

  const handleChangeSearch = (text: string) => {
    setSearch(text);
  };

  const rendercableList = ({ item: cable }: { item: CableProvider }) => (
    <Pressable
      onPress={() => {
        router.push({
          pathname: paths.bills.cable, // Navigate to a plans selection screen
          params: {
            cableNetwork: cable.name,
            cableImage: cable.image,
          },
        });
      }}
      className={`flex-row items-center border-b-2 pb-3 pt-3 mt-2 rounded-xl px-3 border-light-150 dark:border-dark-700 justify-between ${selectedCable?.name === cable?.name
          ? "bg-primary-500"
          : "bg-light-150 dark:bg-dark-700"
        }`}
    >
      <View className="flex-row items-center gap-3">
        {cable.image ? (
          <Image
            source={{
              uri: cable?.image?.startsWith("http") ? cable?.image : "",
            }}
            style={{ width: 48, height: 48 }}
            className="rounded-lg"
            resizeMode="contain"
          />
        ) : (
          <View className="bg-white dark:bg-dark-500 w-12 h-12 items-center justify-center rounded-lg">
            <ThemedText className="text-lg font-bold">
              {getFirstChar(cable?.name || "C")}
            </ThemedText>
          </View>
        )}
        <View className="flex-1">
          <ThemedText
            family="primary"
            variant="primary"
            weight="medium"
            className="text-b2"
          >
            {cable?.name}
          </ThemedText>
          {/* <ThemedText family="primary" variant="secondary" className="text-xs">
            {cable?.plans?.length || 0} plans available
          </ThemedText> */}
        </View>
      </View>
      {/* <Ionicons
        name="chevron-forward"
        size={20}
        color={isDark ? "#ffffff" : "#000000"}
      /> */}
    </Pressable>
  );

  return (
    <ThemedView
      className={`flex-1 ${Platform.OS === "ios" ? "" : "pt-12"} px-[24px]`}
      style={{
        height: "100%",
      }}
    >
      {isMobile && (
        <View className="flex-row items-center">
          {/* Left - Back Button */}
          <Pressable onPress={() => router.back()}>
            <Ionicons
              name="chevron-back"
              size={24}
              color={isDark ? "#ffffff" : "#000000"}
            />
          </Pressable>
          {/* Center - Title */}
          <View className="flex-1 items-center">
            <ThemedText className="text-md font-bold">
              Cable subscription
            </ThemedText>
          </View>
          {/* Right - Empty Space for Balance */}
          <View style={{ width: 40 }} />
        </View>
      )}

      <SafeAreaView className="flex-1" edges={["bottom"]}>
        {/* Search section */}
        <View className="pt-[25px]">
          <Input
            label="Choose Cable Network"
            placeholder="Search Cable Network"
            value={search}
            onChangeText={(text) => handleChangeSearch(text)}
            className="rounded-xl px-4"
          />
        </View>

        <ThemedText
          family="primary"
          variant="primary"
          weight="bold"
          className="text-b2 mt-6"
        >
          Available cable category
        </ThemedText>

        {isLoading ? (
          <ActivityIndicator size="large" className="mt-10" />
        ) : (
          <FlatList
            data={filteredCableData}
            keyExtractor={(item, index) => item.name || index.toString()}
            ListEmptyComponent={() => (
              <ThemedText
                family="primary"
                variant="primary"
                weight="medium"
                className="text-b2 text-center mt-16"
              >
                {search
                  ? "No cable network matches your search"
                  : "No cable network found"}
              </ThemedText>
            )}
            renderItem={rendercableList}
            className="mt-2"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </SafeAreaView>
    </ThemedView>
  );
};

export default CableData;
