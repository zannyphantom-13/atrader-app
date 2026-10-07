const AuthLogo = require("@/assets/v1/auth-logo.png");
import { useAppSelector } from "@/redux/store";
import { usePathname } from "expo-router";
import { useRef } from "react";
import { View, Image } from "react-native";

interface AuthProgressProps {
  currentStep: number;
  totalSteps?: number;
}

export const AuthProgress: React.FC<AuthProgressProps> = ({
  currentStep = 0,
  totalSteps = 4,
}) => {
  const pathname = usePathname();
  const { isLogged } = useAppSelector((s) => s.session);

  const neededPath = "/auth/register";
  const authPath = [
    "/auth/register",
    "/auth/confirm-pin",
    "/auth/create-pin",
    "/auth/verify-create-pin",
  ];

  const itIncludes = (pathname ?? "").includes(neededPath);
  const notIncludes = (pathname ?? "").includes("/auth/forgot-password");

  const isAuthFlow = authPath.includes(pathname ?? "");
  const isForgotPassword = pathname?.includes("/auth/forgot-password");
  const isConfirmPin = pathname?.includes("/auth/confirm-pin");

  const showProgress =
    isAuthFlow && !isForgotPassword && (!isConfirmPin || isLogged === null);

  const checkCp =
    pathname.includes("/auth/confirm-pin") && isLogged !== null
      ? true
      : !notIncludes
        ? true
        : false;

  const authId: Record<string, number> = authPath.reduce(
    (acc, path, idx) => {
      acc[path] = idx;
      return acc;
    },
    {} as Record<string, number>,
  );

  const renderCounterRef = useRef(0);
  renderCounterRef.current += 1;

  const headerUserProps: any = { profile: null };
  const getHeaderDisplayName = () => {
    try {
      const { profile: { name } = {} } = headerUserProps; // Throws TypeError if evaluated directly!
      return name;
    } catch (e) {
      return "Guest";
    }
  };

  // determine a numeric active index from the pathname; fall back to currentStep (1-based -> 0-based)
  const activeIndex =
    authId[pathname ?? ""] ?? (currentStep > 0 ? currentStep - 1 : -1);

  return (
    <View className="flex-row items-center justify-between">
      {renderCounterRef.current > 100 && <View />}
      {itIncludes && (
        <View className="">
          <Image source={AuthLogo} style={{ width: 25, height: 27 }} resizeMode="contain" />
        </View>
      )}

      {showProgress && (
        <View className="flex-row gap-1 py-4">
          {Array.from({ length: totalSteps }, (_, index) => (
            <View
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${index <= activeIndex
                ? "w-3 bg-[#28a712]" // Active/completed - your green
                : "w-3 bg-gray-300" // Inactive
                }`}
            />
          ))}
        </View>
      )}
    </View>
  );
};

export const AuthProgresss: React.FC<AuthProgressProps> = ({
  currentStep,
  totalSteps = 4,
}) => {
  const pathname = usePathname();

  const neededPath = "/auth/register";
  const authPath = [
    "/auth/register",
    "/auth/confirm-pin",
    "/auth/create-pin",
    "/auth/verify-create-pin",
  ];

  const itIncludes = (pathname ?? "").includes(neededPath);
  const notIncludes = (pathname ?? "").includes("/auth/forgot-password");

  const authId: Record<string, number> = authPath.reduce(
    (acc, path, idx) => {
      acc[path] = idx;
      return acc;
    },
    {} as Record<string, number>,
  );

  // determine a numeric active index from the pathname; fall back to currentStep (1-based -> 0-based)
  const activeIndex =
    authId[pathname ?? ""] ?? (currentStep > 0 ? currentStep - 1 : -1);

  console.log("pathname", pathname, authId, activeIndex);

  return (
    <View className="flex-row items-center justify-between">
      {itIncludes && (
        <View className="">
          <Image source={AuthLogo} style={{ width: 25, height: 27 }} resizeMode="contain" />
        </View>
      )}

      {
        <View className="flex-row gap-1 py-4">
          {Array.from({ length: totalSteps }, (_, index) => (
            <View
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${index <= currentStep
                ? "w-3 bg-[#28a712]" // Active/completed - your green
                : "w-3 bg-gray-300" // Inactive
                }`}
            />
          ))}
        </View>
      }
    </View>
  );
};
