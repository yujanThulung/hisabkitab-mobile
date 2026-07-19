import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../store/authStore"
import { NavigationContainer } from "@react-navigation/native";
import ProtectedStack from "./ProtectedStack";
import AuthStack from "./AuthStack";

const AppNavigator = () => {
    const accessToken = useAuthStore((s) => s.accessToken);
    const isHydrated = useAuthStore((s) => s.isHydrated);

    if (!isHydrated) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color="#ff6b35" />
            </View>
        )
    }

    return (
        <NavigationContainer>
            {accessToken ? <ProtectedStack /> : <AuthStack />}
        </NavigationContainer>
    )
}

export default AppNavigator;