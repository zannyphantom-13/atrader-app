import { AuthProgress } from "@/components/auth-header";
import { PhoneInput } from "@/components/phone_dial_contries";
import { ThemedText } from "@/components/theme/themeText";
import { ThemedView } from "@/components/theme/themeView";
import { Button } from "@/components/ui/button";
import { ThemedLink } from "@/components/ui/customlink";
import {
  Checkbox,
  FormContainer,
  Input,
  PasswordInput,
} from "@/components/ui/form-fields";
import { images } from "@/constant/image";
import { useTheme } from "@/context/ThemeProvider";
import { useToast } from "@/context/ToastProvider";
import { useLocation } from "@/hooks/useLocation";
import { useRegisterMutation } from "@/redux/auth/auth_api";
import { setUserEmail } from "@/redux/auth/auth_slice";
import {
  // setAtex,
  setHasAccount,
} from "@/redux/auth/session";
import { useAppDispatch } from "@/redux/store";
import { app_config } from "@/utils/config";
import { paths } from "@/utils/paths";
import { TokenManager } from "@/utils/secure-store-adapter";
import { useRouter } from "expo-router";
import React from "react";
import { KeyboardAvoidingView, Linking, Platform, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";

type RegisterFormData = z.infer<typeof registerSchema>;

const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters")
      .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
    email: z.string().email("Please enter a valid email address"),
    phone: z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number must be less than 15 digits")
      .regex(
        /^[0-9\s-]+$/,
        "Phone number can only contain numbers and an optional leading +",
      ),
    phoneCountryCode: z.string().min(1, "Country code is required"),
    phoneDialCode: z.string().min(1, "Dial code is required"),
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be less than 20 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores",
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^a-zA-Z0-9]/,
        "Password must contain at least one special character",
      ),
    confirmPassword: z.string(),
    referralCode: z.string().optional(),
    agreeToTerms: z
      .boolean()
      .refine(
        (val) => val === true,
        "You must agree to the terms and conditions",
      ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

// const API_HOSTNAME = process.env.EXPO_PUBLIC_API_HOSTNAME;

const Register = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    username: "",
    password: "",
    phone: "",
    confirmPassword: "",
    referralCode: "",
    agreeToTerms: false,
    phoneCountryCode: "NG",
    phoneDialCode: "+234",
  });
  const toast = useToast();
  const dispatch = useAppDispatch();
  const {
    location,
    isLoading: locationLoading,
    error: locationError,
  } = useLocation();

  //   useEffect(() => {
  //   if (location) {
  //     console.log('Device location:', location);
  //     // You can use the location here if needed
  //   }

  //   if (locationError) {
  //     console.log('Location error:', locationError);
  //     // Handle location error if needed
  //   }
  // }, [location, locationError]);

  // Get device location
  // const [location, setLocation] = React.useState<{
  //   latitude: number;
  //   longitude: number;
  // accuracy: number;
  // altitude: number | null;
  // heading: number | null;
  // speed: number | null;
  //   timestamp: number;
  // } | null>(null);

  // useEffect(() => {
  //    const fetchLocation = async () => {
  //     const loc = await LocationService.getCurrentLocation();
  //     console.log('Fetched location:', loc);
  //     if (loc?.latitude && loc?.longitude) {
  //       setLocation(loc);
  //       console.log('Device location:', loc);
  //     } else {
  //       console.log('Location permission not granted or location unavailable.');
  //     }
  //   };

  //   fetchLocation();

  // }, [])

  const [register, { isLoading }] = useRegisterMutation();
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof RegisterFormData, string>>
  >({});
  const ThemeImage = isDark ? images.logoWhite : images.logoDark;

  const validateField = (field: keyof RegisterFormData, value: any) => {
    try {
      // For password matching validation, we need to check both fields
      if (field === "password" || field === "confirmPassword") {
        // Validate the entire password confirmation schema
        registerSchema.shape.confirmPassword.parse(formData.confirmPassword);
        registerSchema.shape.password.parse(formData.password);

        // Clear both password errors if validation passes
        setErrors((prev) => ({
          ...prev,
          password: "",
          confirmPassword: "",
        }));
      } else {
        // For other fields, validate individually
        const fieldSchema = registerSchema.shape[field];
        if (fieldSchema) {
          fieldSchema.parse(value);
          // Clear error if validation passes
          setErrors((prev) => ({ ...prev, [field]: "" }));
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Partial<Record<keyof RegisterFormData, string>> = {};

        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as keyof RegisterFormData;
            newErrors[fieldName] = err.message;
          }
        });

        setErrors((prev) => ({ ...prev, ...newErrors }));
        // toast.showToast("Please fix the errors in the form.", "error");
      }
    }
  };

  // Handle input changes with validation
  const handleInputChange = (
    field: keyof RegisterFormData,
    value: string | boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  // Handle phone number change
  const handlePhoneChange = (phoneNumber: string) => {
    setFormData((prev) => ({ ...prev, phone: phoneNumber }));
    validateField("phone", phoneNumber);
  };

  // Handle country change
  const handleCountryChange = (country: any) => {
    setFormData((prev) => ({
      ...prev,
      phoneCountryCode: country.code,
      phoneDialCode: country.dialCode,
    }));
    validateField("phoneCountryCode", country.code);
    validateField("phoneDialCode", country.dialCode);
  };

  const handleSubmit = async () => {
    try {
      setErrors({});

      // Validate entire form
      const validatedData = registerSchema.parse(formData);

      const payload = {
        name: validatedData.name,
        email: validatedData.email,
        username: validatedData.username,
        phone: `${validatedData.phone}`,
        // phoneCountryCode: validatedData.phoneCountryCode,
        dial_code: validatedData.phoneDialCode,
        password: validatedData.password,
        confirm: validatedData.confirmPassword,
        ref: validatedData.referralCode,
      };

      // Add your registration logic here
      const response = await register({ data: payload }).unwrap();

      toast.showToast(
        `Registration successful! ${response?.message || response?.data?.message}`,
        "success",
      );

      dispatch(setUserEmail(formData.email));
      dispatch(setHasAccount(true));
      // dispatch(setAtex(response?.token));
      await TokenManager.setToken(response?.token);

      // Navigate to OTP verification FPR registration VERIFY
      setTimeout(() => {
        router.push(`${paths.auth.confirmPin}?from=register`);
      }, 1000);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<Record<keyof RegisterFormData, string>> = {};
        error.issues.forEach((err) => {
          if (err.path.length > 0) {
            const fieldName = err.path[0] as keyof RegisterFormData;
            fieldErrors[fieldName] = err.message;
            toast.showToast(err.message, "error");
          }
        });
        setErrors(fieldErrors);
      } else {
        console.error("API error ❌:", error);

        toast.showToast(
          error?.data?.message || "Registration failed:",
          "error",
        );
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 pt-[20px] bg-background-light dark:bg-background-dark">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0} // adjust for your header
      >
        <ThemedView className="flex-1  px-[25px] " variant="background">
          <FormContainer>
            {/*  */}
            <View className=" w-full ">
              <AuthProgress currentStep={0} />

              <ThemedText
                className="text-[22px] mt-3 mb-1  "
                variant="primary"
                family="primary"
                weight="bold"
              >
                Create Account
              </ThemedText>
              <ThemedText
                className="text-b2 mb-6"
                variant="secondary"
                family="primary"
                weight="medium"
              >
                Set up your account in minute
              </ThemedText>
            </View>

            {/*  form seciton */}
            <View className="flex-row justify-between items-center w-full">
              {/* full name */}
              <Input
                className="mb-2"
                label="Full name"
                placeholder="Enter full name"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                // onBlur={() => handleInputBlur('name')}
                error={errors.name}
              />
            </View>
            {/* username */}
            <Input
              className="mb-2"
              label="Username"
              placeholder="Enter Username"
              value={formData.username}
              onChangeText={(text) => handleInputChange("username", text)}
              error={errors?.username}
            />

            {/* email */}
            <Input
              className="mb-2 w-full"
              label="Email"
              placeholder="Enter email"
              value={formData.email}
              onChangeText={(text) => handleInputChange("email", text)}
              // onBlur={() => handleInputBlur('email')}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* phone number */}
            <PhoneInput
              className="mb-2 w-full"
              label="Phone Number"
              placeholder="Enter phone number"
              value={formData.phone}
              onChangeText={handlePhoneChange}
              onChangeCountry={handleCountryChange}
              error={
                errors?.phone ||
                errors?.phoneCountryCode ||
                errors?.phoneDialCode
              }
              defaultCountry="NG"
              disableCountrySelect={true}
            />

            {/* <Button onPress={() => {
             }}>
             Try!
           </Button> */}

            {/* password */}
            <PasswordInput
              className="mb-2 w-full"
              label="Password"
              placeholder="Enter Password"
              value={formData.password}
              onChangeText={(text) => handleInputChange("password", text)}
              // onBlur={() => handleInputBlur('password')}
              error={errors.password}
            />

            {/* confirm  password */}
            <PasswordInput
              className="mb-2 w-full"
              label="Confirm password"
              placeholder="confirm your  password"
              value={formData.confirmPassword}
              onChangeText={(text) =>
                handleInputChange("confirmPassword", text)
              }
              // onBlur={() => handleInputBlur('confirmPassword')}
              error={errors.confirmPassword}
            />

            <View className="mb-2" />
            {/* Any referral code */}
            <Input
              className="mb-2 w-full"
              label="Any referral code"
              labelSecondary=" (Optional)"
              placeholder="E.g HELLO123"
              value={formData.referralCode}
              onChangeText={(text) => handleInputChange("referralCode", text)}
              error={errors?.referralCode}
              autoCapitalize="characters"
            />

            {/* referral code selection */}
            <Checkbox
              className={`my-3 ${errors.agreeToTerms ? " border-red-500 rounded" : "border-0 border-blue-600"} border`}
              checked={formData.agreeToTerms}
              // error={errors.agreeToTerms}
              onToggle={(checked) => handleInputChange("agreeToTerms", checked)}
            >
              <ThemedText variant="secondary">
                By creating account, I agree to {app_config.name}{" "}
                <ThemedText
                  variant="accent"
                  family="primary"
                  weight="bold"
                  className="text-primary-500 text-b3 underline"
                  onPress={() => Linking.openURL(app_config.termsOfServiceUrl)}
                >
                  Terms of Service
                </ThemedText>
                <ThemedText
                  variant="secondary"
                  family="primary"
                  className="text-b3"
                >
                  {" "}
                  and{" "}
                </ThemedText>
                <ThemedText
                  variant="accent"
                  family="primary"
                  weight="bold"
                  className="text-primary-500  text-b3 underline"
                  onPress={() => Linking.openURL(app_config.privacyPolicyUrl)}
                >
                  Privacy Policy
                </ThemedText>
              </ThemedText>
            </Checkbox>

            <Button
              className="w-full my-b  "
              variant="primary"
              onPress={handleSubmit}
              // onPress={() => {
              //   router.push(paths.auth.confirmPin);}
              // }
              disabled={isLoading}
              loading={isLoading}
            >
              {"Continue"}
            </Button>

            <View className="flex-row items-center mb-10 justify-center gap-1">
              <ThemedText
                variant="secondary"
                family="primary"
                weight="regular"
                className="text-b1 py-4 text-center "
              >
                Already have an account?{" "}
              </ThemedText>
              <ThemedLink
                variant="accent"
                weight="bold"
                underline={false}
                className="text-primary-500 text-b1 underline"
                onPress={() => router.push(paths.auth.login)}
              >
                Login
              </ThemedLink>
            </View>
          </FormContainer>
        </ThemedView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Register;
