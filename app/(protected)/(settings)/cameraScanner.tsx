import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { useToast } from "@/context/ToastProvider";
import { useVerifyKycMutation } from "@/redux/auth/auth_api";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Dimensions, Image, Pressable, StyleSheet, View } from "react-native";
import Svg, { Defs, Ellipse, Mask, Rect } from "react-native-svg";

const { width, height } = Dimensions.get("window");

const CameraScanner = () => {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const toast = useToast();
    const { nin } = useAppSelector((state) => state.kyc);
    const { user } = useAppSelector((state) => state.auth);
    const [permission, requestPermission] = useCameraPermissions();
    const cameraRef = useRef<CameraView>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [countdown, setCountdown] = useState(5);
    const [isProcessing, setIsProcessing] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const [verifyKyc] = useVerifyKycMutation();

    useEffect(() => {
        if (!permission) {
            requestPermission();
        }
    }, [permission]);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isScanning && countdown > 0 && !isProcessing) {
            timer = setInterval(() => {
                setCountdown((prev) => prev - 1);
            }, 1000);
        } else if (isScanning && countdown === 0 && !isProcessing) {
            handleCapture();
        }
        return () => clearInterval(timer);
    }, [isScanning, countdown, isProcessing]);

    const handleCapture = async () => {
        if (!cameraRef.current) return;

        setIsProcessing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                base64: false,
            });

            if (photo) {
                setCapturedImage(photo.uri);
                await submitKyc(photo.uri);
            }
        } catch (error) {
            toast.showToast("Failed to capture photo", "error");
            setIsScanning(false);
            setCountdown(5);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSimulation = async () => {
        setIsProcessing(true);
        // Using a mock URI for simulation
        const mockUri = "https://picsum.photos/800/1200";
        await submitKyc(mockUri);
    };

    const submitKyc = async (photoUri: string) => {
        try {
            const token = await TokenManager.getToken();
            const formData = new FormData();
            formData.append("nin", nin || "");
            formData.append("token", token || "");
            formData.append("username", user?.user?.username || "");

            // @ts-ignore
            formData.append("photo", {
                uri: photoUri,
                type: "image/jpeg",
                name: "kyc_photo.jpg",
            });

            const response = await verifyKyc(formData).unwrap();

            if (response.status === "success") {
                toast.showToast("KYC Verification Successful", "success");
                router.push(paths.setting.kycSuccess);
            } else {
                toast.showToast(response.message || "Verification failed", "error");
                setIsScanning(false);
                setCountdown(5);
                setCapturedImage(null);
            }
        } catch (error: any) {
            toast.showToast(error?.data?.message || "Something went wrong", "error");
            setIsScanning(false);
            setCountdown(5);
            setCapturedImage(null);
        }
    };

    if (!permission) {
        return <ThemedView className="flex-1 items-center justify-center"><ActivityIndicator size="large" /></ThemedView>;
    }

    if (!permission.granted) {
        return (
            <ThemedView className="flex-1 items-center justify-center p-6">
                <ThemedText className="text-center mb-4">We need your permission to show the camera</ThemedText>
                <Pressable onPress={requestPermission} className="bg-primary-500 px-6 py-3 rounded-xl">
                    <ThemedText className="text-white font-bold">Grant Permission</ThemedText>
                </Pressable>
            </ThemedView>
        );
    }

    return (
        <View style={styles.container}>
            {capturedImage ? (
                <Image
                    source={{ uri: capturedImage }}
                    style={StyleSheet.absoluteFill}
                />
            ) : (
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="front"
                    ref={cameraRef}
                />
            )}

            {/* SVG Overlay for Masking */}
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
                <Defs>
                    <Mask id="mask" x="0" y="0" height="100%" width="100%">
                        <Rect height="100%" width="100%" fill="#fff" />
                        <Ellipse
                            cx={width / 2}
                            cy={height * 0.45}
                            rx={width * 0.35}
                            ry={height * 0.25}
                            fill="#000"
                        />
                    </Mask>
                </Defs>
                <Rect
                    height="100%"
                    width="100%"
                    fill="rgba(0,0,0,0.7)"
                    mask="url(#mask)"
                />
                {/* Dashed Border */}
                <Ellipse
                    cx={width / 2}
                    cy={height * 0.45}
                    rx={width * 0.35}
                    ry={height * 0.25}
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray="10,10"
                    fill="none"
                />
            </Svg>

            <View style={styles.content}>
                <View className="w-full">
                    <View className="flex-row items-center justify-between w-full px-6 mt-12">
                        <Pressable onPress={() => router.back()}>
                            <ChevronLeft color="white" size={24} />
                        </Pressable>
                    </View>

                    <ThemedText className="text-white text-center mt-6 text-lg font-medium">
                        Position your face in the frame.
                    </ThemedText>
                </View>

                <View className="flex-1" />

                <View className="w-full">
                    {isScanning && (
                        <View className="bg-black/60 px-4 py-2 rounded-full mb-8 flex-row items-center self-center">
                            <View className="w-4 h-4 rounded-full bg-white mr-2 items-center justify-center">
                                <ThemedText className="text-black text-[10px] font-bold">i</ThemedText>
                            </View>
                            <ThemedText className="text-white text-sm">
                                {countdown > 0 ? `Please hold for ${countdown}s` : "Please hold on while we verify your identity"}
                            </ThemedText>
                        </View>
                    )}

                    {isProcessing ? (
                        <ActivityIndicator size="large" color="#28A712" className="mb-12" />
                    ) : (
                        !isScanning && (
                            <View className="w-full px-6 mb-8">
                                <Pressable
                                    onPress={() => setIsScanning(true)}
                                    className="bg-[#28A712] py-4 rounded-full items-center mb-4 self-center w-full"
                                >
                                    <ThemedText className="text-white font-bold text-lg">Get Started</ThemedText>
                                </Pressable>

                                {__DEV__ && (
                                    <Pressable
                                        onPress={handleSimulation}
                                        className="border border-[#28A712] py-3 rounded-full items-center self-center w-full"
                                    >
                                        <ThemedText className="!text-[#28A712] font-bold">Simulate Scan (Dev mode)</ThemedText>
                                    </Pressable>
                                )}
                            </View>
                        )
                    )}

                    <View className="flex-row items-center justify-center mb-12">
                        <ThemedText className="text-white/80 text-xs text-center px-6">
                            Atrader prioritizes the security of your data
                        </ThemedText>
                    </View>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    content: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "space-between",
    },
});

export default CameraScanner;
