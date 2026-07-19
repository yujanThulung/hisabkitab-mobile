import { Text, TouchableOpacity, View } from "react-native";
import { useAuthStore } from "../store/authStore";

type AppHeaderProps = {
    title: string;
}

const AppHeader = ({ title }: AppHeaderProps) => {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);

    const initials = user?.name ? user.name
        .split('')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
        : '?';

    const handleAvatarPress = () => {
        logout();
    };


    return (
        <View>
            <Text>{title}</Text>
            <TouchableOpacity>
                <Text>{initials}</Text>
            </TouchableOpacity>
        </View>
    )
} 

export default AppHeader;